import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Flame, Heart, Phone, MessageCircleHeart, X, Sparkles, Star
} from "lucide-react";

const MILESTONE_KEY = "streak_milestone_last_shown";

function getMilestoneConfig(streak: number) {
  if (streak >= 365) return {
    emoji: "🌟",
    badge: "One whole year!",
    headline: "A full year of showing up for yourself.",
    body: "365 days of self-reflection is extraordinary. You've done something most people only dream of — you made your inner world a priority, every single day. We're genuinely in awe of you.",
    color: "#f59e0b",
    colorMuted: "rgba(245,158,11,0.15)",
    colorBorder: "rgba(245,158,11,0.3)",
  };
  if (streak >= 100) return {
    emoji: "💫",
    badge: "100-day streak!",
    headline: "100 days of courage and consistency.",
    body: "You've spent over three months choosing to reflect, grow, and care for yourself. That kind of dedication changes who you are from the inside out. You should be incredibly proud.",
    color: "#a855f7",
    colorMuted: "rgba(168,85,247,0.15)",
    colorBorder: "rgba(168,85,247,0.3)",
  };
  if (streak >= 30) return {
    emoji: "🔥",
    badge: "30-day streak!",
    headline: "A full month of showing up for yourself.",
    body: "30 days is a real milestone. You've turned self-reflection into a genuine habit — and that habit is quietly rewiring your mind toward clarity, resilience, and self-compassion.",
    color: "#ef4444",
    colorMuted: "rgba(239,68,68,0.12)",
    colorBorder: "rgba(239,68,68,0.3)",
  };
  if (streak >= 14) return {
    emoji: "✨",
    badge: "2-week streak!",
    headline: "Two solid weeks of self-care.",
    body: "Two weeks of daily reflection is no small feat. You're creating a deep habit of listening to yourself — and that quiet act of attention is one of the most loving things you can do for your mind.",
    color: "#6366f1",
    colorMuted: "rgba(99,102,241,0.12)",
    colorBorder: "rgba(99,102,241,0.3)",
  };
  if (streak >= 7) return {
    emoji: "🌸",
    badge: "7-day streak!",
    headline: "A whole week of checking in with yourself.",
    body: "Seven days in a row — that means every single morning or evening this week, you made time for you. That is a beautiful, gentle act of self-love. Keep going, one day at a time.",
    color: "#ec4899",
    colorMuted: "rgba(236,72,153,0.12)",
    colorBorder: "rgba(236,72,153,0.3)",
  };
  return {
    emoji: "🌱",
    badge: `${streak}-day streak!`,
    headline: "Five days of caring for your mind.",
    body: "Five consecutive days of reflecting on your life — that's not a coincidence. That's a choice you make, over and over, to know yourself better. You're doing something that genuinely matters.",
    color: "#22c55e",
    colorMuted: "rgba(34,197,94,0.12)",
    colorBorder: "rgba(34,197,94,0.3)",
  };
}

interface Props {
  streak: number;
  onDismiss: () => void;
}

export function StreakMilestoneModal({ streak, onDismiss }: Props) {
  const cfg = getMilestoneConfig(streak);

  return (
    <AnimatePresence>
      <motion.div
        key="streak-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
        onClick={onDismiss}
      >
        <motion.div
          key="streak-modal"
          initial={{ opacity: 0, scale: 0.88, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-elevated rounded-3xl w-full max-w-sm overflow-hidden"
        >
          {/* ── Top accent bar ── */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${cfg.color}, ${cfg.color}88)` }} />

          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
                style={{ background: cfg.colorMuted, border: `1px solid ${cfg.colorBorder}` }}
              >
                {cfg.emoji}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>
                  {cfg.badge}
                </p>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="font-display font-bold text-foreground text-lg leading-none">
                    {streak} days in a row
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex-shrink-0 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="px-6 pb-5 space-y-4">
            <div>
              <h3 className="font-display font-bold text-foreground text-xl leading-snug mb-2">
                {cfg.headline}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {cfg.body}
              </p>
            </div>

            {/* Affirmation pill */}
            <div
              className="flex items-start gap-2.5 rounded-2xl p-3.5"
              style={{ background: cfg.colorMuted, border: `1px solid ${cfg.colorBorder}` }}
            >
              <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
              <p className="text-xs leading-relaxed text-foreground/80">
                Your mental health journey matters. If anything ever feels heavy, you don't have to carry it alone — support is always available.
              </p>
            </div>

            {/* Tele MANAS helpline */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: "hsl(var(--muted) / 0.5)",
                border: "1px solid hsl(var(--border) / 0.6)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <p className="text-xs font-bold text-foreground tracking-wide">Tele MANAS — National Mental Health Helpline</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Free, confidential support 24 × 7 in multiple languages. Speak with trained counsellors — no appointment needed.
              </p>
              <div className="flex gap-2">
                <a
                  href="tel:14416"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call 14416
                </a>
                <a
                  href="tel:18008914416"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  1800-891-4416
                </a>
              </div>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div
            className="px-6 pb-6 flex gap-2"
            style={{ borderTop: "1px solid hsl(var(--border) / 0.4)", paddingTop: "1rem" }}
          >
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-muted-foreground border border-border/60 hover:bg-muted/50 transition-colors"
            >
              Keep going ✨
            </button>
            <Link
              href="/chat"
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-center text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 no-underline"
              style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))` }}
            >
              <MessageCircleHeart className="w-4 h-4" />
              Chat with AI
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Returns true and marks the milestone if the streak qualifies for a new celebration */
export function shouldShowMilestone(streak: number): boolean {
  if (streak < 5) return false;
  const lastShown = Number(localStorage.getItem(MILESTONE_KEY) ?? "0");
  // Show at 5, 7, 14, 30, 100, 365 — and whenever the streak is 5+ and hasn't been shown yet
  const milestones = [5, 7, 14, 30, 50, 100, 200, 365];
  const nextMilestone = milestones.find((m) => m > lastShown && streak >= m);
  if (nextMilestone !== undefined) return true;
  // Also show every 30 days beyond 365
  if (streak >= 365 && streak - lastShown >= 30) return true;
  return false;
}

export function markMilestoneShown(streak: number) {
  localStorage.setItem(MILESTONE_KEY, String(streak));
}
