import { Router } from "express";
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

export default router;
