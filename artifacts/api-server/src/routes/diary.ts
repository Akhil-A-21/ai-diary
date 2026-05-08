import { Router, Request, Response } from "express";
import multer from "multer";
import { db, diaryEntries, moodTrends } from "../lib/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";
import OpenAI from "openai";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.get("/entries", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { search } = req.query;
    const entries = await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userEmail, userEmail),
          search ? ilike(diaryEntries.title, `%${search}%`) : undefined
        )
      )
      .orderBy(desc(diaryEntries.createdAt));
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

router.get("/entries/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [entry] = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, parseInt(req.params.id)), eq(diaryEntries.userEmail, userEmail)));
    if (!entry) return res.status(404).json({ error: "Not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

router.post("/entries", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { title, entryDate, tags, videoUrl, thumbnailUrl } = req.body;
    const [entry] = await db
      .insert(diaryEntries)
      .values({ title, entryDate: entryDate || new Date().toISOString().split("T")[0], tags: tags || [], videoUrl, thumbnailUrl, userEmail })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

router.put("/entries/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { title, tags, videoUrl, thumbnailUrl } = req.body;
    const [entry] = await db
      .update(diaryEntries)
      .set({ title, tags, videoUrl, thumbnailUrl })
      .where(and(eq(diaryEntries.id, parseInt(req.params.id)), eq(diaryEntries.userEmail, userEmail)))
      .returning();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to update entry" });
  }
});

router.delete("/entries/:id", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    await db.delete(diaryEntries).where(and(eq(diaryEntries.id, parseInt(req.params.id)), eq(diaryEntries.userEmail, userEmail)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

router.post("/entries/:id/analyze", upload.single("video"), async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const entryId = parseInt(req.params.id);
    let transcript = "";
    let transcriptionError = false;

    // ── Step 1: Transcribe audio via Whisper ──
    // Always use Whisper — never rely on the browser for transcription.
    // The lang field is an ISO 639-1 code (e.g. "ml", "hi", "en") sent from the frontend.
    // req.body may be undefined if multer skips body parsing (no/empty multipart body).
    const recordingLang: string = ((req.body as any)?.lang as string) || "en";

    if (req.file) {
      const tmpPath = path.join(os.tmpdir(), `video_${Date.now()}.webm`);
      try {
        fs.writeFileSync(tmpPath, req.file.buffer);
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tmpPath) as any,
          model: "whisper-1",
          language: recordingLang,   // tells Whisper which language to expect
          response_format: "text",
        });
        transcript = (transcription as unknown as string).trim();
      } catch (whisperErr: any) {
        console.error("Whisper transcription failed:", whisperErr?.message || whisperErr);
        transcriptionError = true;
        transcript = `Voice diary entry recorded on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. Transcription is temporarily unavailable.`;
      } finally {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    }

    if (!transcript) {
      transcript = `Diary entry recorded on ${new Date().toLocaleDateString()}.`;
    }

    // ── Step 2: Keyword-based mood fallback (used when GPT is unavailable) ──
    const keywordMoods: { mood: string; score: number; words: string[] }[] = [
      { mood: "happy", score: 8, words: ["happy", "joy", "joyful", "excited", "great", "amazing", "wonderful", "fantastic", "love", "laugh", "fun", "awesome", "good", "nice", "pleased", "delighted"] },
      { mood: "grateful", score: 8, words: ["grateful", "thankful", "blessed", "appreciate", "appreciation", "gratitude", "fortunate", "lucky"] },
      { mood: "anxious", score: 4, words: ["anxious", "anxiety", "nervous", "worried", "worry", "stress", "stressed", "overwhelmed", "panic", "fear", "scared", "dread"] },
      { mood: "sad", score: 3, words: ["sad", "unhappy", "depressed", "miserable", "upset", "cry", "crying", "tears", "grief", "lonely", "hopeless", "down"] },
      { mood: "angry", score: 3, words: ["angry", "anger", "furious", "frustrated", "frustration", "annoyed", "irritated", "mad", "rage"] },
      { mood: "calm", score: 7, words: ["calm", "peaceful", "relaxed", "serene", "tranquil", "content", "quiet", "still", "comfortable"] },
      { mood: "energized", score: 8, words: ["energized", "motivated", "productive", "accomplished", "active", "strong", "confident", "focused", "driven"] },
      { mood: "reflective", score: 6, words: ["think", "thinking", "thought", "wonder", "wondering", "reflect", "reflection", "consider", "ponder", "realize", "realize", "introspect"] },
    ];

    const detectMoodFromText = (text: string): { mood: string; moodScore: number; energyLevel: number } => {
      const lower = text.toLowerCase();
      let bestMood = "reflective";
      let bestScore = 6;
      let bestCount = 0;
      for (const { mood, score, words } of keywordMoods) {
        const count = words.filter((w) => lower.includes(w)).length;
        if (count > bestCount) { bestCount = count; bestMood = mood; bestScore = score; }
      }
      const energyMap: Record<string, number> = { happy: 8, grateful: 7, anxious: 5, sad: 3, angry: 6, calm: 5, energized: 9, reflective: 5 };
      return { mood: bestMood, moodScore: bestScore, energyLevel: energyMap[bestMood] ?? 5 };
    };

    const isEnglish = recordingLang.startsWith("en");
    const keywordAnalysis = (transcriptionError || !isEnglish) ? null : detectMoodFromText(transcript);

    // Build a readable summary from the transcript without needing GPT
    const buildFallbackSummary = (text: string): string => {
      // For non-English: return the raw transcript sentences as the summary
      const sentences = text
        .replace(/([.!?।]\s+)/g, "$1\n")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
      const core = sentences.length > 0
        ? sentences.slice(0, 3).join(" ")
        : (text.length > 240 ? text.slice(0, 240) + "…" : text);
      if (!isEnglish) return core;
      // English: add a mood-aware opener
      const mood = keywordAnalysis?.mood ?? "reflective";
      const moodPhrases: Record<string, string> = {
        happy: "You seemed in great spirits as you shared",
        grateful: "A warm sense of gratitude came through as you shared",
        anxious: "You expressed some stress and worry as you shared",
        sad: "There was a sense of sadness as you shared",
        angry: "Some frustration came through as you shared",
        calm: "You sounded calm and grounded as you shared",
        energized: "You were full of energy and motivation as you shared",
        reflective: "In a thoughtful mood, you shared",
      };
      const opener = moodPhrases[mood] ?? "You shared";
      const firstSentence = sentences[0]?.replace(/^I /, "that you ") ?? core;
      return `${opener}: ${firstSentence}${sentences.length > 1 ? " " + sentences.slice(1, 3).join(" ") : ""}`;
    };

    let analysis: { mood: string; moodScore: number; energyLevel: number; summary: string; triggers: string[] } = {
      mood: keywordAnalysis?.mood ?? "reflective",
      moodScore: keywordAnalysis?.moodScore ?? 6,
      energyLevel: keywordAnalysis?.energyLevel ?? 5,
      summary: transcriptionError
        ? "Your entry has been saved. Speak clearly into your microphone next time for transcription."
        : buildFallbackSummary(transcript),
      triggers: [],
    };

    try {
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an empathetic emotional intelligence AI fluent in all languages including Malayalam, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Urdu, and English. Analyze this diary entry and return JSON with: mood (string: happy/sad/anxious/calm/energized/reflective/grateful), moodScore (1-10), energyLevel (1-10), summary (2-3 warm empathetic sentences written in the EXACT SAME language as the diary entry — if it is Malayalam write in Malayalam, if Hindi write in Hindi, etc.), triggers (array of 1-3 short strings in the same language as the diary entry). Return ONLY valid JSON, no markdown." },
          { role: "user", content: transcript },
        ],
      });
      const content = analysisResponse.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
      if (parsed.mood) analysis = { ...analysis, ...parsed };
    } catch (gptErr: any) {
      console.error("GPT analysis failed:", gptErr?.message || gptErr);
      // analysis stays as fallback — entry still saves
    }

    // ── Step 3: Persist to DB ──
    const [updated] = await db
      .update(diaryEntries)
      .set({
        transcript,
        mood: analysis.mood,
        moodScore: analysis.moodScore,
        energyLevel: analysis.energyLevel,
        summary: analysis.summary,
        triggers: analysis.triggers,
      })
      .where(and(eq(diaryEntries.id, entryId), eq(diaryEntries.userEmail, userEmail)))
      .returning();

    // Insert mood trend (best-effort)
    try {
      await db.insert(moodTrends).values({
        source: "diary",
        mood: analysis.mood,
        moodScore: analysis.moodScore,
        date: new Date().toISOString().split("T")[0],
        userEmail,
      });
    } catch {}

    res.json({ ...updated, analysis });
  } catch (err: any) {
    console.error("Analyze route error:", err?.message || err);
    console.error("Stack:", err?.stack);
    res.status(500).json({ error: err?.message || "Analysis failed" });
  }
});

