import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Shield, User, Sun, Moon, Save } from "lucide-react";
import { usePreferences, useUpdatePreferences } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";

export default function Settings() {
  const { data: prefs } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "demo@aivideodiary.app");

  const handleSaveEmail = () => {
    localStorage.setItem("userEmail", userEmail);
    toast({ title: "Email saved — refresh to apply" });
  };

  const handleThemeToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleUpdatePrefs = async (updates: Record<string, unknown>) => {
    if (!prefs) return;
    try {
      await updatePrefs.mutateAsync({ ...updates } as Parameters<typeof updatePrefs.mutateAsync>[0]);
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: "hsl(var(--primary))" }}>{icon}</span>
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-1 text-muted-foreground">Personalise your Aura experience</p>
      </div>

      {/* User Identity */}
      <SectionCard title="Your Identity" icon={<User size={15} />}>
        <label className="text-sm font-medium mb-1.5 block">Your Email</label>
        <p className="text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          Used to isolate your diary data. No account needed.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="input-email"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveEmail}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-1.5"
            style={{ background: "hsl(var(--primary))" }}
            data-testid="button-save-email"
          >
            <Save size={13} />
            Save
          </motion.button>
        </div>
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Appearance" icon={<Sun size={15} />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Switch between light and dark theme</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleThemeToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: "hsl(var(--border))" }}
            data-testid="button-toggle-theme"
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            {theme === "light" ? "Dark" : "Light"}
          </motion.button>
        </div>
      </SectionCard>

      {/* Notifications */}
      {prefs && (
        <SectionCard title="Reminders" icon={<Bell size={15} />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Reminder</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Get reminded to record your diary</p>
              </div>
              <button
                onClick={() => handleUpdatePrefs({ reminderEnabled: !prefs.reminderEnabled })}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: prefs.reminderEnabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                data-testid="toggle-reminder"
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: prefs.reminderEnabled ? "calc(100% - 22px)" : "2px" }}
                />
              </button>
            </div>

            {prefs.reminderEnabled && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Reminder Time</label>
                <input
                  type="time"
                  value={prefs.reminderTime}
                  onChange={(e) => handleUpdatePrefs({ reminderTime: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  data-testid="input-reminder-time"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Inactivity Alerts</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Alert when you haven't recorded in 2+ days</p>
              </div>
              <button
                onClick={() => handleUpdatePrefs({ inactivityAlertEnabled: !prefs.inactivityAlertEnabled })}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: prefs.inactivityAlertEnabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                data-testid="toggle-inactivity"
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: prefs.inactivityAlertEnabled ? "calc(100% - 22px)" : "2px" }}
                />
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Privacy */}
      <SectionCard title="Privacy" icon={<Shield size={15} />}>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Your diary entries are private and isolated to your email address. No data is shared with third parties. AI analysis is processed securely via OpenAI.
        </p>
      </SectionCard>

      {/* About */}
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>AI Video Diary — Aura v1.0</p>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Built with care for your emotional wellbeing</p>
      </div>
    </div>
  );
}
