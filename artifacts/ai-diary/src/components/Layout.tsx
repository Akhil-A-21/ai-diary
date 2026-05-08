import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Video, List, BarChart2, Calendar, Target,
  Heart, Grid, Activity, MessageCircle, Settings,
  Menu, X, Sparkles, LogOut, ChevronDown
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/record", icon: Video, label: "Record" },
  { href: "/timeline", icon: List, label: "Timeline" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/gratitude", icon: Heart, label: "Gratitude" },
  { href: "/pixels", icon: Grid, label: "Year in Pixels" },
  { href: "/habits", icon: Activity, label: "Habits" },
  { href: "/chat", icon: MessageCircle, label: "Chat Assistant" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface LayoutProps {
  children: React.ReactNode;
}

function UserCard({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
      >
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate">{user.name}</p>
          <p className="text-[10px] truncate" style={{ color: "hsl(240 8% 50%)" }}>{user.email}</p>
        </div>
        <ChevronDown size={13} className={cn("flex-shrink-0 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border overflow-hidden"
            style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 22%)" }}
          >
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors"
              style={{ color: "hsl(0 72% 65%)" }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full sidebar-bg flex-shrink-0">
        <div className="p-6 border-b" style={{ borderColor: "hsl(var(--sidebar-accent))" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm tracking-wide">AI Video Diary</h1>
              <p className="text-xs sidebar-muted-text">Your daily companion</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
                    active
                      ? "sidebar-accent-bg text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <item.icon
                    size={17}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      active ? "text-white" : "text-slate-500 group-hover:text-white"
                    )}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User profile at bottom */}
        <div className="p-3 border-t" style={{ borderColor: "hsl(var(--sidebar-accent))" }}>
          <UserCard onLogout={logout} />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 sidebar-bg px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--sidebar-accent))" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">AI Video Diary</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
          data-testid="mobile-menu-toggle"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-40 w-64 sidebar-bg pt-14 overflow-y-auto flex flex-col"
            >
              <nav className="flex-1 p-3 space-y-0.5">
                {navItems.map((item) => {
                  const active = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                          active ? "sidebar-accent-bg text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon size={17} className={active ? "text-white" : "text-slate-500"} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t" style={{ borderColor: "hsl(var(--sidebar-accent))" }}>
                <UserCard onLogout={() => { setMobileOpen(false); logout(); }} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
