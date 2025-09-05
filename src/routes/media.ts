import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient, MediaType } from "../../generated/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { signJwt } from "../utils/jwt";

const prisma = new PrismaClient();
const router = Router();

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  const { title, type } = req.body as { title: string; type: "video" | "audio" };
  if (!req.file) return res.status(400).json({ error: "file is required" });
  if (!title || !type) return res.status(400).json({ error: "title and type required" });
  const media = await prisma.mediaAsset.create({
    data: {
      title,
      type: type as MediaType,
      fileUrl: `/static/${req.file.filename}`,
      adminId: req.user!.id,
    },
  });
  res.status(201).json(media);
});

router.get("/:id/stream-url", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: "invalid id" });
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return res.status(404).json({ error: "not found" });
  const token = signJwt({ mid: asset.id }, "10m");
  const url = `/media/stream?token=${encodeURIComponent(token)}`;
  res.json({ url, expiresInSeconds: 600 });
});

router.get("/stream", async (req, res) => {
  const token = (req.query.token as string) || "";
  // We'll verify in a lightweight way on the client of this route
  // The static server serves the file; here we simply redirect to it if token valid
  const jwt = require("jsonwebtoken");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret") as { mid: string };
    const asset = await prisma.mediaAsset.findUnique({ where: { id: payload.mid } });
    if (!asset) return res.status(404).json({ error: "not found" });
    // record view
    const clientIp = (req.ip as string) || (req.headers["x-forwarded-for"] as string) || (req.socket?.remoteAddress as string) || "unknown";
    await prisma.mediaViewLog.create({ data: { mediaId: asset.id, viewedByIp: clientIp } });
    return res.redirect(asset.fileUrl);
  } catch {
    return res.status(401).json({ error: "link expired or invalid" });
  }
});

// Log a view explicitly via API
router.post("/:id/view", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: "invalid id" });
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return res.status(404).json({ error: "not found" });
  const clientIp = (req.ip as string) || (req.headers["x-forwarded-for"] as string) || "unknown";
  await prisma.mediaViewLog.create({ data: { mediaId: id, viewedByIp: clientIp } });
  res.status(201).json({ message: "view logged" });
});

// Aggregated analytics for a media item
router.get("/:id/analytics", requireAuth, async (req, res) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: "invalid id" });
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return res.status(404).json({ error: "not found" });

  const logs = await prisma.mediaViewLog.findMany({
    where: { mediaId: id },
    orderBy: { timestamp: "asc" },
  });

  const totalViews = logs.length;
  const uniqueIps = new Set(logs.map(l => l.viewedByIp)).size;
  const viewsPerDay: Record<string, number> = {};
  for (const l of logs) {
    const d = new Date(l.timestamp);
    const key = d.toISOString().slice(0,10);
    viewsPerDay[key] = (viewsPerDay[key] || 0) + 1;
  }
  res.json({ total_views: totalViews, unique_ips: uniqueIps, views_per_day: viewsPerDay });
});

export default router;


