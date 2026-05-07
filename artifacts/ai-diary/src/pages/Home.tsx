import { Link } from "wouter";
import { motion } from "framer-motion";
import { Video, Flame, Sparkles, Brain, Heart, Sun, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import {
  useStreak, useMotivationalQuote, useAffirmation, useMoodPrediction,
  useWeeklyReflection, useDailyDelight, useKindnessAct, useLatestGoal,
  useMoodTrends, getMoodColor
} from "../hooks/useApi";
import { getMoodEmoji, getMoodColor as getMoodColorFn } from "../lib/utils";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 border ${className}`}
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
    >
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
  const { data: delight } = useDailyDelight();
  const { data: kindness } = useKindnessAct();
  const { data: latestGoal } = useLatestGoal();
  const { data: moodTrends } = useMoodTrends();

  const recentTrends = moodTrends?.slice(0, 14).reverse() || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/record">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg"
            style={{ background: "hsl(var(--primary))" }}
            data-testid="button-record"
          >
            <Video size={16} />
            Record Today
          </motion.button>
        </Link>
      </div>

      {/* Top Row: Streak + Affirmation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="col-span-1 flex flex-col items-center justify-center text-center py-6">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={20} style={{ color: "#f97316" }} />
              <span className="text-3xl font-bold">{streak?.streak ?? 0}</span>
            </div>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>day streak</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{streak?.totalEntries ?? 0} total entries</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-1 md:col-span-3">
          <Card className="h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Daily Affirmation</span>
            </div>
            <p className="text-base font-medium italic leading-relaxed">
              "{affirmation?.affirmation || "You are doing better than you think."}"
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Quote + Mood Prediction */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={14} style={{ color: "#f59e0b" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Today's Quote</span>
            </div>
            <p className="text-sm leading-relaxed">{quote?.quote || "Loading your quote..."}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Tomorrow's Prediction</span>
            </div>
            {prediction ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getMoodEmoji(prediction.mood)}</span>
                  <div>
                    <p className="font-semibold capitalize">{prediction.mood}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Score: {prediction.score}/10</p>
                  </div>
                </div>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{prediction.reason}</p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Record more entries to see predictions</p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Mini Mood Chart */}
      {recentTrends.length > 2 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Recent Mood Trend</span>
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={recentTrends}>
                <Line type="monotone" dataKey="moodScore" stroke="hsl(258 84% 60%)" strokeWidth={2} dot={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v, "Mood Score"]}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Weekly Reflection */}
      {weekly && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} style={{ color: "hsl(var(--accent))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Weekly Reflection</span>
              <span className="ml-auto text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{weekly.entryCount} entries</span>
            </div>
            <p className="text-sm leading-relaxed">{weekly.narrative}</p>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Dominant mood</p>
                <p className="text-sm font-medium capitalize">{getMoodEmoji(weekly.dominantMood)} {weekly.dominantMood}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Avg score</p>
                <p className="text-sm font-medium">{weekly.avgScore}/10</p>
              </div>
              {weekly.topTriggers.length > 0 && (
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Triggers</p>
                  <p className="text-sm font-medium">{weekly.topTriggers.slice(0, 2).join(", ")}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Active Goal Widget */}
      {latestGoal && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Active Goal</span>
              </div>
              <Link href="/goals">
                <button className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
                  View all <ArrowRight size={11} />
                </button>
              </Link>
            </div>
            <p className="font-semibold text-sm mb-2">{latestGoal.title}</p>
            <div className="h-1.5 rounded-full mb-3" style={{ background: "hsl(var(--muted))" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${latestGoal.progress || 0}%`, background: "hsl(var(--primary))" }}
              />
            </div>
            <div className="space-y-1.5">
              {latestGoal.milestones?.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className={m.completed ? "" : "opacity-30"} style={{ color: m.completed ? "hsl(var(--primary))" : undefined }} />
                  <span className={m.completed ? "line-through" : ""} style={{ color: m.completed ? "hsl(var(--muted-foreground))" : undefined }}>{m.title}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Daily Delight + Kindness */}
      <div className="grid md:grid-cols-2 gap-4">
        {delight && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{delight.emoji}</span>
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Daily Delight</span>
              </div>
              <p className="text-sm mb-2">{delight.funFact}</p>
              <p className="text-xs px-3 py-2 rounded-lg font-medium" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}>
                Challenge: {delight.challenge}
              </p>
            </Card>
          </motion.div>
        )}

        {kindness && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} style={{ color: "hsl(var(--accent))" }} />
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Kindness Corner</span>
              </div>
              <p className="text-sm leading-relaxed">{kindness.act}</p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
