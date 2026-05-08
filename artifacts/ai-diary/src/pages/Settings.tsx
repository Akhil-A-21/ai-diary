import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Shield, User, Sun, Moon, Save, Lock,
  Mail, Clock, Loader2, CheckCircle2, AlertCircle, Send
} from "lucide-react";
import { usePreferences, useUpdatePreferences, useSendTestEmail } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";
import AppLockSettings from "../components/AppLockSettings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

function Toggle({
  enabled,
  onToggle,
  testId,
}: { enabled: boolean; onToggle: () => void; testId?: string }) {
  return (
    <button
      onClick={onToggle}
      data-testid={testId}
      className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: enabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: enabled ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

function SectionCard({
  title, icon, children,
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "hsl(var(--primary))" }}>{icon}</span>
        <h2 className="font-semibold text-sm text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { data: prefs, isLoading: prefsLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const sendTestEmail = useSendTestEmail();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [testEmailState, setTestEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const { data: pinStatus, refetch: refetchPin } = useQuery({
    queryKey: ["pin-status"],
    queryFn: async () => {
      const res = await fetch("/api/pin");
      return res.json() as Promise<{ enabled: boolean }>;
    },
  });

  // Silently sync browser timezone whenever preferences load
  useEffect(() => {
    if (!prefs) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (prefs.timezone !== tz) {
      updatePrefs.mutate({ timezone: tz });
    }
  }, [prefs?.id]);

  const handleThemeToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleUpdatePrefs = async (updates: Record<string, unknown>) => {
    if (!prefs) return;
    try {
      await updatePrefs.mutateAsync(updates as Parameters<typeof updatePrefs.mutateAsync>[0]);
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailState("sending");
    try {
      await sendTestEmail.mutateAsync();
      setTestEmailState("sent");
      setTimeout(() => setTestEmailState("idle"), 4000);
      toast({ title: "Test email sent! Check your inbox." });
    } catch {
      setTestEmailState("error");
      setTimeout(() => setTestEmailState("idle"), 4000);
      toast({ title: "Failed to send — check that RESEND_API_KEY is configured", variant: "destructive" });
    }
  };

  const emailToNotify = user?.email ?? "your email";
  const hasResendKey = true; // server will error if not configured

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-1 text-muted-foreground">Personalise your AI Diary experience</p>
      </div>

      {/* ── Your Account ── */}
      <SectionCard title="Your Account" icon={<User size={15} />}>
        <div className="flex items-center gap-3">
          {user?.picture && (
            <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="text-sm font-medium text-white">{user?.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Appearance ── */}
      <SectionCard title="Appearance" icon={<Sun size={15} />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Dark Mode</p>
            <p className="text-xs mt-0.5 text-muted-foreground">Switch between light and dark theme</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleThemeToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium text-white"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            {theme === "light" ? "Dark" : "Light"}
          </motion.button>
        </div>
      </SectionCard>

      {/* ── Email Notifications ── */}
      <SectionCard title="Email Notifications" icon={<Bell size={15} />}>
        {prefsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        ) : prefs ? (
          <div className="space-y-5">
            {/* To address */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <Mail size={14} style={{ color: "hsl(var(--primary))" }} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/70">Emails sent to:</p>
                <p className="text-sm font-semibold text-white truncate">{emailToNotify}</p>
              </div>
            </div>

            {/* Daily reminder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Daily Diary Reminder</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">Email you to record your diary each day</p>
                </div>
                <Toggle
                  enabled={prefs.reminderEnabled}
                  onToggle={() => handleUpdatePrefs({ reminderEnabled: !prefs.reminderEnabled })}
                  testId="toggle-reminder"
                />
              </div>

              <AnimatePresence>
                {prefs.reminderEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 pl-0">
                      <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                      <label className="text-xs text-muted-foreground">Send at:</label>
                      <input
                        type="time"
                        value={prefs.reminderTime || "20:00"}
                        onChange={(e) => handleUpdatePrefs({ reminderTime: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border text-sm outline-none text-white"
                        style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))" }}
                        data-testid="input-reminder-time"
                      />
                      <span className="text-xs text-muted-foreground">
                        ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: "hsl(var(--border))" }} />

            {/* Inactivity alert */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">3-Day Inactivity Alert</p>
                <p className="text-xs mt-0.5 text-muted-foreground">Email you if you haven't logged in for 3 days</p>
              </div>
              <Toggle
                enabled={prefs.inactivityAlertEnabled}
                onToggle={() => handleUpdatePrefs({ inactivityAlertEnabled: !prefs.inactivityAlertEnabled })}
                testId="toggle-inactivity"
              />
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: "hsl(var(--border))" }} />

            {/* Test email */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Test Email</p>
                <p className="text-xs mt-0.5 text-muted-foreground">Send a test to verify your notifications work</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendTestEmail}
                disabled={testEmailState === "sending"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-60"
                style={{
                  borderColor: testEmailState === "sent"
                    ? "#22c55e50"
                    : testEmailState === "error"
                    ? "#ef444450"
                    : "hsl(var(--primary) / 0.4)",
                  color: testEmailState === "sent"
                    ? "#22c55e"
                    : testEmailState === "error"
                    ? "#ef4444"
                    : "hsl(var(--primary))",
                  background: testEmailState === "sent"
                    ? "#22c55e10"
                    : testEmailState === "error"
                    ? "#ef444410"
                    : "hsl(var(--primary) / 0.08)",
                }}
              >
                {testEmailState === "sending" && <Loader2 size={12} className="animate-spin" />}
                {testEmailState === "sent" && <CheckCircle2 size={12} />}
                {testEmailState === "error" && <AlertCircle size={12} />}
                {testEmailState === "idle" && <Send size={12} />}
                {testEmailState === "sending" ? "Sending…" : testEmailState === "sent" ? "Sent!" : testEmailState === "error" ? "Failed" : "Send test"}
              </motion.button>
            </div>
          </div>
        ) : null}
      </SectionCard>

      {/* ── App Lock ── */}
      <SectionCard title="App Lock" icon={<Lock size={15} />}>
        <AppLockSettings
          status={pinStatus}
          onStatusChange={() => {
            refetchPin();
            const email = user?.email || "";
            sessionStorage.removeItem(`ai_diary_unlocked_${email}`);
          }}
        />
      </SectionCard>

      {/* ── Privacy ── */}
      <SectionCard title="Privacy" icon={<Shield size={15} />}>
        <p className="text-sm text-muted-foreground">
          Your diary entries are private and isolated to your account. No data is shared with third parties. AI analysis is processed securely via Groq. Email notifications are sent only to your verified Google account email.
        </p>
      </SectionCard>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">AI Diary v1.0</p>
        <p className="text-xs mt-1 text-muted-foreground">Built with care for your emotional wellbeing</p>
      </div>
    </div>
  );
}