router.post("/entries/:id/detect-goals", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [entry] = await db.select().from(diaryEntries).where(and(eq(diaryEntries.id, parseInt(req.params.id)), eq(diaryEntries.userEmail, userEmail)));
    if (!entry?.transcript) return res.json({ goals: [] });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Extract any goals or aspirations mentioned in this diary entry. Return JSON: { goals: [{ title: string, description: string, milestones: string[] }] }. Return ONLY valid JSON." },
        { role: "user", content: entry.transcript },
      ],
    });
    let result = { goals: [] as { title: string; description: string; milestones: string[] }[] };
    try { result = JSON.parse((response.choices[0].message.content || "{}").replace(/```json\n?|\n?```/g, "")); } catch {}
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Goal detection failed" });
  }
});

router.get("/entries/:id/pdf", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [entry] = await db.select().from(diaryEntries).where(and(eq(diaryEntries.id, parseInt(req.params.id)), eq(diaryEntries.userEmail, userEmail)));
    if (!entry) return res.status(404).json({ error: "Not found" });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="diary-${entry.id}.pdf"`);
    doc.pipe(res);
    doc.fontSize(24).text(entry.title, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${entry.entryDate}`);
    doc.text(`Mood: ${entry.mood || "N/A"} (Score: ${entry.moodScore || "N/A"})`);
    doc.text(`Energy: ${entry.energyLevel || "N/A"}/10`);
    doc.moveDown();
    if (entry.summary) { doc.fontSize(14).text("Summary"); doc.fontSize(11).text(entry.summary); doc.moveDown(); }
    if (entry.transcript) { doc.fontSize(14).text("Transcript"); doc.fontSize(11).text(entry.transcript); }
    doc.end();
  } catch (err) {
    res.status(500).json({ error: "PDF generation failed" });
  }
});

