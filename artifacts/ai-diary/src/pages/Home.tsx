import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Flame, Sparkles, Brain, Heart, TrendingUp,
  CheckCircle2, ArrowRight, Calendar, Copy, Check, Wind
} from "lucide-react";
import {
  useStreak, useMotivationalQuote, useAffirmation, useMoodPrediction,
  useWeeklyReflection, useKindMessage, useLatestGoal,
  useDiaryEntries, useDailyDelight, useKindnessAct,
} from "../hooks/useApi";
import { getMoodEmoji } from "../lib/utils";
import { BreathingModal } from "../components/breathing-modal";
import { toast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl", className)}>
      {children}
    </div>
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
  const { data: delight } = useDailyDelight();
  const { data: kindnessAct } = useKindnessAct();
  const kindMessage = useKindMessage();

  const [kindForm, setKindForm] = useState({ name: "", relationship: "", context: "" });
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
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

  const last3Entries = recentEntries.slice(0, 3);

  return (
    <div className="space-y-5 pb-8">
      <BreathingModal open={breathingOpen} onClose={() => setBreathingOpen(false)} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{dateStr}</p>
          <h1 className="font-display text-4xl font-bold text-white">
            {greeting} ✨
          </h1>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <GlassCard className="flex items-center gap-1.5 px-3 py-2">
            <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div className="text-center">
              <p className="text-sm font-bold leading-none text-white">{streak?.streak ?? 0}</p>
              <p className="text-[10px] leading-none mt-0.5 text-muted-foreground">streak</p>
            </div>
          </GlassCard>
          <GlassCard className="px-3 py-2 text-center">
            <p className="text-sm font-bold leading-none text-white">{streak?.totalEntries ?? 0}</p>
            <p className="text-[10px] leading-none mt-0.5 text-muted-foreground">entries</p>
          </GlassCard>
        </div>
      </div>

      {/* ── Affirmation bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      >
        <GlassCard className="flex items-center gap-3 px-5 py-3.5">
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
          <p className="text-sm italic text-white/80">
            "{affirmation?.affirmation || "You are doing better than you think."}"
          </p>
        </GlassCard>
      </motion.div>

      {/* ── Motivational Quote ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <GlassCard className="relative overflow-hidden px-7 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <p className="font-display text-2xl font-bold leading-snug text-white">
                "{quote?.quote || "Every day is a new beginning. Take a deep breath and start again."}"
              </p>
              <p className="text-sm mt-3 mb-5" style={{ color: "hsl(var(--primary))" }}>— Daily Wisdom</p>
            </div>
            <span className="text-[80px] font-bold leading-none select-none flex-shrink-0 opacity-10 text-white" style={{ lineHeight: 0.8, marginTop: "4px" }}>"</span>
          </div>
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))" }} />
        </GlassCard>
      </motion.div>

      {/* ── Record Entry + Weekly Mood ── */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link href="/record">
            <GlassCard className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/30 transition-all h-full border border-transparent">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                <Video className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-sm text-white">Record Entry</p>
              <p className="text-xs mt-1 text-muted-foreground">Capture how you feel right now</p>
            </GlassCard>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                <span className="text-xs font-semibold text-white">Weekly Mood</span>
              </div>
              <Link href="/analytics">
                <span className="text-xs flex items-center gap-0.5 cursor-pointer" style={{ color: "hsl(var(--primary))" }}>
                  Details <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            {weekly && weekly.entryCount > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getMoodEmoji(weekly.dominantMood)}</span>
                  <div>
                    <p className="text-sm font-semibold capitalize text-white">{weekly.dominantMood}</p>
                    <p className="text-xs text-muted-foreground">{weekly.avgScore}/10 avg · {weekly.entryCount} entries</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed line-clamp-3 text-muted-foreground">{weekly.narrative}</p>
              </>
            ) : (
              <p className="text-xs leading-relaxed mt-2 text-muted-foreground">
                Not enough data yet. Record some entries!
              </p>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Daily Delight ── */}
      {delight && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{delight.emoji || "✨"}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Delight</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed mb-3">{delight.funFact}</p>
            <div className="rounded-xl px-4 py-2.5 border text-xs font-medium" style={{ background: "hsl(var(--primary) / 0.1)", borderColor: "hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))" }}>
              30-sec challenge: {delight.challenge}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ── Tomorrow's Mood Prediction ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <GlassCard className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--primary) / 0.15)" }}
            >
              <Brain className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">Tomorrow's Mood Forecast</p>
              {prediction ? (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl">{getMoodEmoji(prediction.mood)}</span>
                  <div>
                    <p className="text-sm font-semibold capitalize text-white">{prediction.mood} · {prediction.score}/10</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">{prediction.reason}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
                  Record a few entries to unlock your personalised AI mood forecast.
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Active Goal ── */}
      {latestGoal && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Goal</span>
              <Link href="/goals">
                <span className="text-xs flex items-center gap-0.5 cursor-pointer" style={{ color: "hsl(var(--primary))" }}>
                  View all <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <p className="font-semibold text-sm mt-1 mb-4 text-white">{latestGoal.title}</p>

            {latestGoal.milestones && latestGoal.milestones.length > 0 ? (
              <>
                <div className="relative flex items-center mb-3">
                  <div className="absolute left-0 right-0 h-px bg-white/10" style={{ top: "50%", transform: "translateY(-50%)" }} />
                  <div className="relative flex items-center justify-between w-full">
                    {latestGoal.milestones.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center relative z-10 transition-all"
                        style={{
                          background: m.completed ? "hsl(var(--primary))" : "hsl(var(--card))",
                          borderColor: m.completed ? "hsl(var(--primary))" : "rgba(255,255,255,0.15)",
                        }}
                        title={m.title}
                      >
                        {m.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Next: <span className="font-medium text-white/80">
                      {latestGoal.milestones.find((m) => !m.completed)?.title || "All done!"}
                    </span>
                  </p>
                  <p className="text-xs font-medium text-orange-400">
                    {latestGoal.milestones.filter((m) => m.completed).length}/{latestGoal.milestones.length} done{" "}
                    <span className="text-muted-foreground">
                      {Math.round((latestGoal.milestones.filter((m) => m.completed).length / latestGoal.milestones.length) * 100)}%
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No milestones yet — open Goals to generate some with AI.</p>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* ── Kindness Corner ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="font-semibold text-sm text-white">Kindness Corner</span>
            </div>
            <span className="text-xs text-muted-foreground">makes you & them happier</span>
          </div>

          {kindnessAct && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-white/70 border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
              💡 Today's act: {kindnessAct.act}
            </div>
          )}

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
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
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none w-full text-white placeholder:text-muted-foreground"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                  <input
                    type="text"
                    placeholder="Relationship (friend, mum…)"
                    value={kindForm.relationship}
                    onChange={(e) => setKindForm({ ...kindForm, relationship: e.target.value })}
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none w-full text-white placeholder:text-muted-foreground"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                </div>
                <textarea
                  placeholder="Optional: something you'd like to mention"
                  value={kindForm.context}
                  onChange={(e) => setKindForm({ ...kindForm, context: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none text-white placeholder:text-muted-foreground"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleKindMessage}
                  disabled={kindMessage.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                  style={{ borderColor: "rgba(236,72,153,0.4)", color: "#f472b6", background: "rgba(236,72,153,0.08)" }}
                >
                  <Heart className="w-3.5 h-3.5" />
                  {kindMessage.isPending ? "Writing…" : "Write message"}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div
                  className="p-4 rounded-xl border text-sm leading-relaxed text-white/85"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  {generatedMessage}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border"
                    style={{ borderColor: "hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)" }}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                  <button
                    onClick={() => { setGeneratedMessage(""); setKindForm({ name: "", relationship: "", context: "" }); }}
                    className="px-3 py-2 rounded-xl text-xs border text-muted-foreground"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* ── Breathing Exercise ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <GlassCard className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)" }}
            >
              <Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Breathing Exercise</p>
              <p className="text-xs mt-0.5 text-muted-foreground">4-7-8 technique — calms stress in under 2 minutes</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setBreathingOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium flex-shrink-0"
            style={{ background: "hsl(var(--primary))" }}
          >
            Start
          </motion.button>
        </GlassCard>
      </motion.div>

      {/* ── Recent Reflections ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <span className="font-semibold text-sm text-white">Recent Reflections</span>
          </div>
          <Link href="/timeline">
            <span className="text-xs cursor-pointer" style={{ color: "hsl(var(--primary))" }}>View all</span>
          </Link>
        </div>

        {last3Entries.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No entries yet. Record your first diary entry to see it here.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {last3Entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
              >
                <Link href={`/entry/${entry.id}`}>
                  <GlassCard className="p-4 cursor-pointer hover:border-primary/30 transition-all border border-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date((entry.entryDate as string) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-snug line-clamp-2 text-white">{entry.title}</p>
                    <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">
                      {(entry as any).summary || "No summary available."}
                    </p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
