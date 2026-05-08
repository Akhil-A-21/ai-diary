import { Router, Request, Response } from "express";
import { db, moodTrends, chatMessages } from "../lib/db";
import { getUserEmail } from "../lib/getUserEmail";
import { eq, asc, desc } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });

const SYSTEM_PROMPT = `You are AI Diary, a warm, empathetic, trauma-informed emotional support companion. You listen deeply, reflect back what you hear, and help users process their feelings without judgment. You are not a therapist but you care deeply. You gently celebrate wins, validate struggles, and offer compassionate perspective. Keep responses concise (2-4 sentences) unless the user needs more. Always end with an open question or gentle observation to keep the conversation flowing.`;

// GET /api/chat/history — last 100 messages for this user
router.get("/history", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userEmail, userEmail))
      .orderBy(asc(chatMessages.createdAt))
      .limit(100);
    res.json(rows.map((r) => ({ role: r.role, content: r.content, id: r.id, createdAt: r.createdAt })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// DELETE /api/chat/history — wipe all chat history for this user
router.delete("/history", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    await db.delete(chatMessages).where(eq(chatMessages.userEmail, userEmail));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// POST /api/chat — send message, get reply, persist both
router.post("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { messages } = req.body;

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });
    const reply = response.choices[0].message;

    // Persist the latest user message + assistant reply
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      await db.insert(chatMessages).values({ userEmail, role: "user", content: lastUserMsg.content });
    }
    await db.insert(chatMessages).values({ userEmail, role: "assistant", content: reply.content ?? "" });

    // Background mood detection
    try {
      const moodDetect = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: `From this message: "${lastUserMsg?.content}", return JSON: { mood: string, score: number } (mood: happy/sad/anxious/calm/energized/reflective, score: 1-10). Return ONLY valid JSON.` }],
      });
      const moodData = JSON.parse((moodDetect.choices[0].message.content || "{}").replace(/```json\n?|\n?```/g, ""));
      await db.insert(moodTrends).values({ source: "chat", mood: moodData.mood, moodScore: moodData.score, date: new Date().toISOString().split("T")[0], userEmail });
    } catch {}

    res.json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
