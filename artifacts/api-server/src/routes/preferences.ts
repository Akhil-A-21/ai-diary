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
    // Update last login time on every load (used by inactivity scheduler)
    await db.update(userPreferences).set({ lastLoginAt: new Date() }).where(eq(userPreferences.userEmail, userEmail));
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { reminderTime, reminderEnabled, inactivityAlertEnabled, friendEmail, timezone } = req.body;
    const existing = await db.select().from(userPreferences).where(eq(userPreferences.userEmail, userEmail));
    if (existing.length === 0) {
      const [prefs] = await db.insert(userPreferences).values({
        userEmail, reminderTime, reminderEnabled, inactivityAlertEnabled, friendEmail, timezone
      }).returning();
      return res.json(prefs);
    }
    const updateData: Record<string, unknown> = {};
    if (reminderTime !== undefined) updateData.reminderTime = reminderTime;
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (inactivityAlertEnabled !== undefined) updateData.inactivityAlertEnabled = inactivityAlertEnabled;
    if (friendEmail !== undefined) updateData.friendEmail = friendEmail;
    if (timezone !== undefined) updateData.timezone = timezone;

    const [prefs] = await db.update(userPreferences).set(updateData).where(eq(userPreferences.userEmail, userEmail)).returning();
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;
