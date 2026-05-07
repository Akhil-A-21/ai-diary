import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function getMoodColor(mood: string | null | undefined) {
  const map: Record<string, string> = {
    happy: "#22c55e",
    energized: "#f59e0b",
    calm: "#3b82f6",
    reflective: "#8b5cf6",
    sad: "#64748b",
    anxious: "#ef4444",
    neutral: "#94a3b8",
  };
  return map[mood?.toLowerCase() || ""] || "#94a3b8";
}

export function getMoodEmoji(mood: string | null | undefined) {
  const map: Record<string, string> = {
    happy: "😊",
    energized: "⚡",
    calm: "😌",
    reflective: "🤔",
    sad: "😢",
    anxious: "😰",
    neutral: "😐",
  };
  return map[mood?.toLowerCase() || ""] || "📝";
}
