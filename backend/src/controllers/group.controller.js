import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Create Group
export const createGroup = async (req, res) => {
  try {
    const { name, description, groupPic, memberIds } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const newGroup = new Group({
      name,
      description: description || "",
      groupPic: groupPic || "",
      createdBy: userId,
      admins: [userId],
      members: [
        {
          userId,
          role: "admin",
        },
        ...(memberIds && Array.isArray(memberIds) ? memberIds.filter(id => id).map((id) => ({
          userId: id,
          role: "member",
        })) : []),
      ],
    });

    await newGroup.save();
    await newGroup.populate("members.userId", "fullName profilePic email phoneNumber");
    await newGroup.populate("admins", "fullName profilePic");
    await newGroup.populate("createdBy", "fullName profilePic");

    // Create system message for group creation
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ message: "Creator user not found" });
    }

    const systemMessage = new Message({
      senderId: userId,
      groupId: newGroup._id,
      messageType: "text",
      text: `${creator.fullName} created this group`,
      isSystemMessage: true,
      readReceipts: {
        sent: true,
        delivered: true,
        read: false,
      },
    });
    await systemMessage.save();
    await systemMessage.populate("senderId", "fullName profilePic");

    // Emit to all members via socket room
    io.to(`group:${newGroup._id}`).emit("newMessage", systemMessage);
    
    // Also emit to individual sockets for reliability
    newGroup.members.forEach((member) => {
      const socketId = getReceiverSocketId(member.userId.toString());
      if (socketId) {
        io.to(socketId).emit("newMessage", systemMessage);
      }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

// Get User Groups
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.userId": userId,
    })
      .populate("members.userId", "fullName profilePic email phoneNumber")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getUserGroups controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Group Details
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({
      _id: groupId,
      "members.userId": userId,
    })
      .populate("members.userId", "fullName profilePic email phoneNumber isOnline lastSeen")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in getGroupDetails controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add Members to Group
export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.some((adminId) => adminId.toString() === userId.toString());
    if (!isAdmin && group.settings && group.settings.onlyAdminsCanAddMembers) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // Validate memberIds
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds array is required" });
    }

    // Add new members
    const existingMemberIds = group.members.map((m) => m.userId.toString());
    const newMembers = memberIds
      .filter((id) => id && !existingMemberIds.includes(id.toString()))
      .map((id) => ({
        userId: id,
        role: "member",
      }));

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "No new members to add" });
    }

    group.members.push(...newMembers);
    await group.save();
    await group.populate("members.userId", "fullName profilePic email phoneNumber");
    
    const adder = await User.findById(userId);
    if (!adder) {
      return res.status(404).json({ message: "User not found" });
    }

    const addedUsers = await User.find({ _id: { $in: newMembers.map(m => m.userId) } });
    const addedNames = addedUsers.map(u => u.fullName).join(", ");
    
    // Create system message for member addition
    const systemMessage = new Message({
      senderId: userId,
      groupId: group._id,
      messageType: "text",
      text: `${adder.fullName} added ${addedNames}`,
      isSystemMessage: true,
      readReceipts: {
        sent: true,
        delivered: true,
        read: false,
      },
    });
    await systemMessage.save();
    await systemMessage.populate("senderId", "fullName profilePic");

    // Emit to all group members via socket room
    io.to(`group:${group._id}`).emit("newMessage", systemMessage);
    
    // Also emit to individual sockets
    group.members.forEach((member) => {
      const socketId = getReceiverSocketId(member.userId.toString());
      if (socketId) {
        io.to(socketId).emit("newMessage", systemMessage);
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in addMembers controller:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

// Remove Member from Group
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.includes(userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Remove member
    group.members = group.members.filter(
      (m) => m.userId.toString() !== memberId
    );

    // Remove from admins if they were admin
    group.admins = group.admins.filter((id) => id.toString() !== memberId);

    await group.save();
    await group.populate("members.userId", "fullName profilePic email phoneNumber");

    // Get removed user info
    const removedUser = await User.findById(memberId);
    const remover = await User.findById(userId);
    
    // Create system message for member removal
    if (removedUser && remover) {
      const systemMessage = new Message({
        senderId: userId,
        groupId: group._id,
        messageType: "text",
        text: `${remover.fullName} removed ${removedUser.fullName}`,
        isSystemMessage: true,
        readReceipts: {
          sent: true,
          delivered: true,
          read: false,
        },
      });
      await systemMessage.save();
      await systemMessage.populate("senderId", "fullName profilePic");

      // Emit to all group members
      io.to(`group:${group._id}`).emit("newMessage", systemMessage);
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in removeMember controller:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

// Leave Group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Remove member
    group.members = group.members.filter(
      (m) => m.userId.toString() !== userId.toString()
    );

    // Remove from admins
    group.admins = group.admins.filter((id) => id.toString() !== userId.toString());

    await group.save();
    await group.populate("members.userId", "fullName profilePic email phoneNumber");

    // Get user info
    const leavingUser = await User.findById(userId);
    
    // Create system message for leaving
    if (leavingUser) {
      const systemMessage = new Message({
        senderId: userId,
        groupId: group._id,
        messageType: "text",
        text: `${leavingUser.fullName} left the group`,
        isSystemMessage: true,
        readReceipts: {
          sent: true,
          delivered: true,
          read: false,
        },
      });
      await systemMessage.save();
      await systemMessage.populate("senderId", "fullName profilePic");

      // Emit to all remaining group members
      io.to(`group:${group._id}`).emit("newMessage", systemMessage);
    }

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error in leaveGroup controller:", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

// Update Group Settings
export const updateGroupSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, groupPic, settings } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.includes(userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can update group settings" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (groupPic) group.groupPic = groupPic;
    if (settings) group.settings = { ...group.settings, ...settings };

    await group.save();
    await group.populate("members.userId", "fullName profilePic email phoneNumber");

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in updateGroupSettings controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Make Admin
export const makeAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.includes(userId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can make other admins" });
    }

    // Add to admins if not already
    if (!group.admins.includes(memberId)) {
      group.admins.push(memberId);
      await group.save();
    }

    await group.populate("members.userId", "fullName profilePic email phoneNumber");

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in makeAdmin controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

