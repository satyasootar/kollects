import multer from "multer";
import { Request, Response, NextFunction } from "express";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// We use memoryStorage so the file is available as a Buffer (req.file.buffer)
// This avoids writing to disk temporarily, saving disk I/O, before uploading to ImageKit.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

export const validateFileMagicBytes = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  try {
    const { fileTypeFromBuffer } = await import("file-type");
    const type = await fileTypeFromBuffer(req.file.buffer);

    if (!type || !ALLOWED_MIME_TYPES.has(type.mime)) {
      return res.status(400).json({ error: "Invalid file content" });
    }

    next();
  } catch (error) {
    next(error);
  }
};
