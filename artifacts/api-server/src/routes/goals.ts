import { Router, Request, Response } from "express";
import { db, goals, goalMilestones } from "../lib/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });

router.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const allGoals = await db.select().from(goals).where(eq(goals.userEmail, userEmail)).orderBy(desc(goals.createdAt));
    res.json(allGoals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.get("/latest-with-milestones", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [goal] = await db.select().from(goals).where(and(eq(goals.userEmail, userEmail), eq(goals.status, "active"))).orderBy(desc(goals.createdAt)).limit(1);
    if (!goal) return res.json(null);
    const milestones = await db.select().from(goalMilestones).where(eq(goalMilestones.goalId, goal.id)).orderBy(goalMilestones.order);
    res.json({ ...goal, milestones });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { title, description, targetDate } = req.body;
    const [goal] = await db.insert(goals).values({ title, description, targetDate, userEmail }).returning();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { title, description, targetDate, status, progress } = req.body;
    const [goal] = await db.update(goals).set({ title, description, targetDate, status, progress }).where(and(eq(goals.id, parseInt(req.params.id)), eq(goals.userEmail, userEmail))).returning();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const goalId = parseInt(req.params.id);
    await db.delete(goalMilestones).where(eq(goalMilestones.goalId, goalId));
    await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userEmail, userEmail)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

router.get("/:id/milestones", async (req: Request, res: Response) => {
  try {
    const milestones = await db.select().from(goalMilestones).where(eq(goalMilestones.goalId, parseInt(req.params.id))).orderBy(goalMilestones.order);
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

router.post("/:id/milestones/generate", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const goalId = parseInt(req.params.id);
    const [goal] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userEmail, userEmail)));
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: `Generate 4-6 concrete actionable milestones for this goal: "${goal.title}". Description: ${goal.description || "none"}. Return JSON: { milestones: [{ title: string }] }. Return ONLY valid JSON.` }],
    });
    let result = { milestones: [] as { title: string }[] };
    try { result = JSON.parse((response.choices[0].message.content || "{}").replace(/```json\n?|\n?```/g, "")); } catch {}
    const created = await Promise.all(result.milestones.map((m, i) => db.insert(goalMilestones).values({ goalId, title: m.title, order: i, userEmail }).returning().then((r) => r[0])));
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate milestones" });
  }
});

router.post("/:id/milestones", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { title } = req.body;
    const [milestone] = await db.insert(goalMilestones).values({ goalId: parseInt(req.params.id), title, userEmail }).returning();
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed to create milestone" });
  }
});

router.put("/:id/milestones/:milestoneId", async (req: Request, res: Response) => {
  try {
    const { completed, title } = req.body;
    const [milestone] = await db.update(goalMilestones).set({ completed, title }).where(eq(goalMilestones.id, parseInt(req.params.milestoneId))).returning();
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: "Failed to update milestone" });
  }
});

router.delete("/:id/milestones/:milestoneId", async (req: Request, res: Response) => {
  try {
    await db.delete(goalMilestones).where(eq(goalMilestones.id, parseInt(req.params.milestoneId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});

export default router;
