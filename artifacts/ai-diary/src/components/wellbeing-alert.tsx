import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Heart, X, HeartHandshake, MessageCircleHeart, Video } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const DISMISS_KEY = "wellbeing_dismissed_until";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface WellbeingData {
  needsSupport: boolean;
  severity: "none" | "mild" | "serious" | "urgent";
  reason: "absent" | "distressed" | "both" | null;
  daysSilent: number | null;
}

const CONFIG = {
  mild: {
    icon: HeartHandshake,
    accent: "#a855f7",
    bg: "linear-gradient(135deg, #2d0a1f 0%, #1a0a2e 100%)",
    border: "rgba(168,85,247,0.25)",
    badgeColor: "#c4b5fd",
    headline: (d: WellbeingData) =>
      d.reason === "distressed"
        ? "You've been going through a hard time"
        : `It's been ${d.daysSilent} day${d.daysSilent !== 1 ? "s" : ""} — we noticed your quiet`,
    body: (d: WellbeingData) =>
      d.reason === "distressed"
        ? "Your feelings are valid and you deserve support. Even a short chat can help lighten the load."
        : "Life gets busy and heavy. Whenever you're ready, your diary is here — no pressure, no judgment.",
    showHelpline: false,
  },
  serious: {
    icon: HeartHandshake,
    accent: "#a855f7",
    bg: "linear-gradient(135deg, #2d0a1f 0%, #1a0a2e 100%)",
    border: "rgba(168,85,247,0.35)",
    badgeColor: "#c4b5fd",
    headline: (d: WellbeingData) =>
      `${d.daysSilent ? `${d.daysSilent} days of quiet — ` : ""}we genuinely care about how you're doing`,
    body: () =>
      "If something is weighing on you, please know there are people who want to help — and that reaching out takes real courage.",
    showHelpline: true,
  },
  urgent: {
    icon: Phone,
    accent: "#3b82f6",
    bg: "linear-gradient(135deg, #0d1b2e 0%, #0a0e1a 100%)",
    border: "rgba(59,130,246,0.35)",
    badgeColor: "#93c5fd",
    headline: (d: WellbeingData) =>
      `${d.daysSilent} day${d.daysSilent !== 1 ? "s" : ""} — you matter, deeply`,
    body: () =>
      "Whatever you're going through right now, please know you're not alone. Help is just a call away, and it's completely free.",
    showHelpline: true,
  },
};

export function WellbeingAlert() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<WellbeingData | null>(null);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    fetch(`${BASE}/api/diary/wellbeing-check`)
      .then((r) => r.json())
      .then((d: WellbeingData) => {
        if (d.needsSupport && d.severity !== "none") {
          setData(d);
          setShow(true);
          if (d.severity === "urgent") setExpanded(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + COOLDOWN_MS));
    setShow(false);
  };

  if (!data || data.severity === "none") return null;

  const cfg = CONFIG[data.severity as keyof typeof CONFIG] ?? CONFIG.mild;
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {show && (
        <>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={handleDismiss}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: expanded ? 40 : -20, scale: expanded ? 0.95 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: expanded ? 20 : -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => !expanded && setExpanded(true)}
            className={expanded
              ? "fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] z-50"
              : "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-md cursor-pointer"
            }
          >
            {!expanded ? (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.accent}22` }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.accent }} />
                </div>
                <p className="flex-1 text-sm text-white font-medium leading-snug">
                  {cfg.headline(data)}{" "}
                  <span className="underline underline-offset-2" style={{ color: cfg.badgeColor }}>See resources</span>
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="rounded-3xl shadow-2xl border overflow-hidden"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="p-6 pb-0 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.accent}22` }}>
                      <Icon className="w-6 h-6" style={{ color: cfg.accent }} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">{cfg.headline(data)}</h3>
                      <p className="text-xs font-medium mt-0.5" style={{ color: cfg.badgeColor }}>
                        {data.severity === "urgent" ? "We're here for you" : "Mental Health Support"}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleDismiss} className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <p className="text-white/90 text-sm leading-relaxed">{cfg.body(data)}</p>

                  {cfg.showHelpline && (
                    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${cfg.border}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" style={{ color: cfg.accent }} />
                        <p className="text-white font-semibold text-sm">TELE MANAS — National Helpline</p>
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed mb-3">
                        Free, confidential mental health support available 24/7. Speak with trained counsellors in your language.
                      </p>
                      <a
                        href="tel:14416"
                        className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-white text-base transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                      >
                        <Phone className="w-5 h-5" />
                        Call 14416 — Free & Confidential
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span>Reaching out for help is a sign of strength, not weakness.</span>
                  </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    I'm okay for now
                  </button>
                  <Link
                    href="/chat"
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center text-white border transition-colors flex items-center justify-center gap-1.5"
                    style={{ background: `${cfg.accent}33`, borderColor: `${cfg.accent}55` }}
                  >
                    <MessageCircleHeart className="w-4 h-4" />
                    Talk to AI Diary
                  </Link>
                  <Link
                    href="/record"
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center text-white border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    Record
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