router.get("/mood-trends", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const trends = await db.select().from(moodTrends).where(eq(moodTrends.userEmail, userEmail)).orderBy(desc(moodTrends.createdAt)).limit(60);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mood trends" });
  }
});

router.get("/streak", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const entries = await db.select({ entryDate: diaryEntries.entryDate }).from(diaryEntries).where(eq(diaryEntries.userEmail, userEmail)).orderBy(desc(diaryEntries.entryDate));
    const totalEntries = entries.length;
    let streak = 0;
    const dates = new Set(entries.map((e) => e.entryDate));
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.has(dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
    }
    res.json({ streak, totalEntries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch streak" });
  }
});

const FALLBACK_QUOTES = [
  "Every day is a new beginning. Take a deep breath, smile, and start again.",
  "You are stronger than you think, braver than you believe, and more loved than you know.",
  "Small steps every day lead to big changes over time. Keep going.",
  "Your story isn't over yet — the best chapters are still being written.",
  "Progress, not perfection, is the goal. You're doing better than you know.",
];

router.get("/motivational-quote", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [latest] = await db.select({ mood: diaryEntries.mood }).from(diaryEntries).where(eq(diaryEntries.userEmail, userEmail)).orderBy(desc(diaryEntries.createdAt)).limit(1);
    const mood = latest?.mood || "neutral";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Give me a short inspiring motivational quote (max 2 sentences) for someone feeling ${mood}. Return just the quote.` }],
      });
      res.json({ quote: response.choices[0].message.content, mood });
    } catch {
      res.json({ quote: FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)], mood });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to generate quote" });
  }
});

const FALLBACK_PROMPTS = [
  "What moment from today made you feel most alive, and why did it affect you that way?",
  "Describe something you've been avoiding. What would happen if you faced it today?",
  "What are three things that went well this week, and what role did you play in them?",
  "If your future self could send you a message right now, what would they want you to know?",
  "What emotion have you been carrying lately that you haven't had a chance to fully express?",
  "Who in your life inspires you most, and what quality of theirs do you wish to cultivate in yourself?",
];

router.get("/journal-prompt", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const recentEntries = await db.select({ mood: diaryEntries.mood, summary: diaryEntries.summary }).from(diaryEntries).where(eq(diaryEntries.userEmail, userEmail)).orderBy(desc(diaryEntries.createdAt)).limit(3);
    const context = recentEntries.map((e) => `Mood: ${e.mood}, ${e.summary}`).join("\n");
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Based on these recent diary entries:\n${context || "No recent entries"}\n\nGenerate one thoughtful personalised journaling prompt for today. Just the prompt.` }],
      });
      res.json({ prompt: response.choices[0].message.content });
    } catch {
      res.json({ prompt: FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)] });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to generate prompt" });
  }
});

