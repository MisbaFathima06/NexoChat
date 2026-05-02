import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    groupPic: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
      },
    ],
    settings: {
      onlyAdminsCanSendMessages: {
        type: Boolean,
        default: false,
      },
      onlyAdminsCanAddMembers: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Index for search
groupSchema.index({ name: "text", description: "text" });

const Group = mongoose.model("Group", groupSchema);

export default Group;

