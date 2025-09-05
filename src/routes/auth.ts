import { Router } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../../generated/prisma";
import { signJwt } from "../utils/jwt";

const prisma = new PrismaClient();
const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "email already in use" });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({ data: { email, hashedPassword } });
  res.status(201).json({ id: user.id, email: user.email, createdAt: user.createdAt });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return res.status(401).json({ error: "invalid credentials" });
  const token = signJwt({ id: user.id, email: user.email }, "1h");
  res.json({ token });
});

export default router;