router.get("/mood-prediction", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const trends = await db.select().from(moodTrends).where(eq(moodTrends.userEmail, userEmail)).orderBy(desc(moodTrends.createdAt)).limit(7);
    if (trends.length < 3) return res.json(null);
    const context = trends.map((t) => `${t.date}: ${t.mood} (${t.moodScore})`).join("\n");
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Based on these mood trends:\n${context}\n\nPredict tomorrow's likely mood in JSON: { mood: string, score: number, reason: string }. Return ONLY valid JSON.` }],
      });
      let prediction = { mood: "neutral", score: 5, reason: "Based on your recent patterns." };
      try { prediction = JSON.parse((response.choices[0].message.content || "{}").replace(/```json\n?|\n?```/g, "")); } catch {}
      res.json(prediction);
    } catch {
      const lastMood = trends[0]?.mood || "neutral";
      const lastScore = trends[0]?.moodScore || 5;
      res.json({ mood: lastMood, score: lastScore, reason: "Based on your most recent mood pattern." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to predict mood" });
  }
});

const FALLBACK_AFFIRMATIONS: Record<string, string[]> = {
  happy: ["I embrace joy fully and share it generously with others.", "My happiness is a gift — to myself and everyone around me."],
  sad: ["This feeling is temporary. I have the strength to move through it.", "I am allowed to feel sad. Healing is already happening within me."],
  anxious: ["I breathe deeply and release what I cannot control.", "I am safe right now. One breath, one moment at a time."],
  calm: ["My peace is my power. I carry it with me wherever I go.", "I am grounded, present, and at ease in this moment."],
  energized: ["I channel my energy into what matters most today.", "I am ready for everything this day brings my way."],
  reflective: ["Every insight I gain brings me closer to my truest self.", "Growth lives in the questions I dare to ask myself."],
  default: ["I am enough, exactly as I am, in this very moment.", "I deserve love, rest, and all the good things coming my way."],
};

