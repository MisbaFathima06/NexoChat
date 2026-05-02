import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { encryptMessage, decryptMessage } from "../lib/encryption.js";
import { uploadFile, compressImage } from "../lib/gridfs.js";
import { sendAutoReply } from "../lib/chatbot.js";

const formatDurationLabel = (seconds = 0) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
};

const getLastMessagePreview = (message, loggedInUserId) => {
  if (!message) return "";

  const senderIdStr =
    typeof message.senderId === "object" && message.senderId !== null
      ? message.senderId.toString()
      : message.senderId;
  const isOwnMessage = senderIdStr?.toString() === loggedInUserId.toString();

  if (message.messageType === "call" || message.isCallLog || message.callLog) {
    const callType = message.callLog?.callType === "video" ? "video" : "voice";
    const label = callType === "video" ? "Video" : "Voice";
    const status = message.callLog?.status || "ended";

    switch (status) {
      case "missed":
        return isOwnMessage ? `Unanswered ${callType} call` : `Missed ${callType} call`;
      case "cancelled":
        return isOwnMessage ? `Cancelled ${callType} call` : `Missed ${callType} call`;
      case "rejected":
        return isOwnMessage ? "Call declined" : "You declined the call";
      case "busy":
        return "User busy";
      case "unavailable":
        return "User unavailable";
      case "ended": {
        const durationLabel = formatDurationLabel(message.callLog?.durationSeconds);
        return durationLabel ? `${label} call (${durationLabel})` : `${label} call`;
      }
      default:
        return `${label} call`;
    }
  }

  if (message.text) return message.text;
  if (message.image) return "📷 Image";
  if (message.video) return "🎥 Video";
  if (message.audio) return "🎵 Audio";
  if (message.document) return "📄 Document";
  if (message.voice) return "🎤 Voice";
  if (message.location) return "📍 Location";

  return "Message";
};

