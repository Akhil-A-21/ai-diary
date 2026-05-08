import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Flame, Sparkles, Brain, Heart, TrendingUp,
  CheckCircle2, ArrowRight, Calendar, Wind, Play, Copy, Check
} from "lucide-react";
import {
  useStreak, useMotivationalQuote, useAffirmation, useMoodPrediction,
  useWeeklyReflection, useKindMessage, useLatestGoal,
  useDiaryEntries, getMoodColor
} from "../hooks/useApi";
import { getMoodEmoji } from "../lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { toast } from "../hooks/use-toast";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}
    >
      {children}
    </div>
  );
}

function BreathingExercise() {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold1" | "exhale" | "hold2">("idle");
  const [seconds, setSeconds] = useState(0);

  const start = () => {
    setPhase("inhale");
    setSeconds(4);
    let count = 4;
    let currentPhase = "inhale";
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        if (currentPhase === "inhale") { currentPhase = "hold1"; count = 7; }
        else if (currentPhase === "hold1") { currentPhase = "exhale"; count = 8; }
        else if (currentPhase === "exhale") { currentPhase = "hold2"; count = 4; }
        else { clearInterval(timer); setPhase("idle"); setSeconds(0); return; }
        setPhase(currentPhase as any);
      }
      setSeconds(count);
    }, 1000);
  };

  const labels: Record<string, string> = { inhale: "Inhale", hold1: "Hold", exhale: "Exhale", hold2: "Hold" };

  return (
    <Card className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <motion.div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)" }}
          animate={phase !== "idle" ? { scale: phase === "inhale" ? [1, 1.3] : phase === "exhale" ? [1.3, 1] : 1.3 } : { scale: 1 }}
          transition={{ duration: phase === "inhale" ? 4 : phase === "exhale" ? 8 : 0.1, ease: "easeInOut" }}
        >
          <Wind size={20} className="text-white" />
        </motion.div>
        <div>
          <p className="font-semibold text-sm">Breathing Exercise</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(240 8% 55%)" }}>
            {phase === "idle" ? "4-7-8 technique — calms stress in under 2 minutes." : `${labels[phase]}… ${seconds}s`}
          </p>
        </div>
      </div>
      {phase === "idle" ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={start}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: "hsl(258 80% 65%)" }}
        >
          <Play size={13} />
          Start
        </motion.button>
      ) : (
        <div className="text-sm font-bold tabular-nums" style={{ color: "hsl(258 80% 65%)" }}>
          {seconds}s
        </div>
      )}
    </Card>
  );
}

