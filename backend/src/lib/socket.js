import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Store online users and their socket IDs
const userSocketMap = {}; // {userId: socketId}
const typingUsers = {}; // {chatId: {userId: timestamp}}
const terminalCallStatuses = new Set(["missed", "ended", "rejected", "cancelled", "busy", "unavailable"]);

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value?._id) return value._id.toString();
  return value.toString();
};

const emitMessageToParticipants = (message, eventName = "newMessage", fallbackSocket) => {
  if (!message) return;
  const payload = message.toObject ? message.toObject() : message;
  const senderId = toIdString(payload.senderId);
  const receiverId = toIdString(payload.receiverId);

  if (senderId) {
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit(eventName, payload);
    } else if (fallbackSocket && fallbackSocket.handshake?.query?.userId === senderId) {
      fallbackSocket.emit(eventName, payload);
    }
  }

  if (receiverId && receiverId !== senderId) {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(eventName, payload);
    } else if (fallbackSocket && fallbackSocket.handshake?.query?.userId === receiverId) {
      fallbackSocket.emit(eventName, payload);
    }
  }
};

const createCallLogMessage = async ({
  callId,
  callType,
  callerId,
  receiverId,
  socketInstance,
}) => {
  const normalizedReceiverId = toIdString(receiverId);
  const normalizedCallerId = toIdString(callerId);
  if (!normalizedCallerId || !normalizedReceiverId || !callId) return null;
  try {
    const callMessage = await Message.create({
      senderId: normalizedCallerId,
      receiverId: normalizedReceiverId,
      messageType: "call",
      isSystemMessage: true,
      isCallLog: true,
      callLog: {
        callId,
        callType,
        status: "ringing",
        direction: "outgoing",
        initiatedBy: normalizedCallerId,
      },
    });

    const populated = await callMessage.populate([
      { path: "senderId", select: "fullName profilePic" },
      { path: "receiverId", select: "fullName profilePic" },
    ]);

    emitMessageToParticipants(populated, "newMessage", socketInstance);
    return populated;
  } catch (error) {
    console.error("Failed to create call log:", error.message);
    return null;
  }
};

