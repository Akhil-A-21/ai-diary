import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Wind, HandHeart, ChevronDown, ChevronUp } from "lucide-react";
import { BreathingModal } from "./breathing-modal";

const HELPLINES = [
  { name: "iCall (India)",           number: "9152987821",      hours: "Mon–Sat, 8am–10pm", flag: "🇮🇳" },
  { name: "Vandrevala Foundation",   number: "1860-2662-345",   hours: "24/7",              flag: "🇮🇳" },
  { name: "NIMHANS",                 number: "080-46110007",    hours: "24/7",              flag: "🇮🇳" },
  { name: "Snehi",                   number: "044-24640050",    hours: "24/7",              flag: "🇮🇳" },
  { name: "Samaritans (UK)",         number: "116 123",         hours: "24/7",              flag: "🇬🇧" },
  { name: "Crisis Text Line (US)",   number: "Text HOME to 741741", hours: "24/7",          flag: "🌍" },
];

const GROUNDING_STEPS = [
  { count: 5, sense: "See",   color: "#8b5cf6", prompt: "Name 5 things you can see right now." },
  { count: 4, sense: "Touch", color: "#06b6d4", prompt: "Notice 4 things you can physically feel." },
  { count: 3, sense: "Hear",  color: "#22c55e", prompt: "Listen for 3 sounds around you." },
  { count: 2, sense: "Smell", color: "#f59e0b", prompt: "Find 2 things you can smell." },
  { count: 1, sense: "Taste", color: "#ef4444", prompt: "Notice 1 thing you can taste." },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SosPanel({ open, onClose }: Props) {
  const [showBreathing, setShowBreathing] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingStarted, setGroundingStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const resetGrounding = () => { setGroundingStep(0); setGroundingStarted(false); };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-6 bottom-6 md:inset-auto md:right-6 md:top-6 md:bottom-6 md:w-[420px] z-[70] overflow-y-auto rounded-3xl border border-white/10"
              style={{ background: "linear-gradient(160deg, #0f0f2a 0%, #1a0a2e 100%)" }}
            >
              <div className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b border-white/5" style={{ background: "linear-gradient(160deg, #0f0f2a 0%, #1a0a2e 100%)" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <HandHeart className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Safe Space</h2>
                      <p className="text-xs text-muted-foreground">You are not alone. Help is here.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                <div className="rounded-2xl p-4 border border-rose-500/20 bg-rose-500/5">
                  <p className="text-white/90 text-sm leading-relaxed">
                    Whatever you're going through right now, it's okay to feel this way. You don't have to handle it alone.
                    Take a breath — this moment will pass. 💙
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowBreathing(true)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-center"
                  >
                    <Wind className="w-6 h-6 text-cyan-400" />
                    <span className="text-xs font-medium text-white">Breathing</span>
                    <span className="text-[10px] text-muted-foreground">4-7-8 technique</span>
                  </button>
                  <button
                    onClick={() => { setGroundingStarted(true); setGroundingStep(0); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-center"
                  >
                    <span className="text-2xl">🌿</span>
                    <span className="text-xs font-medium text-white">Grounding</span>
                    <span className="text-[10px] text-muted-foreground">5-4-3-2-1 method</span>
                  </button>
                </div>

                <AnimatePresence>
                  {groundingStarted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl p-4 border border-violet-500/20 bg-violet-500/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold text-sm">Grounding Exercise</p>
                        <button onClick={resetGrounding} className="text-muted-foreground hover:text-white text-xs">Reset</button>
                      </div>
                      {GROUNDING_STEPS.map((step, i) => (
                        <div
                          key={step.sense}
                          className={`p-3 rounded-xl border text-sm transition-all cursor-pointer ${i === groundingStep ? "border-opacity-50 bg-white/5" : i < groundingStep ? "opacity-40" : "opacity-20"}`}
                          style={{ borderColor: step.color + (i <= groundingStep ? "50" : "20") }}
                          onClick={() => setGroundingStep(Math.min(GROUNDING_STEPS.length - 1, i + 1))}
                        >
                          <span className="font-bold mr-2" style={{ color: step.color }}>{step.count} {step.sense}</span>
                          <span className="text-white/70">{step.prompt}</span>
                        </div>
                      ))}
                      {groundingStep >= GROUNDING_STEPS.length && (
                        <p className="text-green-400 text-sm text-center font-medium">✓ Great job! You're grounded.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <button
                    onClick={() => setShowHelp((v) => !v)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">Crisis Helplines</span>
                    </div>
                    {showHelp ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showHelp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mt-2"
                      >
                        {HELPLINES.map((line) => (
                          <div key={line.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2">
                              <span>{line.flag}</span>
                              <div>
                                <p className="text-white text-xs font-medium">{line.name}</p>
                                <p className="text-muted-foreground text-[10px]">{line.hours}</p>
                              </div>
                            </div>
                            <a
                              href={`tel:${line.number.replace(/\s/g, "")}`}
                              className="text-xs font-bold text-blue-300 hover:text-blue-100 transition-colors"
                            >
                              {line.number}
                            </a>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rounded-2xl p-4 bg-green-500/5 border border-green-500/20">
                  <p className="text-white/70 text-xs leading-relaxed text-center">
                    🌱 TELE MANAS — India's 24/7 free mental health helpline
                  </p>
                  <a
                    href="tel:14416"
                    className="flex items-center justify-center gap-2 w-full mt-3 py-3 px-6 rounded-xl font-bold text-white text-base transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                  >
                    <Phone className="w-5 h-5" />
                    Call 14416 — Free & Confidential
                  </a>
                </div>

                <p className="text-center text-muted-foreground text-xs">
                  ❤️ Reaching out for help is a sign of strength, not weakness.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BreathingModal open={showBreathing} onClose={() => setShowBreathing(false)} />
    </>
  );
}
