// src/middleware/upload.js
import multer, { diskStorage } from "multer";
import path from "path";
import os from "os";

export const fileAudioUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/x-m4a",
      "audio/mp4",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file format"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max file size
});

export default fileAudioUpload;
