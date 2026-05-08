import { motion } from "framer-motion";
import { TrendingUp, Brain, Shield, BarChart2 } from "lucide-react";
import {
  useMoodTrends, useResilienceScore, useEmotionPatterns
} from "../hooks/useApi";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { getMoodColor } from "../lib/utils";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${className}`} style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Understand your emotional landscape</p>
      </div>

      {/* Resilience Score */}
      {resilience && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={15} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Resilience Tracker</span>
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
                  <span className="text-xl font-bold">{resilience.score}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Average Mood</p>
                  <p className="font-semibold">{resilience.avgMoodScore}/10</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Trend</p>
                  <p className={`font-semibold capitalize ${resilience.trend === "improving" ? "text-green-500" : resilience.trend === "declining" ? "text-red-500" : ""}`}>
                    {resilience.trend}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Data Points</p>
                  <p className="font-semibold">{resilience.dataPoints}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Combined Mood Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Mood Timeline (30 days)</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [v, name === "score" ? "Mood Score" : name]}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(258 84% 60%)" strokeWidth={2} dot={{ r: 3 }} name="score" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No mood data yet. Start recording entries.</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Emotion Patterns */}
      {patterns && patterns.patterns.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={15} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Emotion Patterns</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={patterns.patterns} dataKey="count" nameKey="mood" cx="50%" cy="50%" outerRadius={70} label={({ mood }) => mood}>
                    {patterns.patterns.map((_, i) => (
                      <Cell key={i} fill={MOOD_COLORS[i % MOOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{patterns.insight}</p>
                <div className="mt-3 space-y-1.5">
                  {patterns.patterns.map((p, i) => (
                    <div key={p.mood} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: MOOD_COLORS[i % MOOD_COLORS.length] }} />
                        <span className="capitalize">{p.mood}</span>
                      </div>
                      <span className="font-medium">{p.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bar Chart by Source */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={15} style={{ color: "hsl(var(--accent))" }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Mood Sources</span>
            </div>
            <div className="flex gap-4 text-xs mb-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "hsl(258 84% 60%)" }} /><span>Diary</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "hsl(316 70% 60%)" }} /><span>Aura Chat</span></div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: "Diary", count: diaryData.length, avg: diaryData.reduce((a, b) => a + (b.score || 0), 0) / Math.max(diaryData.length, 1) },
                { name: "Chat", count: chatData.length, avg: chatData.reduce((a, b) => a + (b.score || 0), 0) / Math.max(chatData.length, 1) },
              ]}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Entries" fill="hsl(258 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
