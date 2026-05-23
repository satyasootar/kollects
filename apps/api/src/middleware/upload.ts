import multer from "multer";

// We use memoryStorage so the file is available as a Buffer (req.file.buffer)
// This avoids writing to disk temporarily, saving disk I/O, before uploading to ImageKit.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
