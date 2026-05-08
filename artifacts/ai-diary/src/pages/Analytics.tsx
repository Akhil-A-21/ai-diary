import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { TrendingUp, Brain, Shield, BarChart2, ChevronDown, ChevronRight, Loader2, MessageCircle, X } from "lucide-react";
import {
  useMoodTrends, useResilienceScore, useEmotionPatterns, useEmotionReasons
} from "../hooks/useApi";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { getMoodColor } from "../lib/mood-utils";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

const MOOD_COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊", sad: "😢", anxious: "😰", calm: "😌",
  energized: "⚡", reflective: "🤔", grateful: "🙏", angry: "😤",
};

function EmotionReasonsPanel({ mood, color, onClose }: { mood: string; color: string; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, refetch } = useEmotionReasons(mood);

  const handleReasonClick = (reason: string) => {
    const params = new URLSearchParams({ mood, reason });
    setLocation(`/chat?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div
        className="mt-3 rounded-xl p-4 border"
        style={{ background: color + "08", borderColor: color + "25" }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
            Why you feel {mood}
          </p>
          <button onClick={onClose} className="p-0.5 rounded-md hover:bg-muted transition-colors">
            <X size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 size={14} className="animate-spin" style={{ color }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Analysing your entries…</span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-between py-2">
            <p className="text-xs" style={{ color: "hsl(0 80% 65%)" }}>
              Couldn't load reasons — tap to retry
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs px-2 py-1 rounded-md border transition-colors"
              style={{ borderColor: color + "40", color }}
            >
              Retry
            </button>
          </div>
        ) : !data || data.reasons.length === 0 ? (
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            No diary entries with this mood yet.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Tap a reason to talk to AI Diary about it
            </p>
            {data.reasons.map((reason, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleReasonClick(reason)}
                className="w-full text-left px-3 py-2.5 rounded-lg border text-sm flex items-start gap-2.5 group transition-all"
                style={{
                  background: "hsl(var(--muted))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                whileHover={{ scale: 1.01, borderColor: color }}
                whileTap={{ scale: 0.99 }}
              >
                <MessageCircle
                  size={13}
                  className="flex-shrink-0 mt-0.5 transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                />
                <span className="flex-1 leading-snug">{reason}</span>
                <ChevronRight
                  size={13}
                  className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color }}
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const { data: moodTrends = [] } = useMoodTrends();
  const { data: resilience } = useResilienceScore();
  const { data: patterns } = useEmotionPatterns();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const chartData = moodTrends.slice(0, 30).reverse().map((t) => ({
    date: t.date,
    score: t.moodScore,
    mood: t.mood,
    source: t.source,
  }));

  const diaryData = chartData.filter((d) => d.source === "diary");
  const chatData = chartData.filter((d) => d.source === "chat");

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    color: "hsl(var(--foreground))"
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm mt-1 text-muted-foreground">Understand your emotional landscape</p>
      </div>

      {/* Resilience Score */}
      {resilience && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resilience Score</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="10"
                    strokeDasharray={`${(resilience.score / 10) * 251} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{resilience.score}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Average Mood</p>
                  <p className="font-semibold text-foreground">{resilience.avgMoodScore}/10</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className={`font-semibold capitalize ${resilience.trend === "improving" ? "text-green-400" : resilience.trend === "declining" ? "text-red-400" : "text-foreground"}`}>
                    {resilience.trend}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Points</p>
                  <p className="font-semibold text-foreground">{resilience.dataPoints}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Combined Mood Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mood Timeline (30 days)</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.slice(5)} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => (v * 10).toFixed(0)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [(v * 10).toFixed(1), "Mood Score"]} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No mood data yet. Start recording entries.</p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Emotion Patterns — interactive */}
      {patterns && patterns.patterns.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emotion Patterns</span>
            </div>
            <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
              Tap an emotion to see why you feel that way
            </p>

            <div className="grid md:grid-cols-2 gap-6 items-start">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={patterns.patterns}
                    dataKey="count"
                    nameKey="mood"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ mood }) => mood}
                    onClick={(d) => setSelectedMood(selectedMood === d.mood ? null : d.mood)}
                    style={{ cursor: "pointer" }}
                  >
                    {patterns.patterns.map((p, i) => (
                      <Cell
                        key={i}
                        fill={MOOD_COLORS[i % MOOD_COLORS.length]}
                        opacity={selectedMood && selectedMood !== p.mood ? 0.4 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-1">
                {patterns.patterns.map((p, i) => {
                  const color = MOOD_COLORS[i % MOOD_COLORS.length];
                  const isSelected = selectedMood === p.mood;
                  return (
                    <div key={p.mood}>
                      <motion.button
                        onClick={() => setSelectedMood(isSelected ? null : p.mood)}
                        className="w-full flex items-center justify-between text-sm px-2.5 py-2 rounded-lg transition-colors"
                        style={{
                          background: isSelected ? color + "15" : "transparent",
                          border: `1px solid ${isSelected ? color + "40" : "transparent"}`,
                        }}
                        whileHover={{ backgroundColor: color + "10" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                            style={{ background: color, transform: isSelected ? "scale(1.3)" : "scale(1)" }}
                          />
                          <span className="text-base mr-1">{MOOD_EMOJIS[p.mood] || "💭"}</span>
                          <span className="capitalize font-medium" style={{ color: isSelected ? color : "hsl(var(--foreground))" }}>
                            {p.mood}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{p.count}x</span>
                          <ChevronDown
                            size={13}
                            style={{
                              color,
                              transform: isSelected ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                          />
                        </div>
                      </motion.button>

                      <AnimatePresence>
                        {isSelected && (
                          <EmotionReasonsPanel
                            mood={p.mood}
                            color={color}
                            onClose={() => setSelectedMood(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm leading-relaxed text-muted-foreground">{patterns.insight}</p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Bar Chart by Source */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mood Sources</span>
            </div>
            <div className="flex gap-4 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--primary))" }} />
                <span className="text-muted-foreground">Diary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--accent))" }} />
                <span className="text-muted-foreground">AI Diary Chat</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: "Diary", count: diaryData.length },
                { name: "Chat", count: chatData.length },
              ]}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Entries" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
