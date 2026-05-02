import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: function() {
        return !this.phoneNumber;
      },
      unique: true,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      required: function() {
        return !this.email;
      },
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Hey there! I am using Chatty",
      maxlength: 100,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    privacy: {
      lastSeen: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      profilePic: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      status: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
    },
    theme: {
      type: String,
      default: "coffee",
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    isOTPVerified: {
      type: Boolean,
      default: false, // Existing users will be false, new users must verify
    },
    refreshToken: {
      type: String,
      default: "",
    },
    autoReply: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default: "I'm currently busy. I'll get back to you soon!",
      },
    },
  },
  { timestamps: true }
);

// Index for search
userSchema.index({ fullName: "text", email: "text", phoneNumber: "text" });

const User = mongoose.model("User", userSchema);

export default User;