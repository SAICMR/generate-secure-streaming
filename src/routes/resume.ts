import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const uploadDir = process.env.UPLOAD_DIR || "uploads";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `resume-${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(201).json({ message: "No resume provided; skipping store", url: null });
  }
  res.status(201).json({ message: "Resume uploaded", url: `/static/${req.file.filename}` });
});

export default router;


