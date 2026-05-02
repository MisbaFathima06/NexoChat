import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addMembers,
  removeMember,
  leaveGroup,
  updateGroupSettings,
  makeAdmin,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:groupId", protectRoute, getGroupDetails);
router.put("/:groupId", protectRoute, updateGroupSettings);
router.post("/:groupId/members", protectRoute, addMembers);
router.delete("/:groupId/members/:memberId", protectRoute, removeMember);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.post("/:groupId/admin/:memberId", protectRoute, makeAdmin);

export default router;

