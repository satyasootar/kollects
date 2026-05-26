import { Router, ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { upload, validateFileMagicBytes } from "../middleware/upload";
import { MediaService } from "@repo/services/media";
import { AuthService } from "@repo/services/auth";

const router = Router();
const mediaService = new MediaService();
const authService = new AuthService();

const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads, please try again later." },
});

router.post("/", uploadRateLimit, upload.single("file"), validateFileMagicBytes, async (req, res) => {
  try {
    const sessionToken = req.headers.cookie?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
    const authHeader = req.headers.authorization;
    let apiKey: string | undefined;
    if (authHeader?.startsWith("Bearer ") && authHeader.slice(7).trim().startsWith("sk_live_")) {
      apiKey = authHeader.slice(7).trim();
    }

    const resolved = await authService.resolveUser({ sessionToken, apiKey });
    if (!resolved) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
    // Sanitize error to avoid leaking ImageKit/SDK credential details
    return res
      .status(500)
      .json({ error: "Failed to upload file due to an internal server error." });
  }
});

// ... [we'll append the error handler before export]
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 5MB." });
  }
  if (err.message === "Invalid file type") {
    return res.status(400).json({ error: "Invalid file type" });
  }
  return res.status(500).json({ error: "Failed to upload file" });
};

router.use(errorHandler);

export default router;
