import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  markAsRead,
  addReaction,
  removeReaction,
  deleteMessage,
  editMessage,
  exportChat,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/chat/:id", protectRoute, getMessages);
router.get("/group/:groupId", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/send-group/:groupId", protectRoute, sendMessage);
router.put("/read", protectRoute, markAsRead);
router.post("/reaction/:messageId", protectRoute, addReaction);
router.delete("/reaction/:messageId", protectRoute, removeReaction);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.get("/export/:id", protectRoute, exportChat);
router.get("/export-group/:groupId", protectRoute, exportChat);

export default router;