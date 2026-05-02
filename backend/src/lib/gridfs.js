import mongoose from "mongoose";
import Grid from "gridfs-stream";
import sharp from "sharp";

let gfs;
let gridfsBucket;

export const initGridFS = () => {
  const conn = mongoose.connection;
  
  // Initialize GridFS bucket
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "media",
  });

  // Initialize GridFS stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("media");

  console.log("GridFS initialized");
};

export const uploadFile = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error("GridFS not initialized"));
    }

    const { filename, mimetype, buffer } = file;
    const writeStream = gridfsBucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: options.metadata || {},
    });

    writeStream.on("error", reject);
    writeStream.on("finish", () => {
      resolve({
        fileId: writeStream.id,
        filename: writeStream.filename,
        contentType: mimetype,
      });
    });

    writeStream.end(buffer);
  });
};

export const getFile = (fileId) => {
  if (!gridfsBucket) {
    throw new Error("GridFS not initialized");
  }
  return gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

export const deleteFile = async (fileId) => {
  if (!gridfsBucket) {
    throw new Error("GridFS not initialized");
  }
  return gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
};

export const compressImage = async (buffer, maxWidth = 800, quality = 80) => {
  try {
    return await sharp(buffer)
      .resize(maxWidth, null, { withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  } catch (error) {
    console.error("Image compression error:", error);
    return buffer; // Return original if compression fails
  }
};

export const generateThumbnail = async (buffer, size = 200) => {
  try {
    return await sharp(buffer)
      .resize(size, size, { fit: "cover" })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return null;
  }
};

export const getGridFSBucket = () => {
  return gridfsBucket;
};

export { gfs, gridfsBucket };

