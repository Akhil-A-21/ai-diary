import { Router, Request, Response } from "express";
import { db, userPreferences } from "../lib/db";
import { eq } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    let [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userEmail, userEmail));
    if (!prefs) {
      [prefs] = await db.insert(userPreferences).values({ userEmail }).returning();
    }
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { reminderTime, reminderEnabled, inactivityAlertEnabled, friendEmail } = req.body;
    const existing = await db.select().from(userPreferences).where(eq(userPreferences.userEmail, userEmail));
    if (existing.length === 0) {
      const [prefs] = await db.insert(userPreferences).values({ userEmail, reminderTime, reminderEnabled, inactivityAlertEnabled, friendEmail }).returning();
      return res.json(prefs);
    }
    const [prefs] = await db.update(userPreferences).set({ reminderTime, reminderEnabled, inactivityAlertEnabled, friendEmail }).where(eq(userPreferences.userEmail, userEmail)).returning();
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;
