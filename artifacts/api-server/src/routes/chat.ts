import { Router, Request, Response } from "express";
import { db, moodTrends } from "../lib/db";
import { getUserEmail } from "../lib/getUserEmail";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are Aura, a warm, empathetic, trauma-informed emotional support companion. You listen deeply, reflect back what you hear, and help users process their feelings without judgment. You are not a therapist but you care deeply. You gently celebrate wins, validate struggles, and offer compassionate perspective. Keep responses concise (2-4 sentences) unless the user needs more. Always end with an open question or gentle observation to keep the conversation flowing.`;

router.post("/", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { messages } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });
    const reply = response.choices[0].message;
    try {
      const moodDetect = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `From this message: "${messages[messages.length - 1]?.content}", return JSON: { mood: string, score: number } (mood: happy/sad/anxious/calm/energized/reflective, score: 1-10). Return ONLY valid JSON.` }],
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
