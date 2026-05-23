import { Router, ErrorRequestHandler } from "express";
import { upload } from "../middleware/upload";
import { MediaService } from "@repo/services/media";

const router = Router();
const mediaService = new MediaService();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { buffer, originalname } = req.file;

    const result = await mediaService.uploadFile(buffer, originalname);

    return res.status(200).json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      size: result.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message || "Failed to upload file" });
  }
});

// ... [we'll append the error handler before export]
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large" });
  }
  return res.status(500).json({ error: err.message || "Failed to upload file" });
};

router.use(errorHandler);

export default router;
