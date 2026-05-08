import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LockOpen, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface PinStatus {
  enabled: boolean;
}

interface Props {
  status: PinStatus | undefined;
  onStatusChange: () => void;
}

function PinInput({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder = "••••",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(240 8% 65%)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          inputMode="numeric"
          maxLength={4}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none tracking-widest"
          style={{
            background: "hsl(240 12% 12%)",
            borderColor: "hsl(240 12% 22%)",
            color: "hsl(var(--foreground))",
          }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "hsl(240 8% 45%)" }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function AppLockSettings({ status, onStatusChange }: Props) {
  const enabled = status?.enabled ?? false;

  // Setup flow (when enabling for the first time or changing PIN)
  const [showSetup, setShowSetup] = useState(false);
  const [showCurrentInput, setShowCurrentInput] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [showConfirmInput, setShowConfirmInput] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  // Disabling flow
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePin, setDisablePin] = useState("");
  const [showDisableInput, setShowDisableInput] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const resetSetup = () => {
    setShowSetup(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setShowCurrentInput(false);
    setShowNewInput(false);
    setShowConfirmInput(false);
  };

  const resetDisable = () => {
    setShowDisableForm(false);
    setDisablePin("");
    setShowDisableInput(false);
  };

  const handleEnable = () => setShowSetup(true);
  const handleDisable = () => setShowDisableForm(true);

  const handleSavePin = async () => {
    if (newPin.length < 4) {
      toast({ title: "PIN must be 4 digits", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs don't match", variant: "destructive" });
      return;
    }

    // If currently enabled, verify current PIN first
    if (enabled && currentPin.length > 0) {
      try {
        const vRes = await fetch("/api/pin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: currentPin }),
        });
        const vData = await vRes.json();
        if (!vData.valid) {
          toast({ title: "Current PIN is incorrect", variant: "destructive" });
          return;
        }
      } catch {
        toast({ title: "Could not verify current PIN", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pin/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin }),
      });
      if (!res.ok) throw new Error();
      toast({ title: enabled ? "PIN updated" : "App lock enabled" });
      resetSetup();
      onStatusChange();
    } catch {
      toast({ title: "Failed to save PIN", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDisable = async () => {
    if (disablePin.length < 4) {
      toast({ title: "Enter your current PIN to disable", variant: "destructive" });
      return;
    }
    // Verify PIN before disabling
    try {
      const vRes = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: disablePin }),
      });
      const vData = await vRes.json();
      if (!vData.valid) {
        toast({ title: "Incorrect PIN", variant: "destructive" });
        return;
      }
    } catch {
      toast({ title: "Could not verify PIN", variant: "destructive" });
      return;
    }

    setDisabling(true);
    try {
      await fetch("/api/pin/disable", { method: "POST" });
      toast({ title: "App lock disabled" });
      resetDisable();
      onStatusChange();
    } catch {
      toast({ title: "Failed to disable lock", variant: "destructive" });
    } finally {
      setDisabling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {enabled ? (
            <Lock size={15} style={{ color: "hsl(var(--primary))" }} />
          ) : (
            <LockOpen size={15} style={{ color: "hsl(240 8% 50%)" }} />
          )}
          <div>
            <p className="text-sm font-medium">
              {enabled ? "App Lock is ON" : "App Lock is OFF"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {enabled
                ? "A PIN is required every session"
                : "Anyone with your device can open the app"}
            </p>
          </div>
        </div>

        <button
          onClick={enabled ? handleDisable : handleEnable}
          className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
          style={{ background: enabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: enabled ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>

      {/* Change PIN button (only when enabled and setup form not open) */}
      {enabled && !showSetup && !showDisableForm && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSetup(true)}
          className="text-sm px-4 py-2 rounded-xl border transition-colors"
          style={{
            borderColor: "hsl(240 12% 22%)",
            color: "hsl(var(--muted-foreground))",
            background: "hsl(240 12% 12%)",
          }}
        >
          Change PIN
        </motion.button>
      )}

      {/* Set / Change PIN form */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{
                background: "hsl(240 12% 10%)",
                borderColor: "hsl(240 12% 20%)",
              }}
            >
              <p className="text-sm font-semibold text-white">
                {enabled ? "Change PIN" : "Set a new PIN"}
              </p>

              {/* Current PIN (only needed when changing) */}
              {enabled && (
                <PinInput
                  label="Current PIN"
                  value={currentPin}
                  onChange={setCurrentPin}
                  show={showCurrentInput}
                  onToggleShow={() => setShowCurrentInput((v) => !v)}
                />
              )}

              <PinInput
                label="New PIN (4 digits)"
                value={newPin}
                onChange={setNewPin}
                show={showNewInput}
                onToggleShow={() => setShowNewInput((v) => !v)}
                placeholder="Enter 4-digit PIN"
              />

              <PinInput
                label="Confirm PIN"
                value={confirmPin}
                onChange={setConfirmPin}
                show={showConfirmInput}
                onToggleShow={() => setShowConfirmInput((v) => !v)}
              />

              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSavePin}
                  disabled={saving || newPin.length < 4 || confirmPin.length < 4}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Check size={14} />
                  {saving ? "Saving…" : enabled ? "Update PIN" : "Enable Lock"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={resetSetup}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: "hsl(240 12% 18%)", color: "hsl(var(--muted-foreground))" }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disable confirm form */}
      <AnimatePresence>
        {showDisableForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{
                background: "hsl(0 15% 10%)",
                borderColor: "hsl(0 30% 22%)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "hsl(0 70% 65%)" }}>
                Disable App Lock
              </p>
              <p className="text-xs" style={{ color: "hsl(240 8% 55%)" }}>
                Enter your current PIN to confirm
              </p>

              <PinInput
                label="Current PIN"
                value={disablePin}
                onChange={setDisablePin}
                show={showDisableInput}
                onToggleShow={() => setShowDisableInput((v) => !v)}
              />

              <div className="flex gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmDisable}
                  disabled={disabling || disablePin.length < 4}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: "hsl(0 65% 45%)" }}
                >
                  <LockOpen size={14} />
                  {disabling ? "Disabling…" : "Yes, disable lock"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={resetDisable}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: "hsl(240 12% 18%)", color: "hsl(var(--muted-foreground))" }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
