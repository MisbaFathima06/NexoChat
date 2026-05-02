import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "./socket.js";

// Simple rule-based auto-reply system
const autoReplyRules = [
  {
    keywords: ["hello", "hi", "hey"],
    responses: ["Hello! How can I help you?", "Hi there! I'm currently busy, but I'll get back to you soon.", "Hey! Thanks for your message. I'll reply when I'm available."],
  },
  {
    keywords: ["urgent", "important", "asap"],
    responses: ["I see this is important. I'll prioritize your message and get back to you as soon as possible."],
  },
  {
    keywords: ["meeting", "call", "schedule"],
    responses: ["I'm currently unavailable. Please leave a message and I'll get back to you regarding scheduling."],
  },
  {
    keywords: ["question", "help", "support"],
    responses: ["Thanks for reaching out! I'm currently busy, but I'll help you as soon as I can."],
  },
];

export const generateAutoReply = (messageText, userAutoReplyMessage) => {
  if (!messageText) return null;

  const lowerText = messageText.toLowerCase();

  // Check for matching keywords
  for (const rule of autoReplyRules) {
    if (rule.keywords.some((keyword) => lowerText.includes(keyword))) {
      const randomResponse = rule.responses[Math.floor(Math.random() * rule.responses.length)];
      return randomResponse;
    }
  }

  // Default auto-reply message
  return userAutoReplyMessage || "I'm currently busy. I'll get back to you soon!";
};

export const sendAutoReply = async (receivedMessage) => {
  try {
    const receiver = await User.findById(receivedMessage.receiverId);
    
    if (!receiver || !receiver.autoReply?.enabled) {
      return;
    }

    const autoReplyText = generateAutoReply(
      receivedMessage.text,
      receiver.autoReply.message
    );

    if (!autoReplyText) return;

    // Create auto-reply message
    const autoReplyMessage = new Message({
      senderId: receiver._id,
      receiverId: receivedMessage.senderId,
      text: autoReplyText,
      messageType: "text",
      readReceipts: {
        sent: true,
        delivered: false,
        read: false,
      },
    });

    await autoReplyMessage.save();
    await autoReplyMessage.populate("senderId", "fullName profilePic");

    // Emit to sender
    const senderSocketId = getReceiverSocketId(receivedMessage.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", autoReplyMessage);
      autoReplyMessage.readReceipts.delivered = true;
      await autoReplyMessage.save();
    }

    console.log(`Auto-reply sent from ${receiver.fullName} to ${receivedMessage.senderId}`);
  } catch (error) {
    console.error("Error in sendAutoReply:", error);
  }
};

