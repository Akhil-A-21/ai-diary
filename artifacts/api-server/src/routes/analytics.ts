import { Router, Request, Response } from "express";
import { db, diaryEntries, moodTrends, habitCompletions, habits } from "../lib/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";

const router = Router();

router.get("/resilience", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const trends = await db.select().from(moodTrends).where(eq(moodTrends.userEmail, userEmail)).orderBy(desc(moodTrends.createdAt)).limit(30);
    const scores = trends.filter((t) => t.moodScore).map((t) => t.moodScore!);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 5;
    const variance = scores.length > 1 ? scores.reduce((acc, s) => acc + Math.pow(s - avgScore, 2), 0) / scores.length : 0;
    const resilienceScore = Math.max(1, Math.min(10, avgScore - variance * 0.2));
    res.json({
      score: Math.round(resilienceScore * 10) / 10,
      avgMoodScore: Math.round(avgScore * 10) / 10,
      trend: scores.length > 5 ? (scores[0] > scores[scores.length - 1] ? "improving" : "declining") : "stable",
      dataPoints: scores.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute resilience" });
  }
});

router.get("/year-in-pixels", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const year = req.query.year || new Date().getFullYear();
    const entries = await db.select({ entryDate: diaryEntries.entryDate, mood: diaryEntries.mood, title: diaryEntries.title, id: diaryEntries.id })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userEmail, userEmail), sql`EXTRACT(YEAR FROM ${diaryEntries.createdAt}) = ${year}`));
    const pixels: Record<string, { mood: string; title: string; id: number }> = {};
    for (const e of entries) { pixels[e.entryDate] = { mood: e.mood || "neutral", title: e.title, id: e.id }; }
    res.json(pixels);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch year in pixels" });
  }
});

router.get("/habit-stats", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const allHabits = await db.select().from(habits).where(eq(habits.userEmail, userEmail));
    const completions = await db.select().from(habitCompletions).where(eq(habitCompletions.userEmail, userEmail));
    const stats = allHabits.map((habit) => {
      const habitCompletionList = completions.filter((c) => c.habitId === habit.id);
      const dates = habitCompletionList.map((c) => c.date).sort().reverse();
      let streak = 0;
      const dateSet = new Set(dates);
      const check = new Date();
      while (dateSet.has(check.toISOString().split("T")[0])) { streak++; check.setDate(check.getDate() - 1); }
      return { ...habit, streak, totalCompletions: habitCompletionList.length, lastCompleted: dates[0] || null };
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch habit stats" });
  }
});

export default router;
