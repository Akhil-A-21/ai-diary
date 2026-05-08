export const moodConfig: Record<string, { emoji: string; color: string; label: string; gradient: string }> = {
  excited:   { emoji: "🤩", color: "text-yellow-400",  label: "Excited",  gradient: "from-yellow-500/20 to-orange-500/5" },
  happy:     { emoji: "😊", color: "text-green-400",   label: "Happy",    gradient: "from-green-500/20 to-emerald-500/5" },
  calm:      { emoji: "😌", color: "text-blue-400",    label: "Calm",     gradient: "from-blue-500/20 to-cyan-500/5" },
  neutral:   { emoji: "😐", color: "text-gray-400",    label: "Neutral",  gradient: "from-gray-500/20 to-slate-500/5" },
  anxious:   { emoji: "😰", color: "text-purple-400",  label: "Anxious",  gradient: "from-purple-500/20 to-indigo-500/5" },
  sad:       { emoji: "😢", color: "text-blue-500",    label: "Sad",      gradient: "from-blue-600/20 to-indigo-600/5" },
  angry:     { emoji: "😠", color: "text-red-400",     label: "Angry",    gradient: "from-red-500/20 to-rose-500/5" },
  energized: { emoji: "⚡", color: "text-yellow-300",  label: "Energized",gradient: "from-yellow-400/20 to-amber-500/5" },
  reflective:{ emoji: "🤔", color: "text-violet-400",  label: "Reflective",gradient:"from-violet-500/20 to-purple-500/5" },
  unknown:   { emoji: "🤔", color: "text-slate-400",   label: "Unknown",  gradient: "from-slate-500/20 to-gray-500/5" },
};

export function getMoodInfo(moodString?: string | null, score?: number | null) {
  if (moodString && moodConfig[moodString.toLowerCase()]) {
    return moodConfig[moodString.toLowerCase()];
  }

  if (score !== undefined && score !== null) {
    if (score >= 0.8) return moodConfig.excited;
    if (score >= 0.6) return moodConfig.happy;
    if (score >= 0.4) return moodConfig.neutral;
    if (score >= 0.2) return moodConfig.sad;
    return moodConfig.angry;
  }

  return moodConfig.unknown;
}

export function getMoodEmoji(mood: string | null | undefined) {
  return moodConfig[mood?.toLowerCase() || ""]?.emoji ?? "📝";
}

export function getMoodColor(mood: string | null | undefined) {
  const colorMap: Record<string, string> = {
    happy:     "#22c55e",
    excited:   "#eab308",
    calm:      "#3b82f6",
    neutral:   "#6366f1",
    anxious:   "#a855f7",
    sad:       "#3b82f6",
    angry:     "#ef4444",
    energized: "#f59e0b",
    reflective:"#8b5cf6",
  };
  return colorMap[mood?.toLowerCase() || ""] || "#94a3b8";
}
