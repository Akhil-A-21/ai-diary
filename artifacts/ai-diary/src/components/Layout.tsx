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
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/30">
      <WellbeingAlert />
      <SosPanel open={sosOpen} onClose={() => setSosOpen(false)} />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col glass-panel border-r border-white/5 z-50 relative flex-shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-base leading-none">AI Diary</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">AI Video Diary</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="outline-none">
                <div className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 relative group",
                  isActive ? "text-white font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300 flex-shrink-0",
                    isActive ? "scale-110 text-primary" : "group-hover:scale-110"
                  )} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}

          <div className="px-4 py-2 mt-2">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Wellness</p>
          </div>

          {WELLNESS_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="outline-none">
                <div className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 relative group",
                  isActive ? "text-white font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300 flex-shrink-0",
                    isActive ? "scale-110 text-primary" : "group-hover:scale-110"
                  )} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-white/5">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
              <img
                src={user.picture}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-white/20 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
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
        className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl shadow-2xl shadow-rose-900/40 border border-rose-500/30 bg-rose-500/15 backdrop-blur-md hover:bg-rose-500/25 transition-colors"
        title="Safe Space & Crisis Support"
      >
        <HandHeart className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-rose-300">Safe Space</span>
      </motion.button>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/5 z-50">
        <div className="flex items-center justify-around p-2">
          {MOBILE_NAV.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="outline-none flex-1">
                <div className="flex flex-col items-center gap-1 p-2 cursor-pointer">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
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
