import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

router.get("/files/:filename", (req: Request, res: Response) => {
  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  res.sendFile(filePath);
});

router.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  const domain = process.env.REPLIT_DEV_DOMAIN || "localhost:8080";
  const protocol = process.env.REPLIT_DEV_DOMAIN ? "https" : "http";
  const url = `${protocol}://${domain}/api/storage/files/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

export default router;
