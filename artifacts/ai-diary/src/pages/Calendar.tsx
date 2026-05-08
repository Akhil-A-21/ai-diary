import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDiaryEntries } from "../hooks/useApi";
import { getMoodColor, getMoodEmoji } from "../lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Calendar() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const { data: entries = [] } = useDiaryEntries();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const entryMap: Record<string, typeof entries[0]> = {};
  for (const e of entries) {
    entryMap[e.entryDate] = e;
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold text-white">Mood Calendar</h1>
        <p className="text-sm mt-1 text-muted-foreground">Each day coloured by your mood</p>
      </div>

      <div className="glass rounded-2xl p-5">
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors" data-testid="button-prev-month">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-lg">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors" data-testid="button-next-month">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const entry = entryMap[dateStr];
            const isToday = dateStr === today.toISOString().split("T")[0];
            const moodColor = entry ? getMoodColor(entry.mood) : null;

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => entry && setLocation(`/entry/${entry.id}`)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all relative"
                style={{
                  background: moodColor ? moodColor + "25" : isToday ? "hsl(var(--secondary))" : "hsl(var(--muted))",
                  border: isToday ? "2px solid hsl(var(--primary))" : moodColor ? `2px solid ${moodColor}50` : "2px solid transparent",
                  cursor: entry ? "pointer" : "default",
                }}
                title={entry ? `${entry.title} — ${entry.mood}` : undefined}
                data-testid={`day-${dateStr}`}
              >
                <span>{day}</span>
                {entry && <span className="text-base leading-none">{getMoodEmoji(entry.mood)}</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          {["happy", "calm", "reflective", "sad", "anxious", "energized"].map((mood) => (
            <div key={mood} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-sm" style={{ background: getMoodColor(mood) }} />
              <span className="capitalize">{mood}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