const updateCallLogStatus = async ({ callId, status, fields = {}, socketInstance }) => {
  if (!callId || !status) return;

  try {
    const callMessage = await Message.findOne({ "callLog.callId": callId });
    if (!callMessage) return;

    let resolvedStatus = status;
    if (status === "ended" && !callMessage.callLog?.acceptedAt) {
      resolvedStatus = "missed";
    }

    const updatePayload = {
      "callLog.status": resolvedStatus,
    };

    Object.entries(fields).forEach(([key, value]) => {
      updatePayload[`callLog.${key}`] = value;
    });

    if (terminalCallStatuses.has(resolvedStatus)) {
      if (!updatePayload["callLog.endedAt"]) {
        updatePayload["callLog.endedAt"] = new Date();
      }
      if (resolvedStatus === "ended" && callMessage.callLog?.acceptedAt) {
        const durationSeconds = Math.max(
          1,
          Math.round(
            (Date.now() - new Date(callMessage.callLog.acceptedAt).getTime()) / 1000
          )
        );
        updatePayload["callLog.durationSeconds"] = durationSeconds;
      }
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      callMessage._id,
      { $set: updatePayload },
      { new: true }
    )
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic");

    emitMessageToParticipants(updatedMessage, "messageUpdated", socketInstance);
  } catch (error) {
    console.error("Failed to update call log:", error.message);
  }
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Update user online status
    User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(console.error);
  }

  // Emit online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join user to their personal room
  if (userId) {
    socket.join(`user:${userId}`);
  }

  // Typing indicator
  socket.on("typing", ({ receiverId, groupId, isTyping }) => {
    const chatId = groupId || receiverId;
    
    if (isTyping) {
      if (!typingUsers[chatId]) typingUsers[chatId] = {};
      typingUsers[chatId][userId] = Date.now();
    } else {
      if (typingUsers[chatId]) {
        delete typingUsers[chatId][userId];
        if (Object.keys(typingUsers[chatId]).length === 0) {
          delete typingUsers[chatId];
        }
      }
    }

    // Emit typing status
    if (groupId) {
      socket.to(`group:${groupId}`).emit("typing", { userId, isTyping, groupId });
    } else if (receiverId) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { userId, isTyping, receiverId });
      }
    }
  });

  // Join group room
  socket.on("joinGroup", (groupId) => {
    socket.join(`group:${groupId}`);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Leave group room
  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${userId} left group ${groupId}`);
  });

  // Message delivered
  socket.on("messageDelivered", ({ messageId, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDelivered", { messageId });
    }
  });

  // Message read
  socket.on("messageRead", ({ messageIds, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesRead", { messageIds, receiverId: userId });
    }
  });

  // Voice & video call signaling ------------------------------
  socket.on("call:initiate", async ({ targetUserId, callId, callType, from }) => {
    const normalizedTargetId = toIdString(targetUserId);
    const normalizedUserId = toIdString(userId);
    if (!callId || !normalizedTargetId || !normalizedUserId) return;
    console.log("call:initiate", { callId, from: normalizedUserId, to: normalizedTargetId });
    
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    const payload = {
      callId,
      callType,
      from,
      targetUserId: normalizedTargetId,
      callerId: normalizedUserId, // Add caller ID explicitly
    };
    
    let emitted = false;
    
    // Try socket ID first (more reliable)
    if (receiverSocketId) {
      console.log("call:incoming emit to socket", {
        callId,
        from: normalizedUserId,
        to: normalizedTargetId,
        socketId: receiverSocketId,
      });
      io.to(receiverSocketId).emit("call:incoming", payload);
      emitted = true;
    }
    
    // Also emit to user room as backup (but only if socket ID didn't work)
    if (!emitted) {
      console.log("call:incoming emit to room (socket missing)", {
        callId,
        from: normalizedUserId,
        to: normalizedTargetId,
      });
      io.to(`user:${normalizedTargetId}`).emit("call:incoming", payload);
    }

    await createCallLogMessage({
      callId,
      callType,
      callerId: normalizedUserId,
      receiverId: normalizedTargetId,
      socketInstance: socket,
    });

    if (!receiverSocketId) {
      await updateCallLogStatus({
        callId,
        status: "unavailable",
        socketInstance: socket,
      });
    }
  });

  socket.on("call:accept", async ({ targetUserId, callId }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!callId || !normalizedTargetId) return;
    console.log("call:accept", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:accepted", { callId });
    }

    await updateCallLogStatus({
      callId,
      status: "in-progress",
      fields: { acceptedAt: new Date() },
      socketInstance: socket,
    });
  });

  socket.on("call:reject", async ({ targetUserId, callId }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!callId || !normalizedTargetId) return;
    console.log("call:reject", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:rejected", { callId });
    }

    await updateCallLogStatus({
      callId,
      status: "rejected",
      socketInstance: socket,
    });
  });

  socket.on("call:cancel", async ({ targetUserId, callId }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!callId || !normalizedTargetId) return;
    console.log("call:cancel", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:cancelled", { callId });
    }

    await updateCallLogStatus({
      callId,
      status: "cancelled",
      socketInstance: socket,
    });
  });

  socket.on("call:end", async ({ targetUserId, callId }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!callId || !normalizedTargetId) return;
    console.log("call:end", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ended", { callId });
    }

    await updateCallLogStatus({
      callId,
      status: "ended",
      socketInstance: socket,
    });
  });

  socket.on("call:offer", ({ targetUserId, callId, sdp }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!normalizedTargetId) return;
    console.log("call:offer", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:offer", { callId, sdp });
    }
  });

  socket.on("call:answer", ({ targetUserId, callId, sdp }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!normalizedTargetId) return;
    console.log("call:answer", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:answer", { callId, sdp });
    }
  });

  socket.on("call:ice", ({ targetUserId, callId, candidate }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!normalizedTargetId) return;
    console.log("call:ice", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ice", { callId, candidate });
    }
  });

  socket.on("call:busy", async ({ targetUserId, callId }) => {
    const normalizedTargetId = toIdString(targetUserId);
    if (!callId || !normalizedTargetId) return;
    console.log("call:busy", { callId, from: userId, to: normalizedTargetId });
    const receiverSocketId = getReceiverSocketId(normalizedTargetId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:busy", { callId });
    }

    await updateCallLogStatus({
      callId,
      status: "busy",
      socketInstance: socket,
    });
  });

  socket.on("call:debug", (payload) => {
    console.log("call:debug", payload);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    if (userId) {
    delete userSocketMap[userId];
      // Update user offline status
      User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).catch(console.error);

      // Clean up typing indicators
      Object.keys(typingUsers).forEach((chatId) => {
        if (typingUsers[chatId][userId]) {
          delete typingUsers[chatId][userId];
          if (Object.keys(typingUsers[chatId]).length === 0) {
            delete typingUsers[chatId];
          }
        }
      });
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };