import { motion } from "framer-motion";
import { TrendingUp, Brain, Shield, BarChart2 } from "lucide-react";
import {
  useMoodTrends, useResilienceScore, useEmotionPatterns
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

export default function Analytics() {
  const { data: moodTrends = [] } = useMoodTrends();
  const { data: resilience } = useResilienceScore();
  const { data: patterns } = useEmotionPatterns();

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
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
    color: "hsl(var(--foreground))"
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-white">Analytics</h1>
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
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="10"
                    strokeDasharray={`${(resilience.score / 10) * 251} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{resilience.score}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Average Mood</p>
                  <p className="font-semibold text-white">{resilience.avgMoodScore}/10</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className={`font-semibold capitalize ${resilience.trend === "improving" ? "text-green-400" : resilience.trend === "declining" ? "text-red-400" : "text-white"}`}>
                    {resilience.trend}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Points</p>
                  <p className="font-semibold text-white">{resilience.dataPoints}</p>
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

      {/* Emotion Patterns */}
      {patterns && patterns.patterns.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emotion Patterns</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={patterns.patterns} dataKey="count" nameKey="mood" cx="50%" cy="50%" outerRadius={70} label={({ mood }) => mood}>
                    {patterns.patterns.map((_, i) => (
                      <Cell key={i} fill={MOOD_COLORS[i % MOOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground mb-3">{patterns.insight}</p>
                <div className="space-y-1.5">
                  {patterns.patterns.map((p, i) => (
                    <div key={p.mood} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: MOOD_COLORS[i % MOOD_COLORS.length] }} />
                        <span className="capitalize text-white/80">{p.mood}</span>
                      </div>
                      <span className="font-medium text-white">{p.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
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
                <span className="text-muted-foreground">Aura Chat</span>
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