// Get Users for Sidebar with Search
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { search } = req.query;

    let query = { _id: { $ne: loggedInUserId } };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const filteredUsers = await User.find(query)
      .select("-password -refreshToken")
      .lean();

    // Get last message and unread count for each user
    const usersWithMessages = await Promise.all(
      filteredUsers.map(async (user) => {
        // Get last message
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .select("text image video audio document voice location createdAt senderId messageType isCallLog callLog")
          .lean();

        // Get unread count
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          "readReceipts.read": false,
        });

        return {
          ...user,
          lastMessage: lastMessage
            ? {
                text: getLastMessagePreview(lastMessage, loggedInUserId),
                timestamp: lastMessage.createdAt,
                isFromMe: lastMessage.senderId.toString() === loggedInUserId.toString(),
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by last message time (most recent first), then by name
    usersWithMessages.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return a.fullName.localeCompare(b.fullName);
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });

    res.status(200).json(usersWithMessages);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Messages with Pagination
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId, groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const myId = req.user._id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (groupId) {
      // Group messages
      query.groupId = groupId;
    } else {
      // One-to-one messages
      query.$or = [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("senderId", "fullName profilePic")
      .populate("readReceipts.readers.userId", "fullName profilePic")
      .lean();

    // Decrypt encrypted messages
    messages.forEach((msg) => {
      if (msg.isEncrypted && msg.encryptedContent) {
        msg.text = decryptMessage(msg.encryptedContent);
      }
    });

    // Mark messages as read
    if (!groupId && userToChatId) {
      await Message.updateMany(
        {
          senderId: userToChatId,
          receiverId: myId,
          "readReceipts.read": false,
        },
        {
          "readReceipts.read": true,
          "readReceipts.readAt": new Date(),
        }
      );

      // Emit read receipt
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", {
          receiverId: myId,
          messages: messages
            .filter((m) => m.senderId._id.toString() === userToChatId)
            .map((m) => m._id),
        });
      }
    }

    res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const {
      text,
      image,
      video,
      audio,
      document,
      voice,
      location,
      messageType = "text",
      isEncrypted = false,
      disappearingMessage,
      scheduledFor,
    } = req.body;
    const { id: receiverId, groupId: routeGroupId } = req.params;
    const senderId = req.user._id;
    
    // Get groupId from route params or body
    const groupId = routeGroupId || req.body.groupId;

    // Validate receiver or group
    if (!receiverId && !groupId) {
      return res.status(400).json({ message: "Receiver ID or Group ID is required" });
    }

    // Check if scheduled message
    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();

    // Prepare message data
    const messageData = {
      senderId,
      messageType,
      readReceipts: {
        sent: true,
        delivered: false,
        read: false,
      },
      scheduledMessage: {
        enabled: isScheduled,
        scheduledFor: isScheduled ? new Date(scheduledFor) : null,
        sent: false,
      },
    };

    if (groupId) {
      messageData.groupId = groupId;
      // Verify user is member of group
      const group = await Group.findById(groupId);
      if (!group || !group.members.some((m) => m.userId.toString() === senderId.toString())) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
    } else {
      messageData.receiverId = receiverId;
    }

    // Handle encryption
    if (isEncrypted && text) {
      messageData.isEncrypted = true;
      messageData.encryptedContent = encryptMessage(text);
      messageData.text = ""; // Don't store plain text
    } else if (text) {
      messageData.text = text;
    }

    // Handle media uploads using GridFS
    if (image) {
      try {
        // Remove data URL prefix if present
        const base64Data = image.includes(",") 
          ? image.split(",")[1] 
          : image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        if (buffer.length === 0) {
          console.error("Empty image buffer");
          return res.status(400).json({ message: "Invalid image data" });
        }
        
        const compressedBuffer = await compressImage(buffer, 800, 80);
        
        const fileData = await uploadFile({
          filename: `image_${senderId}_${Date.now()}.jpg`,
          mimetype: "image/jpeg",
          buffer: compressedBuffer,
        });
        messageData.image = `/api/files/${fileData.fileId}`;
        console.log("Image uploaded successfully:", messageData.image);
      } catch (error) {
        console.error("Error uploading image:", error);
        return res.status(500).json({ message: "Failed to upload image", error: error.message });
      }
    }

    if (video) {
      const base64Data = video.replace(/^data:video\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileData = await uploadFile({
        filename: `video_${senderId}_${Date.now()}.mp4`,
        mimetype: "video/mp4",
        buffer: buffer,
      });
      messageData.video = `/api/files/${fileData.fileId}`;
    }

    if (audio) {
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileData = await uploadFile({
        filename: `audio_${senderId}_${Date.now()}.mp3`,
        mimetype: "audio/mpeg",
        buffer: buffer,
      });
      messageData.audio = `/api/files/${fileData.fileId}`;
    }

    if (document) {
      const base64Data = document.url.replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileData = await uploadFile({
        filename: document.fileName || `document_${senderId}_${Date.now()}`,
        mimetype: document.mimeType || "application/octet-stream",
        buffer: buffer,
      });
      messageData.document = {
        url: `/api/files/${fileData.fileId}`,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
      };
    }

    if (voice) {
      const base64Data = voice.url.replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileData = await uploadFile({
        filename: `voice_${senderId}_${Date.now()}.webm`,
        mimetype: "audio/webm",
        buffer: buffer,
      });
      messageData.voice = {
        url: `/api/files/${fileData.fileId}`,
        duration: voice.duration,
      };
    }

    if (location) {
      if (!location.latitude || !location.longitude) {
        return res.status(400).json({ message: "Location must include latitude and longitude" });
      }
      messageData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || "",
        name: location.name || "",
      };
    }

    // Handle disappearing messages
    if (disappearingMessage?.enabled) {
      const duration = disappearingMessage.duration || 24; // hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);
      messageData.disappearingMessage = {
        enabled: true,
        expiresAt,
      };
    }

    const newMessage = new Message(messageData);

    // If not scheduled, save and send immediately
    if (!isScheduled) {
      await newMessage.save();
      await newMessage.populate("senderId", "fullName profilePic");

      // Emit to receiver(s)
      if (groupId) {
        const group = await Group.findById(groupId);
        if (group) {
          // Emit to all group members via socket room
          io.to(`group:${groupId}`).emit("newMessage", newMessage);
          
          // Also emit to individual sockets for offline members
          group.members.forEach((member) => {
            if (member.userId.toString() !== senderId.toString()) {
              const socketId = getReceiverSocketId(member.userId.toString());
              if (socketId) {
                io.to(socketId).emit("newMessage", newMessage);
              }
            }
          });
          
          // Mark as delivered
          newMessage.readReceipts.delivered = true;
          newMessage.readReceipts.deliveredAt = new Date();
          await newMessage.save();
        }
      } else {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
          // Mark as delivered
          newMessage.readReceipts.delivered = true;
          newMessage.readReceipts.deliveredAt = new Date();
          await newMessage.save();
        }
      }

      // Check for auto-reply (only for one-to-one messages with text)
      if (!groupId && receiverId && newMessage.text) {
        sendAutoReply(newMessage).catch(console.error);
      }

      // Convert to plain object to ensure all fields are included
      const messageResponse = newMessage.toObject ? newMessage.toObject() : newMessage;
      res.status(201).json(messageResponse);
    } else {
      // Save scheduled message
      await newMessage.save();
      res.status(201).json({
        message: "Message scheduled successfully",
        scheduledFor: new Date(scheduledFor),
      });
    }
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark Messages as Read
export const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    const messages = await Message.find({ _id: { $in: messageIds } });
    const directMessageIds = [];

    for (const message of messages) {
      const now = new Date();

      // Group message read tracking
      if (message.groupId) {
        if (!message.readReceipts.readers) {
          message.readReceipts.readers = [];
        }
        const alreadyReader = message.readReceipts.readers.some(
          (reader) => reader.userId.toString() === userId.toString()
        );

        if (!alreadyReader) {
          message.readReceipts.readers.push({
            userId,
            readAt: now,
          });
          message.markModified("readReceipts.readers");
          await message.save();

          // Notify group members about the new reader
          io.to(`group:${message.groupId.toString()}`).emit("groupMessageRead", {
            messageId: message._id,
            reader: {
              userId,
              fullName: req.user.fullName,
              profilePic: req.user.profilePic,
              readAt: now,
            },
          });
        }
        continue;
      }

      // One-to-one messages
      if (
        message.receiverId &&
        message.receiverId.toString() === userId.toString() &&
        !message.readReceipts.read
      ) {
        message.readReceipts.read = true;
        message.readReceipts.readAt = now;
        await message.save();
        directMessageIds.push(message._id.toString());
      }
    }

    // Emit read receipt to senders for one-to-one chats
    if (directMessageIds.length > 0) {
      const senderIds = [
        ...new Set(
          messages
            .filter((m) => !m.groupId)
            .map((m) => m.senderId.toString())
        ),
      ];

      senderIds.forEach((senderId) => {
        const socketId = getReceiverSocketId(senderId);
        if (socketId) {
          io.to(socketId).emit("messagesRead", {
            receiverId: userId,
            messageIds: directMessageIds,
          });
        }
      });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add Reaction to Message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    // Add new reaction
    message.reactions.push({
      userId,
      emoji,
    });

    await message.save();
    await message.populate("reactions.userId", "fullName profilePic");

    // Emit reaction event
    const receiverId = message.receiverId || message.groupId;
    const socketId = getReceiverSocketId(receiverId?.toString());
    if (socketId) {
      io.to(socketId).emit("messageReaction", {
        messageId: message._id,
        reaction: message.reactions[message.reactions.length - 1],
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove Reaction
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    await message.save();

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in removeReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    const FIFTEEN_MIN_MS = 15 * 60 * 1000;
    const elapsed = Date.now() - new Date(message.createdAt).getTime();
    if (elapsed > FIFTEEN_MIN_MS) {
      return res
        .status(400)
        .json({ message: "You can only delete messages within 15 minutes of sending." });
    }

    message.text = "";
    message.image = undefined;
    message.video = undefined;
    message.audio = undefined;
    message.document = undefined;
    message.voice = undefined;
    message.location = undefined;
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;

    await message.save();

    const payload = {
      messageId: message._id.toString(),
      deletedBy: userId,
      deletedAt: message.deletedAt,
    };

    if (message.groupId) {
      io.to(`group:${message.groupId.toString()}`).emit("messageDeleted", payload);
    } else {
      const receiverSocketId = getReceiverSocketId(message.receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", payload);
      }
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", payload);
      }
    }

    res.status(200).json(payload);
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit Message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    // Only text messages can be edited (not media, location, etc.)
    if (message.messageType !== "text" || (!message.text && !message.encryptedContent)) {
      return res.status(400).json({ message: "Only text messages can be edited" });
    }

    // Check time limit (15 minutes like WhatsApp)
    const FIFTEEN_MIN_MS = 15 * 60 * 1000;
    const elapsed = Date.now() - new Date(message.createdAt).getTime();
    if (elapsed > FIFTEEN_MIN_MS) {
      return res
        .status(400)
        .json({ message: "You can only edit messages within 15 minutes of sending." });
    }

    // Handle encryption if message was encrypted
    if (message.isEncrypted) {
      message.encryptedContent = encryptMessage(text.trim());
      message.text = ""; // Don't store plain text
    } else {
      message.text = text.trim();
    }

    message.edited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate("senderId", "fullName profilePic");

    // Emit updated message to receiver(s)
    const payload = {
      messageId: message._id.toString(),
      updatedMessage: message.toObject ? message.toObject() : message,
    };

    if (message.groupId) {
      io.to(`group:${message.groupId.toString()}`).emit("messageUpdated", message);
    } else {
      const receiverSocketId = getReceiverSocketId(message.receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageUpdated", message);
      }
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageUpdated", message);
      }
    }

    // Decrypt for response if needed
    const responseMessage = message.toObject ? message.toObject() : message;
    if (responseMessage.isEncrypted && responseMessage.encryptedContent) {
      responseMessage.text = decryptMessage(responseMessage.encryptedContent);
    }

    res.status(200).json(responseMessage);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export Chat (Backup)
export const exportChat = async (req, res) => {
  try {
    const { id: userToChatId, groupId } = req.params;
    const myId = req.user._id;

    let query = {};

    if (groupId) {
      query.groupId = groupId;
    } else {
      query.$or = [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName email phoneNumber")
      .populate("receiverId", "fullName email phoneNumber")
      .lean();

    // Decrypt encrypted messages
    messages.forEach((msg) => {
      if (msg.isEncrypted && msg.encryptedContent) {
        msg.text = decryptMessage(msg.encryptedContent);
      }
    });

    const chatData = {
      exportDate: new Date(),
      messages,
      metadata: {
        totalMessages: messages.length,
        dateRange: {
          from: messages[0]?.createdAt,
          to: messages[messages.length - 1]?.createdAt,
        },
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=chat-backup-${Date.now()}.json`);
    res.status(200).json(chatData);
  } catch (error) {
    console.log("Error in exportChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
