import express from "express";
import { getFile, getGridFSBucket } from "../lib/gridfs.js";
import mongoose from "mongoose";

const router = express.Router();

// Serve files from GridFS
router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const gridfsBucket = getGridFSBucket();
    
    if (!gridfsBucket) {
      return res.status(503).json({ message: "File service not available" });
    }

    // Get file metadata first
    const files = await gridfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = files[0];

    // Set appropriate headers
    res.set({
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Length": file.length,
      "Content-Disposition": `inline; filename="${file.filename}"`,
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
    });

    // Get download stream and pipe to response
    const downloadStream = getFile(fileId);
    
    downloadStream.on("error", (error) => {
      console.error("Error serving file:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error serving file" });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error in file route:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

export default router;
