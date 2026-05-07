import { Router, Request, Response } from "express";
import { db, pinSettings } from "../lib/db";
import { eq } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [pin] = await db.select({ enabled: pinSettings.enabled }).from(pinSettings).where(eq(pinSettings.userEmail, userEmail));
    res.json({ enabled: pin?.enabled || false });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pin settings" });
  }
});

router.post("/set", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { pin } = req.body;
    const pinHash = await bcrypt.hash(pin, 10);
    const existing = await db.select().from(pinSettings).where(eq(pinSettings.userEmail, userEmail));
    if (existing.length > 0) {
      await db.update(pinSettings).set({ pinHash, enabled: true }).where(eq(pinSettings.userEmail, userEmail));
    } else {
      await db.insert(pinSettings).values({ userEmail, pinHash, enabled: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to set PIN" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { pin } = req.body;
    const [pinSetting] = await db.select().from(pinSettings).where(eq(pinSettings.userEmail, userEmail));
    if (!pinSetting?.pinHash) return res.json({ valid: false });
    const valid = await bcrypt.compare(pin, pinSetting.pinHash);
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify PIN" });
  }
});

router.post("/disable", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    await db.update(pinSettings).set({ enabled: false }).where(eq(pinSettings.userEmail, userEmail));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to disable PIN" });
  }
});

export default router;
