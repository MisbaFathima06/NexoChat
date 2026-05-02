import { generateToken, verifyRefreshToken } from "../lib/utils.js";
import { generateOTP, generateOTPExpiry, isOTPValid } from "../lib/otp.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { uploadFile, compressImage } from "../lib/gridfs.js";
import otpStorage from "../lib/otpStorage.js";
import { sendOTPEmail } from "../lib/emailService.js";

// Send OTP to email
export const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const otp = generateOTP();
    const identifier = email;

    // Store OTP
    otpStorage.set(identifier, otp, 10); // 10 minutes expiry

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
    } catch (error) {
      console.error("Error sending OTP:", error);
      otpStorage.delete(identifier); // Clean up on error
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }

    // In development, return OTP for testing (remove in production)
    const response = {
      message: "OTP sent successfully",
      expiresIn: 600, // 10 minutes in seconds
    };

    if (process.env.NODE_ENV === "development") {
      response.otp = otp; // Only in development
    }

    res.status(200).json(response);
  } catch (error) {
    console.log("Error in sendOTP controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP and Register
export const signup = async (req, res) => {
  const { fullName, email, password, otp } = req.body;
  try {
    if (!fullName || !password) {
      return res.status(400).json({ message: "Full name and password are required" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required for registration" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Verify OTP
    const identifier = email;
    const otpVerification = otpStorage.verify(identifier, otp);

    if (!otpVerification.valid) {
      return res.status(400).json({ message: otpVerification.message });
    }

    // OTP verified, proceed with registration
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      isOTPVerified: true, // Mark as OTP verified
    });

    await newUser.save();

    // Generate tokens
    const { refreshToken } = generateToken(newUser._id, res);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      profilePic: newUser.profilePic,
      status: newUser.status,
      privacy: newUser.privacy,
      theme: newUser.theme,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login with email or phone
export const login = async (req, res) => {
  const { email, phoneNumber, password } = req.body;
  try {
    if (!password || (!email && !phoneNumber)) {
      return res.status(400).json({ message: "Email/phone and password are required" });
    }

    const user = email
      ? await User.findOne({ email })
      : await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last seen and online status
    user.lastSeen = new Date();
    user.isOnline = true;
    const { refreshToken } = generateToken(user._id, res);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePic: user.profilePic,
      status: user.status,
      privacy: user.privacy,
      theme: user.theme,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Refresh Access Token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not provided" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    generateToken(user._id, res);

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
        refreshToken: "",
      });
    }

    res.cookie("jwt", "", { maxAge: 0 });
    res.cookie("refreshToken", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, status, theme } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (profilePic) {
      // Handle base64 image
      const base64Data = profilePic.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      // Compress image
      const compressedBuffer = await compressImage(buffer, 400, 80);
      
      // Upload to GridFS
      const fileData = await uploadFile({
        filename: `profile_${userId}_${Date.now()}.jpg`,
        mimetype: "image/jpeg",
        buffer: compressedBuffer,
      });
      
      // Store file ID in user profile (we'll serve it via API route)
      updateData.profilePic = `/api/files/${fileData.fileId}`;
    }
    if (fullName) updateData.fullName = fullName;
    if (status !== undefined) updateData.status = status;
    if (theme) updateData.theme = theme;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -refreshToken");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Privacy Settings
export const updatePrivacy = async (req, res) => {
  try {
    const { privacy } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { privacy },
      { new: true }
    ).select("-password -refreshToken");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updatePrivacy controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Auto-Reply Settings
export const updateAutoReply = async (req, res) => {
  try {
    const { enabled, message } = req.body;
    const userId = req.user._id;

    const updateData = {
      "autoReply.enabled": enabled !== undefined ? enabled : req.user.autoReply?.enabled,
      "autoReply.message": message || req.user.autoReply?.message,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -refreshToken");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateAutoReply controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Check Auth
export const checkAuth = (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;
    delete user.refreshToken;
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