router.get("/affirmation", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [latest] = await db.select({ mood: diaryEntries.mood }).from(diaryEntries).where(eq(diaryEntries.userEmail, userEmail)).orderBy(desc(diaryEntries.createdAt)).limit(1);
    const mood = latest?.mood || "calm";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Create a short personalised daily affirmation (under 15 words) for someone feeling ${mood}. Just the affirmation.` }],
      });
      res.json({ affirmation: response.choices[0].message.content });
    } catch {
      const opts = FALLBACK_AFFIRMATIONS[mood] || FALLBACK_AFFIRMATIONS.default;
      res.json({ affirmation: opts[Math.floor(Math.random() * opts.length)] });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to generate affirmation" });
  }
});

router.get("/weekly-reflection", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateStr = oneWeekAgo.toISOString().split("T")[0];
    const entries = await db.select().from(diaryEntries).where(and(eq(diaryEntries.userEmail, userEmail), sql`${diaryEntries.entryDate} >= ${dateStr}`));
    const entryCount = entries.length;
    const scores = entries.filter((e) => e.moodScore).map((e) => e.moodScore!);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const moods = entries.map((e) => e.mood).filter(Boolean) as string[];
    const dominantMood = moods.sort((a, b) => moods.filter((m) => m === b).length - moods.filter((m) => m === a).length)[0] || "neutral";
    const allTriggers = entries.flatMap((e) => e.triggers || []);
    const topTriggers = [...new Set(allTriggers)].slice(0, 3);
    const summaries = entries.map((e) => e.summary).filter(Boolean).join(" ");
    let narrative = entryCount > 0
      ? "You showed up this week — that takes courage. Keep building on this momentum."
      : "Keep going — every entry is a step toward self-understanding.";
    if (summaries) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Write a warm empathetic weekly reflection (2-3 sentences) based on: ${summaries}` }],
        });
        narrative = response.choices[0].message.content || narrative;
      } catch {}
    }
    res.json({ entryCount, dominantMood, avgScore: Math.round(avgScore * 10) / 10, topTriggers, narrative });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate weekly reflection" });
  }
});

const FALLBACK_DELIGHTS = [
  { funFact: "Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs that was still edible.", challenge: "Smile at a stranger today.", emoji: "🍯" },
  { funFact: "Otters hold hands while sleeping so they don't drift apart.", challenge: "Send a kind message to someone you appreciate.", emoji: "🦦" },
  { funFact: "A group of flamingos is called a 'flamboyance'.", challenge: "Do 5 minutes of stretching right now.", emoji: "🦩" },
  { funFact: "Crows remember human faces and can hold grudges — or show gratitude.", challenge: "Write down one thing you're proud of this week.", emoji: "🐦" },
  { funFact: "The average person walks about 100,000 miles in their lifetime — roughly 4 times around the Earth.", challenge: "Take a 10-minute walk without your phone.", emoji: "🌍" },
];

router.get("/daily-delight", async (req: Request, res: Response) => {
  try {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Generate a daily delight in JSON: { funFact: string, challenge: string, emoji: string }. Return ONLY valid JSON." }],
      });
      let delight = FALLBACK_DELIGHTS[0];
      try { delight = JSON.parse((response.choices[0].message.content || "{}").replace(/```json\n?|\n?```/g, "")); } catch {}
      res.json(delight);
    } catch {
      res.json(FALLBACK_DELIGHTS[Math.floor(Math.random() * FALLBACK_DELIGHTS.length)]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to generate daily delight" });
  }
});

const FALLBACK_KINDNESS = [
  "Leave a genuine compliment for someone who helped you recently.",
  "Hold the door open for the next person, and look them in the eye with a warm smile.",
  "Send a voice note to a friend you haven't spoken to in a while.",
  "Leave a kind review for a local business you love.",
  "Buy a coffee or snack for someone who could use a lift today.",
  "Write a thank-you note — even a short one — to someone who's made your life better.",
];

router.get("/kindness-act", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const [latest] = await db.select({ mood: diaryEntries.mood }).from(diaryEntries).where(eq(diaryEntries.userEmail, userEmail)).orderBy(desc(diaryEntries.createdAt)).limit(1);
    const mood = latest?.mood || "neutral";
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Suggest a specific small concrete act of kindness for someone feeling ${mood} today. One sentence, action-oriented.` }],
      });
      res.json({ act: response.choices[0].message.content });
    } catch {
      res.json({ act: FALLBACK_KINDNESS[Math.floor(Math.random() * FALLBACK_KINDNESS.length)] });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to generate kindness act" });
  }
});

router.post("/kind-message", async (req: Request, res: Response) => {
  try {
    const { name, relationship, context } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Write a warm personalised message to ${name} (${relationship}). Context: ${context}. Keep it genuine and heartfelt, 2-3 sentences.` }],
    });
    res.json({ message: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate message" });
  }
});

