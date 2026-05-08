import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import diaryRouter from "./routes/diary";
import goalsRouter from "./routes/goals";
import gratitudeRouter from "./routes/gratitude";
import habitsRouter from "./routes/habits";
import preferencesRouter from "./routes/preferences";
import chatRouter from "./routes/chat";
import storageRouter from "./routes/storage";
import healthRouter from "./routes/health";
import pinRouter from "./routes/pin";
import analyticsRouter from "./routes/analytics";
import { authMiddleware } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 8080;
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(path.join(UPLOAD_DIR, "videos"), { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve saved video files
app.use("/uploads", express.static(UPLOAD_DIR));

// Apply auth middleware to all /api routes (verifies Google token when present)
app.use("/api", authMiddleware);

app.use("/api/diary", diaryRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/gratitude", gratitudeRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/preferences", preferencesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/storage", storageRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/pin", pinRouter);
app.use("/api/health", healthRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
