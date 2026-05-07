import { Router, Request, Response } from "express";
import { db, habits, habitCompletions } from "../lib/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const allHabits = await db.select().from(habits).where(eq(habits.userEmail, userEmail)).orderBy(desc(habits.createdAt));
    res.json(allHabits);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habits" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { name, emoji, frequency } = req.body;
    const [habit] = await db.insert(habits).values({ name, emoji: emoji || "✅", frequency: frequency || "daily", userEmail }).returning();
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ error: "Failed to create habit" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { name, emoji, frequency } = req.body;
    const [habit] = await db.update(habits).set({ name, emoji, frequency }).where(and(eq(habits.id, parseInt(req.params.id)), eq(habits.userEmail, userEmail))).returning();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: "Failed to update habit" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const habitId = parseInt(req.params.id);
    await db.delete(habitCompletions).where(eq(habitCompletions.habitId, habitId));
    await db.delete(habits).where(and(eq(habits.id, habitId), eq(habits.userEmail, userEmail)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

router.get("/completions", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const completions = await db.select().from(habitCompletions).where(eq(habitCompletions.userEmail, userEmail)).orderBy(desc(habitCompletions.date));
    res.json(completions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch completions" });
  }
});

router.post("/:id/toggle", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const habitId = parseInt(req.params.id);
    const date = req.body.date || new Date().toISOString().split("T")[0];
    const existing = await db.select().from(habitCompletions).where(and(eq(habitCompletions.habitId, habitId), eq(habitCompletions.userEmail, userEmail)));
    const todayCompletion = existing.find((c) => c.date === date);
    if (todayCompletion) {
      await db.delete(habitCompletions).where(eq(habitCompletions.id, todayCompletion.id));
      return res.json({ completed: false });
    }
    await db.insert(habitCompletions).values({ habitId, date, userEmail });
    res.json({ completed: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle habit" });
  }
});

export default router;