router.get("/emotion-patterns", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const entries = await db.select({ mood: diaryEntries.mood, entryDate: diaryEntries.entryDate }).from(diaryEntries).where(eq(diaryEntries.userEmail, userEmail)).orderBy(desc(diaryEntries.createdAt)).limit(30);
    const moodCounts: Record<string, number> = {};
    for (const e of entries) { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; }
    const patterns = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));
    let insight = "Keep journaling to discover your emotional patterns.";
    if (entries.length > 5) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Analyse these emotion patterns: ${JSON.stringify(patterns)} and give a 1-sentence insight.` }],
        });
        insight = response.choices[0].message.content || insight;
      } catch {}
    }
    res.json({ patterns, insight });
  } catch (err) {
    res.status(500).json({ error: "Failed to analyse emotion patterns" });
  }
});

// ── GET /diary/wellbeing-check ──────────────────────────────────────────────
router.get("/wellbeing-check", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    if (!userEmail) return res.json({ needsSupport: false, severity: "none", reason: null, daysSilent: null });

    const [latestEntry] = await db
      .select({ entryDate: diaryEntries.entryDate })
      .from(diaryEntries)
      .where(eq(diaryEntries.userEmail, userEmail))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(1);

    const daysSilent = latestEntry
      ? Math.floor((Date.now() - new Date(latestEntry.entryDate as string).getTime()) / 86_400_000)
      : 999;

    const last5 = await db
      .select({ mood: diaryEntries.mood, moodScore: diaryEntries.moodScore })
      .from(diaryEntries)
      .where(eq(diaryEntries.userEmail, userEmail))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(5);

    const DISTRESS_MOODS = new Set(["sad", "anxious", "angry"]);
    const distressCount = last5.filter(
      (e) => (e.mood && DISTRESS_MOODS.has(e.mood)) || (e.moodScore !== null && (e.moodScore as number) < 0.35)
    ).length;
    const moodDistressed = last5.length >= 3 && distressCount >= 3;

    let severity: "none" | "mild" | "serious" | "urgent" = "none";
    let reason: "absent" | "distressed" | "both" | null = null;

    if (daysSilent >= 7) {
      severity = "urgent";
      reason = moodDistressed ? "both" : "absent";
    } else if (daysSilent >= 5) {
      severity = "serious";
      reason = moodDistressed ? "both" : "absent";
    } else if (daysSilent >= 3) {
      severity = "mild";
      reason = moodDistressed ? "both" : "absent";
    } else if (moodDistressed) {
      severity = "mild";
      reason = "distressed";
    }

    res.json({ needsSupport: severity !== "none", severity, reason, daysSilent: latestEntry ? daysSilent : null });
  } catch (err) {
    console.error("Wellbeing check error:", err);
    res.status(500).json({ error: "Failed to check wellbeing" });
  }
});

// ── GET /diary/welcome-back ─────────────────────────────────────────────────
router.get("/welcome-back", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    if (!userEmail) return res.json({ isReturn: false });

    const [latestEntry] = await db
      .select({ entryDate: diaryEntries.entryDate })
      .from(diaryEntries)
      .where(eq(diaryEntries.userEmail, userEmail))
      .orderBy(desc(diaryEntries.entryDate))
      .limit(1);

    if (!latestEntry) return res.json({ isReturn: false });

    const daysSilent = Math.floor(
      (Date.now() - new Date(latestEntry.entryDate as string).getTime()) / 86_400_000
    );

    res.json({ isReturn: daysSilent >= 4, daysSilent });
  } catch (err) {
    res.status(500).json({ error: "Failed to check return status" });
  }
});

// ── GET /diary/search ───────────────────────────────────────────────────────
router.get("/search", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const q = (req.query.q as string || "").trim();
    if (!q) return res.json([]);

    const entries = await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userEmail, userEmail),
          sql`(
            ${diaryEntries.title} ILIKE ${"%" + q + "%"} OR
            ${diaryEntries.transcript} ILIKE ${"%" + q + "%"} OR
            ${diaryEntries.summary} ILIKE ${"%" + q + "%"}
          )`
        )
      )
      .orderBy(desc(diaryEntries.entryDate))
      .limit(50);

    res.json(entries);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