export default function Home() {
  const { data: streak } = useStreak();
  const { data: quote } = useMotivationalQuote();
  const { data: affirmation } = useAffirmation();
  const { data: prediction } = useMoodPrediction();
  const { data: weekly } = useWeeklyReflection();
  const { data: latestGoal } = useLatestGoal();
  const { data: recentEntries = [] } = useDiaryEntries();
  const kindMessage = useKindMessage();

  const [kindForm, setKindForm] = useState({ name: "", relationship: "", context: "" });
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const handleKindMessage = async () => {
    if (!kindForm.name.trim()) { toast({ title: "Please enter a name", variant: "destructive" }); return; }
    try {
      const res = await kindMessage.mutateAsync(kindForm);
      setGeneratedMessage(res.message);
    } catch {
      toast({ title: "Could not generate message — please try again", variant: "destructive" });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const last5Entries = recentEntries.slice(0, 3);

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-xs mb-1" style={{ color: "hsl(240 8% 55%)" }}>{dateStr}</p>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "hsl(240 15% 13%)", border: "1px solid hsl(240 12% 20%)" }}>
            <Flame size={15} style={{ color: "#f97316" }} />
            <div className="text-center">
              <p className="text-sm font-bold leading-none">{streak?.streak ?? 0}</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "hsl(240 8% 55%)" }}>day streak</p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl text-center" style={{ background: "hsl(240 15% 13%)", border: "1px solid hsl(240 12% 20%)" }}>
            <p className="text-sm font-bold leading-none">{streak?.totalEntries ?? 0}</p>
            <p className="text-[10px] leading-none mt-0.5" style={{ color: "hsl(240 8% 55%)" }}>total entries</p>
          </div>
        </div>
      </div>

      {/* ── Affirmation bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
        style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}
      >
        <Sparkles size={14} style={{ color: "hsl(258 80% 65%)", flexShrink: 0 }} />
        <p className="text-sm italic" style={{ color: "hsl(240 10% 80%)" }}>
          "{affirmation?.affirmation || "You are doing better than you think."}"
        </p>
      </motion.div>

      {/* ── Large Quote Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border relative overflow-hidden px-7 pt-6 pb-0"
        style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-8">
            <p className="text-2xl font-bold leading-snug" style={{ fontFamily: "Playfair Display, serif" }}>
              "{quote?.quote || "Every day is a new beginning. Take a deep breath and start again."}"
            </p>
            <p className="text-sm mt-3 mb-5" style={{ color: "hsl(258 80% 65%)" }}>— Daily Wisdom</p>
          </div>
          <span
            className="text-[80px] font-bold leading-none select-none flex-shrink-0 opacity-10"
            style={{ color: "hsl(240 8% 80%)", lineHeight: 0.8, marginTop: "4px" }}
          >
            "
          </span>
        </div>
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(to right, hsl(258 80% 65%), hsl(316 65% 62%))" }} />
      </motion.div>

      {/* ── Record Entry + Weekly Mood ── */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link href="/record">
            <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-500/40 transition-colors h-full">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: "hsl(258 80% 65%)" }}
              >
                <Video size={24} className="text-white" />
              </div>
              <p className="font-semibold text-sm">Record Entry</p>
              <p className="text-xs mt-1" style={{ color: "hsl(240 8% 55%)" }}>Capture how you feel right now</p>
            </Card>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: "hsl(258 80% 65%)" }} />
                <span className="text-xs font-semibold">Weekly Mood</span>
              </div>
              <Link href="/analytics">
                <span className="text-xs flex items-center gap-0.5 cursor-pointer" style={{ color: "hsl(258 80% 65%)" }}>
                  View Details <ArrowRight size={10} />
                </span>
              </Link>
            </div>
            {weekly && weekly.entryCount > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getMoodEmoji(weekly.dominantMood)}</span>
                  <div>
                    <p className="text-sm font-semibold capitalize">{weekly.dominantMood}</p>
                    <p className="text-xs" style={{ color: "hsl(240 8% 55%)" }}>{weekly.avgScore}/10 avg · {weekly.entryCount} entries</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "hsl(240 8% 60%)" }}>{weekly.narrative}</p>
              </>
            ) : (
              <p className="text-xs leading-relaxed mt-2" style={{ color: "hsl(240 8% 50%)" }}>
                Not enough data yet. Record some entries!
              </p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Tomorrow's Mood Prediction ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(258 40% 18%)" }}
            >
              <Brain size={18} style={{ color: "hsl(258 80% 65%)" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Tomorrow's Mood Prediction</p>
              {prediction ? (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl">{getMoodEmoji(prediction.mood)}</span>
                  <div>
                    <p className="text-sm font-semibold capitalize">{prediction.mood} · {prediction.score}/10</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(240 8% 55%)" }}>{prediction.reason}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "hsl(240 8% 55%)" }}>
                  Record a few entries to unlock your personalised AI mood forecast.
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Active Goal ── */}
      {latestGoal && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#f97316" }}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 55%)" }}>Active Goal</span>
              </div>
              <Link href="/goals">
                <span className="text-xs flex items-center gap-0.5 cursor-pointer" style={{ color: "hsl(258 80% 65%)" }}>
                  View all <ArrowRight size={10} />
                </span>
              </Link>
            </div>
            <p className="font-semibold text-sm mt-1 mb-4">{latestGoal.title}</p>

            {/* Horizontal milestone dots */}
            {latestGoal.milestones && latestGoal.milestones.length > 0 ? (
              <>
                <div className="relative flex items-center mb-3">
                  <div className="absolute left-0 right-0 h-px" style={{ background: "hsl(240 12% 22%)", top: "50%", transform: "translateY(-50%)" }} />
                  <div className="relative flex items-center justify-between w-full">
                    {latestGoal.milestones.slice(0, 5).map((m, i) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center relative z-10 transition-all"
                        style={{
                          background: m.completed ? "hsl(258 80% 65%)" : "hsl(240 15% 13%)",
                          borderColor: m.completed ? "hsl(258 80% 65%)" : "hsl(240 12% 28%)",
                        }}
                        title={m.title}
                      >
                        {m.completed && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "hsl(240 8% 55%)" }}>
                    Next: <span className="font-medium" style={{ color: "hsl(240 10% 80%)" }}>
                      {latestGoal.milestones.find((m) => !m.completed)?.title || "All done!"}
                    </span>
                  </p>
                  <p className="text-xs font-medium" style={{ color: "#f97316" }}>
                    {latestGoal.milestones.filter((m) => m.completed).length}/{latestGoal.milestones.length} done{" "}
                    <span style={{ color: "hsl(240 8% 40%)" }}>
                      {Math.round((latestGoal.milestones.filter((m) => m.completed).length / latestGoal.milestones.length) * 100)}%
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: "hsl(240 8% 55%)" }}>No milestones yet — open Goals to generate some with AI.</p>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── Kindness Corner ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={15} style={{ color: "hsl(316 65% 62%)" }} />
              <span className="font-semibold text-sm">Kindness Corner</span>
            </div>
            <span className="text-xs" style={{ color: "hsl(240 8% 45%)" }}>makes you & them happier</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(240 8% 45%)" }}>
            Write a kind message to someone
          </p>

          <AnimatePresence mode="wait">
            {!generatedMessage ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Their name"
                    value={kindForm.name}
                    onChange={(e) => setKindForm({ ...kindForm, name: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none w-full"
                    style={{ background: "hsl(240 15% 10%)", borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 90%)" }}
                    data-testid="input-kind-name"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (friend, mum…)"
                    value={kindForm.relationship}
                    onChange={(e) => setKindForm({ ...kindForm, relationship: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none w-full"
                    style={{ background: "hsl(240 15% 10%)", borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 90%)" }}
                    data-testid="input-kind-relationship"
                  />
                </div>
                <textarea
                  placeholder="Optional: something you want to mention or how you're feeling"
                  value={kindForm.context}
                  onChange={(e) => setKindForm({ ...kindForm, context: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "hsl(240 15% 10%)", borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 90%)" }}
                  data-testid="input-kind-context"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleKindMessage}
                  disabled={kindMessage.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{ borderColor: "hsl(316 65% 62% / 0.4)", color: "hsl(316 65% 62%)", background: "hsl(316 65% 62% / 0.08)" }}
                  data-testid="button-kind-message"
                >
                  <Heart size={13} />
                  {kindMessage.isPending ? "Writing…" : "Write message"}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div
                  className="p-4 rounded-xl border text-sm leading-relaxed"
                  style={{ background: "hsl(240 15% 10%)", borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 85%)" }}
                >
                  {generatedMessage}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border"
                    style={{ borderColor: "hsl(258 80% 65% / 0.4)", color: "hsl(258 80% 65%)", background: "hsl(258 80% 65% / 0.08)" }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                  <button
                    onClick={() => { setGeneratedMessage(""); setKindForm({ name: "", relationship: "", context: "" }); }}
                    className="px-3 py-2 rounded-xl text-xs border"
                    style={{ borderColor: "hsl(240 12% 22%)", color: "hsl(240 8% 55%)" }}
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* ── Breathing Exercise ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <BreathingExercise />
      </motion.div>

      {/* ── Recent Reflections ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: "hsl(258 80% 65%)" }} />
            <span className="font-semibold text-sm">Recent Reflections</span>
          </div>
          <Link href="/timeline">
            <span className="text-xs cursor-pointer" style={{ color: "hsl(258 80% 65%)" }}>View all</span>
          </Link>
        </div>

        {last5Entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm" style={{ color: "hsl(240 8% 50%)" }}>No entries yet. Record your first diary entry to see it here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {last5Entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
              >
                <Link href={`/entry/${entry.id}`}>
                  <div
                    className="rounded-2xl border p-4 cursor-pointer hover:border-violet-500/40 transition-colors"
                    style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                      <span className="text-[10px]" style={{ color: "hsl(240 8% 45%)" }}>
                        {new Date(entry.entryDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-snug line-clamp-2">{entry.title}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "hsl(240 8% 50%)" }}>
                      {entry.summary || "No text available for this entry."}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
