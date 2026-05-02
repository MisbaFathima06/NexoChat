import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return !this.groupId;
      },
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: function() {
        return !this.receiverId;
      },
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "voice", "call", "location"],
      default: "text",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    audio: {
      type: String,
    },
    document: {
      url: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
    },
    voice: {
      url: String,
      duration: Number,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      name: String,
    },
    readReceipts: {
      sent: {
        type: Boolean,
        default: true,
      },
      delivered: {
        type: Boolean,
        default: false,
      },
      deliveredAt: {
        type: Date,
      },
      read: {
        type: Boolean,
        default: false,
      },
      readAt: {
        type: Date,
      },
      readers: {
        type: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            readAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        default: [],
      },
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    disappearingMessage: {
      enabled: {
        type: Boolean,
        default: false,
      },
      expiresAt: Date,
    },
    scheduledMessage: {
      enabled: {
        type: Boolean,
        default: false,
      },
      scheduledFor: Date,
      sent: {
        type: Boolean,
        default: false,
      },
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptedContent: {
      type: String,
    },
    isSystemMessage: {
      type: Boolean,
      default: false,
    },
    isCallLog: {
      type: Boolean,
      default: false,
    },
    callLog: {
      callId: {
        type: String,
      },
      callType: {
        type: String,
        enum: ["audio", "video"],
      },
      status: {
        type: String,
        enum: ["ringing", "missed", "ended", "rejected", "cancelled", "busy", "unavailable", "in-progress"],
        default: "ringing",
      },
      direction: {
        type: String,
        enum: ["incoming", "outgoing"],
      },
      initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      acceptedAt: Date,
      endedAt: Date,
      durationSeconds: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ "disappearingMessage.expiresAt": 1 });
messageSchema.index({ "scheduledMessage.scheduledFor": 1, "scheduledMessage.sent": 1 });
messageSchema.index({ "callLog.callId": 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;