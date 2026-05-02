import cron from "node-cron";
import Message from "../models/message.model.js";
import { io, getReceiverSocketId } from "./socket.js";

// Delete disappearing messages every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredMessages = await Message.find({
      "disappearingMessage.enabled": true,
      "disappearingMessage.expiresAt": { $lte: now },
    });

    if (expiredMessages.length > 0) {
      const messageIds = expiredMessages.map((m) => m._id);
      
      // Emit delete events before deleting
      expiredMessages.forEach((message) => {
        const receiverId = message.receiverId || message.groupId;
        const socketId = getReceiverSocketId(receiverId?.toString());
        if (socketId) {
          io.to(socketId).emit("messageDeleted", { messageId: message._id });
        }
      });

      await Message.deleteMany({ _id: { $in: messageIds } });
      console.log(`Deleted ${expiredMessages.length} disappearing messages`);
    }
  } catch (error) {
    console.error("Error in disappearing messages cron job:", error);
  }
});

// Send scheduled messages every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const scheduledMessages = await Message.find({
      "scheduledMessage.enabled": true,
      "scheduledMessage.sent": false,
      "scheduledMessage.scheduledFor": { $lte: now },
    }).populate("senderId", "fullName profilePic");

    for (const message of scheduledMessages) {
      // Mark as sent
      message.scheduledMessage.sent = true;
      await message.save();

      // Emit to receiver(s)
      if (message.groupId) {
        // Group message
        io.to(`group:${message.groupId}`).emit("newMessage", message);
      } else if (message.receiverId) {
        // One-to-one message
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", message);
          message.readReceipts.delivered = true;
          await message.save();
        }
      }

      console.log(`Sent scheduled message ${message._id}`);
    }
  } catch (error) {
    console.error("Error in scheduled messages cron job:", error);
  }
});

console.log("Cron jobs initialized");

