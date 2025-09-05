import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import path from "path";
import fs from "fs";
import { json } from "express";

import authRouter from "./routes/auth";
import mediaRouter from "./routes/media";
import resumeRouter from "./routes/resume";
import rootRouter from "./routes/root";

const app: Application = express();
app.use(json());

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/static", express.static(path.resolve(uploadDir)));

app.use(rootRouter);
app.use("/auth", authRouter);
app.use("/media", mediaRouter);
app.use("/resume", resumeRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});


