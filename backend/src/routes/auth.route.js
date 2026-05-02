import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  sendOTP,
  refreshToken,
  updatePrivacy,
  updateAutoReply,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/send-otp", sendOTP);
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes
router.post("/logout", protectRoute, logout);
router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-privacy", protectRoute, updatePrivacy);
router.put("/update-auto-reply", protectRoute, updateAutoReply);
router.get("/check", protectRoute, checkAuth);

export default router;