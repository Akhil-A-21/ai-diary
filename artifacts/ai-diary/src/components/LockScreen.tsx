import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Delete, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Props {
  onUnlock: () => void;
}

const DOTS = [0, 1, 2, 3];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function LockScreen({ onUnlock }: Props) {
  const { user, logout } = useAuth();
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);
  const verifyCalledRef = useRef(false);

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !verifyCalledRef.current) {
      verifyCalledRef.current = true;
      verifyPin(pin.join(""));
    }
  }, [pin]);

  const verifyPin = async (code: string) => {
    setChecking(true);
    setError(false);
    try {
      const res = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json();
      if (data.valid) {
        onUnlock();
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setShake(false);
          setPin([]);
          verifyCalledRef.current = false;
        }, 600);
      }
    } catch {
      setError(true);
      setPin([]);
      verifyCalledRef.current = false;
    } finally {
      setChecking(false);
    }
  };

  const handleKey = (key: string) => {
    if (checking || pin.length === 4) return;
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      setError(false);
      verifyCalledRef.current = false;
    } else if (key !== "") {
      setPin((p) => [...p, key]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Background glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(var(--primary))" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "hsl(var(--accent))" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center gap-8 w-full max-w-xs px-6"
      >
        {/* App icon + name */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Sparkles size={30} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white">AI Diary</h1>
            {user && (
              <p className="text-xs mt-1" style={{ color: "hsl(240 8% 50%)" }}>
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex flex-col items-center gap-5">
          <p className="text-sm font-medium" style={{ color: "hsl(240 8% 65%)" }}>
            Enter your PIN
          </p>

          <motion.div
            animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="flex gap-4"
          >
            {DOTS.map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: pin.length > i ? 1.1 : 1,
                  background: error
                    ? "hsl(0 70% 55%)"
                    : pin.length > i
                    ? "hsl(var(--primary))"
                    : "transparent",
                  borderColor: error
                    ? "hsl(0 70% 55%)"
                    : pin.length > i
                    ? "hsl(var(--primary))"
                    : "hsl(240 12% 30%)",
                }}
                transition={{ duration: 0.15 }}
                className="w-4 h-4 rounded-full border-2"
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-center"
                style={{ color: "hsl(0 70% 60%)" }}
              >
                Incorrect PIN — try again
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {KEYS.map((key, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleKey(key)}
              disabled={key === "" || checking}
              whileHover={key !== "" ? { scale: 1.05 } : {}}
              whileTap={key !== "" ? { scale: 0.93 } : {}}
              className="h-16 rounded-2xl flex items-center justify-center font-semibold text-xl disabled:opacity-0 transition-colors select-none"
              style={
                key === "del"
                  ? {
                      background: "hsl(240 12% 18%)",
                      color: "hsl(var(--muted-foreground))",
                      fontSize: "0.9rem",
                    }
                  : key === ""
                  ? { background: "transparent" }
                  : {
                      background: "hsl(240 12% 15%)",
                      color: "hsl(var(--foreground))",
                      border: "1px solid hsl(240 12% 22%)",
                    }
              }
            >
              {key === "del" ? <Delete size={20} /> : key}
            </motion.button>
          ))}
        </div>

        {/* Sign out link */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs mt-2 transition-colors hover:opacity-80"
          style={{ color: "hsl(240 8% 45%)" }}
        >
          <LogOut size={12} />
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
