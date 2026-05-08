import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Home, Video, CalendarDays, BarChart2, Settings, Sparkles,
  LogOut, MessageCircleHeart, Target, Heart, Calendar, Search,
  HandHeart, Grid3x3
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { WellbeingAlert } from "./wellbeing-alert";
import { SosPanel } from "./sos-panel";

const NAV_ITEMS = [
  { href: "/",          label: "Home",           icon: Home },
  { href: "/record",    label: "Record",          icon: Video },
  { href: "/timeline",  label: "Timeline",        icon: CalendarDays },
  { href: "/search",    label: "Search",          icon: Search },
  { href: "/chat",      label: "Chat Assistant",  icon: MessageCircleHeart },
  { href: "/analytics", label: "Analytics",       icon: BarChart2 },
];

const WELLNESS_ITEMS = [
  { href: "/calendar",  label: "Mood Calendar",   icon: Calendar },
  { href: "/pixels",    label: "Year in Pixels",  icon: Grid3x3 },
  { href: "/goals",     label: "Goals",           icon: Target },
  { href: "/gratitude", label: "Gratitude",       icon: Heart },
  { href: "/habits",    label: "Habits",          icon: Sparkles },
  { href: "/settings",  label: "Settings",        icon: Settings },
];

const MOBILE_NAV = NAV_ITEMS.slice(0, 6);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sosOpen, setSosOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/30 relative">

      {/* ── Global Glass Background Orbs ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Top-left orb — primary */}
        <div
          className="orb w-[800px] h-[800px] -top-72 -left-72"
          style={{ background: "radial-gradient(circle, hsl(var(--orb-a) / 0.50), transparent 65%)" }}
        />
        {/* Bottom-right orb — accent */}
        <div
          className="orb w-[700px] h-[700px] -bottom-56 -right-56"
          style={{
            background: "radial-gradient(circle, hsl(var(--orb-b) / 0.42), transparent 65%)",
            animationDelay: "-6s",
            animationDuration: "22s",
          }}
        />
        {/* Center orb — tertiary */}
        <div
          className="orb w-[550px] h-[550px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, hsl(var(--orb-c) / 0.28), transparent 65%)",
            animationDelay: "-12s",
            animationDuration: "26s",
          }}
        />
        {/* Bottom-left accent */}
        <div
          className="orb w-[420px] h-[420px] bottom-1/4 left-1/4"
          style={{
            background: "radial-gradient(circle, hsl(var(--orb-d) / 0.32), transparent 65%)",
            animationDelay: "-4s",
            animationDuration: "20s",
          }}
        />
      </div>

      <WellbeingAlert />
      <SosPanel open={sosOpen} onClose={() => setSosOpen(false)} />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col glass-panel border-r border-border z-50 relative flex-shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            >
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground text-base leading-none">AI Diary</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">AI Video Diary</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="outline-none">
                <div className={cn(
                  "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 relative group",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 rounded-2xl -z-10"
                      style={{
                        background: "hsl(var(--primary) / 0.12)",
                        border: "1px solid hsl(var(--primary) / 0.22)",
                        backdropFilter: "blur(12px)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: "hsl(var(--muted) / 0.6)", backdropFilter: "blur(8px)" }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-4.5 h-4.5 transition-all duration-300 flex-shrink-0",
                    isActive ? "text-primary scale-110" : "group-hover:scale-110"
                  )} style={{ width: "1.1rem", height: "1.1rem" }} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}

          <div className="px-4 py-2 mt-3">
            <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em]">Wellness</p>
          </div>

          {WELLNESS_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="outline-none">
                <div className={cn(
                  "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 relative group",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 rounded-2xl -z-10"
                      style={{
                        background: "hsl(var(--primary) / 0.12)",
                        border: "1px solid hsl(var(--primary) / 0.22)",
                        backdropFilter: "blur(12px)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: "hsl(var(--muted) / 0.6)", backdropFilter: "blur(8px)" }}
                    />
                  )}
                  <item.icon className={cn(
                    "transition-all duration-300 flex-shrink-0",
                    isActive ? "text-primary scale-110" : "group-hover:scale-110"
                  )} style={{ width: "1.1rem", height: "1.1rem" }} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-border/60">
          {user && (
            <div
              className="flex items-center gap-3 p-3 rounded-2xl transition-colors"
              style={{
                background: "hsl(var(--muted) / 0.45)",
                backdropFilter: "blur(12px)",
                border: "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden relative">
        <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* ── Floating Safe Space Button ── */}
      <motion.button
        onClick={() => setSosOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl shadow-2xl shadow-rose-900/30 border border-rose-500/25 hover:border-rose-500/40 transition-colors"
        style={{
          background: "hsl(0 80% 55% / 0.12)",
          backdropFilter: "blur(20px)",
        }}
        title="Safe Space & Crisis Support"
      >
        <HandHeart className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-rose-400">Safe Space</span>
      </motion.button>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/60 z-50"
        style={{ backdropFilter: "blur(40px) saturate(180%)", background: "hsl(var(--background) / 0.7)" }}
      >
        <div className="flex items-center justify-around p-2">
          {MOBILE_NAV.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="outline-none flex-1">
                <div className="flex flex-col items-center gap-1 p-2 cursor-pointer">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label.split(" ")[0]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
