import { Router, Request, Response } from "express";
import { db, gratitudeEntries } from "../lib/db";
import { eq, desc } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const entries = await db.select().from(gratitudeEntries).where(eq(gratitudeEntries.userEmail, userEmail)).orderBy(desc(gratitudeEntries.date));
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gratitude entries" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { item1, item2, item3, date } = req.body;
    const today = date || new Date().toISOString().split("T")[0];
    const existing = await db.select().from(gratitudeEntries).where(eq(gratitudeEntries.userEmail, userEmail));
    const todayEntry = existing.find((e) => e.date === today);
    if (todayEntry) {
      const [updated] = await db.update(gratitudeEntries).set({ item1, item2, item3 }).where(eq(gratitudeEntries.id, todayEntry.id)).returning();
      return res.json(updated);
    }
    const [entry] = await db.insert(gratitudeEntries).values({ item1, item2, item3, date: today, userEmail }).returning();
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save gratitude entry" });
  }
});

export default router;
