import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PHASES: { phase: Phase; label: string; duration: number; color: string }[] = [
  { phase: "inhale", label: "Breathe in...",  duration: 4, color: "#22d3ee" },
  { phase: "hold",   label: "Hold...",         duration: 7, color: "#a78bfa" },
  { phase: "exhale", label: "Breathe out...", duration: 8, color: "#34d399" },
  { phase: "rest",   label: "Rest...",         duration: 1, color: "#94a3b8" },
];

export function BreathingModal({ open, onClose }: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [seconds, setSeconds] = useState(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setPhaseIdx(0);
      setSeconds(PHASES[0].duration);
      setCycles(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setPhaseIdx((pi) => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) setCycles((c) => c + 1);
            return next;
          });
          return PHASES[(phaseIdx + 1) % PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open, phaseIdx]);

  const current = PHASES[phaseIdx];
  const progress = 1 - (seconds / current.duration);
  const scale = current.phase === "inhale" ? 1 + progress * 0.5
    : current.phase === "exhale" ? 1.5 - progress * 0.5
    : current.phase === "hold" ? 1.5 : 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm text-center"
          >
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="glass rounded-3xl p-8 space-y-8">
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Wind className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-bold text-xl">Breathing Exercise</h2>
                </div>
                <p className="text-muted-foreground text-sm">4-7-8 technique — calms the nervous system</p>
              </div>

              <div className="relative flex items-center justify-center h-48">
                <motion.div
                  animate={{ scale, opacity: 0.15 }}
                  transition={{ duration: current.duration, ease: "easeInOut" }}
                  className="absolute w-40 h-40 rounded-full"
                  style={{ backgroundColor: current.color }}
                />
                <motion.div
                  animate={{ scale }}
                  transition={{ duration: current.duration, ease: "easeInOut" }}
                  className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
                  style={{ backgroundColor: `${current.color}30`, border: `3px solid ${current.color}60` }}
                >
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{seconds}</p>
                    <p className="text-xs mt-1" style={{ color: current.color }}>{current.label}</p>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-2">
                {PHASES.map((p, i) => (
                  <div
                    key={p.phase}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: i === phaseIdx ? `${p.color}25` : "transparent",
                      color: i === phaseIdx ? p.color : "#ffffff40",
                      border: `1px solid ${i === phaseIdx ? p.color + "50" : "transparent"}`
                    }}
                  >
                    {p.label.split("...")[0]}
                    <span className="opacity-60">{p.duration}s</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Cycles: <span className="text-white font-semibold">{cycles}</span>
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
