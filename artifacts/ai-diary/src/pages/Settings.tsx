import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Shield, User, Sun, Moon, Lock,
  Mail, Clock, Loader2, CheckCircle2, AlertCircle, Send, Smartphone, BellOff,
  FileDown
} from "lucide-react";
import { usePreferences, useUpdatePreferences, useSendTestEmail, useDiaryEntries, useMoodTrends, useEmotionPatterns } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";
import AppLockSettings from "../components/AppLockSettings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { exportDiaryPdf } from "../lib/exportDiaryPdf";

// ─── Push notification helpers ───────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) throw new Error("Service workers not supported");
  return navigator.serviceWorker.register("/sw.js");
}

async function subscribeToPush(vapidKey: string): Promise<PushSubscription> {
  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}

async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

// ─── Reusable UI pieces ───────────────────────────────────────────────────────

function Toggle({ enabled, onToggle, disabled, testId }: {
  enabled: boolean; onToggle: () => void; disabled?: boolean; testId?: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      data-testid={testId}
      className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: enabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: enabled ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "hsl(var(--primary))" }}>{icon}</span>
        <h2 className="font-semibold text-sm text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

type BtnState = "idle" | "loading" | "ok" | "err";

function ActionButton({ state, idleLabel, loadingLabel, okLabel, errLabel, onClick }: {
  state: BtnState; idleLabel: string; loadingLabel: string; okLabel: string; errLabel: string;
  onClick: () => void;
}) {
  const isOk = state === "ok";
  const isErr = state === "err";
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-60"
      style={{
        borderColor: isOk ? "#22c55e50" : isErr ? "#ef444450" : "hsl(var(--primary) / 0.4)",
        color: isOk ? "#22c55e" : isErr ? "#ef4444" : "hsl(var(--primary))",
        background: isOk ? "#22c55e10" : isErr ? "#ef444410" : "hsl(var(--primary) / 0.08)",
      }}
    >
      {state === "loading" && <Loader2 size={12} className="animate-spin" />}
      {state === "ok" && <CheckCircle2 size={12} />}
      {state === "err" && <AlertCircle size={12} />}
      {state === "idle" && <Send size={12} />}
      {state === "loading" ? loadingLabel : state === "ok" ? okLabel : state === "err" ? errLabel : idleLabel}
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Settings() {
  const { user } = useAuth();
  const { data: prefs, isLoading: prefsLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const sendTestEmail = useSendTestEmail();

  const { data: allEntries = [] } = useDiaryEntries();
  const { data: moodTrends = [] } = useMoodTrends();
  const { data: emotionPatterns } = useEmotionPatterns();

  const [theme, setTheme] = useState<"light" | "dark">(
    () => document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const [testEmailState, setTestEmailState] = useState<BtnState>("idle");
  const [pushState, setPushState] = useState<"unknown" | "unsupported" | "denied" | "subscribed" | "unsubscribed">("unknown");
  const [testPushState, setTestPushState] = useState<BtnState>("idle");
  const [pushLoading, setPushLoading] = useState(false);
  const [pdfState, setPdfState] = useState<BtnState>("idle");

  const { data: pinStatus, refetch: refetchPin } = useQuery({
    queryKey: ["pin-status"],
    queryFn: async () => {
      const res = await fetch("/api/pin");
      return res.json() as Promise<{ enabled: boolean }>;
    },
  });

  // Sync browser timezone silently
  useEffect(() => {
    if (!prefs) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (prefs.timezone !== tz) updatePrefs.mutate({ timezone: tz });
  }, [prefs?.id]);

  // Detect current push subscription state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") { setPushState("denied"); return; }
    getCurrentSubscription().then((sub) => {
      setPushState(sub ? "subscribed" : "unsubscribed");
    });
  }, []);

  const handleThemeToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("ai-diary-theme", next);
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

  const handleExportPdf = async () => {
    setPdfState("loading");
    try {
      const patterns = emotionPatterns?.patterns ?? [];
      await exportDiaryPdf(
        user?.name ?? user?.email ?? "User",
        allEntries,
        moodTrends,
        patterns,
      );
      setPdfState("ok");
      setTimeout(() => setPdfState("idle"), 4000);
      toast({ title: "PDF downloaded!" });
    } catch (err) {
      console.error(err);
      setPdfState("err");
      setTimeout(() => setPdfState("idle"), 4000);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    }
  };

  const handleTestEmail = async () => {
    setTestEmailState("loading");
    try {
      await sendTestEmail.mutateAsync();
      setTestEmailState("ok");
      setTimeout(() => setTestEmailState("idle"), 4000);
      toast({ title: "Test email sent! Check your inbox." });
    } catch {
      setTestEmailState("err");
      setTimeout(() => setTestEmailState("idle"), 4000);
      toast({ title: "Failed to send test email", variant: "destructive" });
    }
  };

  const handleEnablePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushState("denied"); return; }

      const res = await fetch("/api/push/vapid-public-key");
      const { key } = await res.json();
      const sub = await subscribeToPush(key);
      const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });

      setPushState("subscribed");
      toast({ title: "Browser notifications enabled!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Could not enable push notifications", variant: "destructive" });
    } finally {
      setPushLoading(false);
    }
  }, []);

  const handleDisablePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const sub = await getCurrentSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushState("unsubscribed");
      toast({ title: "Browser notifications disabled" });
    } catch {
      toast({ title: "Failed to disable notifications", variant: "destructive" });
    } finally {
      setPushLoading(false);
    }
  }, []);

  const handleTestPush = async () => {
    setTestPushState("loading");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      if (!res.ok) throw new Error();
      setTestPushState("ok");
      setTimeout(() => setTestPushState("idle"), 4000);
      toast({ title: "Test notification sent!" });
    } catch {
      setTestPushState("err");
      setTimeout(() => setTestPushState("idle"), 4000);
      toast({ title: "Failed — make sure notifications are enabled", variant: "destructive" });
    }
  };

  const emailToNotify = user?.email ?? "your email";
  const pushSupported = pushState !== "unsupported";
  const pushEnabled = pushState === "subscribed";

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-sm mt-1 text-muted-foreground">Personalise your AI Diary experience</p>
      </div>

      {/* ── Account ── */}
      <SectionCard title="Your Account" icon={<User size={15} />}>
        <div className="flex items-center gap-3">
          {user?.picture && <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />}
          <div>
            <p className="text-sm font-medium text-foreground">{user?.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Appearance ── */}
      <SectionCard title="Appearance" icon={<Sun size={15} />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs mt-0.5 text-muted-foreground">Switch between light and dark theme</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleThemeToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium text-foreground"
            style={{ borderColor: "hsl(var(--border))" }}>
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            {theme === "light" ? "Dark" : "Light"}
          </motion.button>
        </div>
      </SectionCard>

      {/* ── Browser Notifications ── */}
      <SectionCard title="Browser Notifications" icon={<Smartphone size={15} />}>
        {!pushSupported ? (
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <BellOff size={16} className="flex-shrink-0 mt-0.5" />
            <p>Push notifications are not supported in this browser.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get notified directly on this device — even when AI Diary isn't open. Fires at the same time as your email reminder.
            </p>

            {/* Status + toggle row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs mt-0.5 text-muted-foreground">
                  {pushState === "denied"
                    ? "Blocked by browser — allow in site settings"
                    : pushEnabled
                    ? "Active on this device"
                    : "Off — tap to enable"}
                </p>
              </div>

              {pushState === "denied" ? (
                <span className="text-xs text-orange-400 font-medium px-2 py-1 rounded-lg"
                  style={{ background: "rgba(251,146,60,0.1)" }}>Blocked</span>
              ) : (
                <div className="flex items-center gap-2">
                  {pushLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                  <Toggle
                    enabled={pushEnabled}
                    disabled={pushLoading}
                    onToggle={pushEnabled ? handleDisablePush : handleEnablePush}
                  />
                </div>
              )}
            </div>

            {/* Subscribed state extras */}
            <AnimatePresence>
              {pushEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Test Notification</p>
                      <p className="text-xs mt-0.5 text-muted-foreground">Send one right now to check it works</p>
                    </div>
                    <ActionButton
                      state={testPushState}
                      idleLabel="Send test"
                      loadingLabel="Sending…"
                      okLabel="Sent!"
                      errLabel="Failed"
                      onClick={handleTestPush}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Denied help */}
            <AnimatePresence>
              {pushState === "denied" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  To re-enable: click the 🔒 icon in your browser address bar → Notifications → Allow
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </SectionCard>

      {/* ── Email Notifications ── */}
      <SectionCard title="Email Notifications" icon={<Bell size={15} />}>
        {prefsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : prefs ? (
          <div className="space-y-5">
            {/* To address */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
              style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <Mail size={14} style={{ color: "hsl(var(--primary))" }} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground/70">Emails sent to:</p>
                <p className="text-sm font-semibold text-foreground truncate">{emailToNotify}</p>
              </div>
            </div>

            {/* Daily reminder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Daily Diary Reminder</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">Email + push at your chosen time each day</p>
                </div>
                <Toggle
                  enabled={prefs.reminderEnabled}
                  onToggle={() => handleUpdatePrefs({ reminderEnabled: !prefs.reminderEnabled })}
                  testId="toggle-reminder"
                />
              </div>

              <AnimatePresence>
                {prefs.reminderEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                      <label className="text-xs text-muted-foreground">Remind me at:</label>
                      <input
                        type="time"
                        value={prefs.reminderTime || "20:00"}
                        onChange={(e) => handleUpdatePrefs({ reminderTime: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border text-sm outline-none text-foreground"
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

            <div className="h-px" style={{ background: "hsl(var(--border))" }} />

            {/* Inactivity alert */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">3-Day Inactivity Alert</p>
                <p className="text-xs mt-0.5 text-muted-foreground">Email + push if you haven't logged in for 3 days</p>
              </div>
              <Toggle
                enabled={prefs.inactivityAlertEnabled}
                onToggle={() => handleUpdatePrefs({ inactivityAlertEnabled: !prefs.inactivityAlertEnabled })}
                testId="toggle-inactivity"
              />
            </div>

            <div className="h-px" style={{ background: "hsl(var(--border))" }} />

            {/* Test email */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Test Email</p>
                <p className="text-xs mt-0.5 text-muted-foreground">Verify your email reminders are working</p>
              </div>
              <ActionButton
                state={testEmailState}
                idleLabel="Send test"
                loadingLabel="Sending…"
                okLabel="Sent!"
                errLabel="Failed"
                onClick={handleTestEmail}
              />
            </div>
          </div>
        ) : null}
      </SectionCard>

      {/* ── Export ── */}
      <SectionCard title="Export Your Diary" icon={<FileDown size={15} />}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Download a beautifully formatted PDF of your entire diary — every entry with its mood, summary, triggers, and your mood analytics charts.
          </p>

          {/* Preview of what's included */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "📅", label: "Day & Date", sub: "Each entry with day of week" },
              { icon: "💜", label: "Mood & Score", sub: "Color-coded mood for each day" },
              { icon: "📝", label: "Summary", sub: "AI-generated daily summary" },
              { icon: "⚡", label: "Triggers", sub: "Key emotional triggers" },
              { icon: "📈", label: "Line Chart", sub: "Mood timeline over time" },
              { icon: "🥧", label: "Pie Chart", sub: "Emotion pattern breakdown" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.12)" }}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats & download button */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-medium text-foreground">Download PDF Report</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                {allEntries.length > 0
                  ? `${allEntries.length} entr${allEntries.length === 1 ? "y" : "ies"} ready to export`
                  : "No entries yet — start recording to export"}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportPdf}
              disabled={pdfState === "loading" || allEntries.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
              style={{
                background: pdfState === "ok"
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : pdfState === "err"
                  ? "linear-gradient(135deg,#ef4444,#dc2626)"
                  : "linear-gradient(135deg,hsl(var(--primary)),#a855f7)",
                color: "#fff",
              }}
            >
              {pdfState === "loading" && <Loader2 size={14} className="animate-spin" />}
              {pdfState === "ok"      && <CheckCircle2 size={14} />}
              {pdfState === "err"     && <AlertCircle size={14} />}
              {pdfState === "idle"    && <FileDown size={14} />}
              {pdfState === "loading" ? "Generating…"
                : pdfState === "ok"  ? "Downloaded!"
                : pdfState === "err" ? "Failed"
                : "Download PDF"}
            </motion.button>
          </div>
        </div>
      </SectionCard>

      {/* ── App Lock ── */}
      <SectionCard title="App Lock" icon={<Lock size={15} />}>
        <AppLockSettings
          status={pinStatus}
          onStatusChange={() => {
            refetchPin();
            sessionStorage.removeItem(`ai_diary_unlocked_${user?.email || ""}`);
          }}
        />
      </SectionCard>

      {/* ── Privacy ── */}
      <SectionCard title="Privacy" icon={<Shield size={15} />}>
        <p className="text-sm text-muted-foreground">
          Your diary entries are private and isolated to your account. No data is shared with third parties. AI analysis is processed securely via Groq. Notifications are sent only to your verified account email and registered devices.
        </p>
      </SectionCard>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">AI Diary v1.0</p>
        <p className="text-xs mt-1 text-muted-foreground">Built with care for your emotional wellbeing</p>
      </div>
    </div>
  );
}
