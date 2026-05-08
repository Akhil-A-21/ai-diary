import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useYearInPixels } from "../hooks/useApi";
import { getMoodColor } from "../lib/utils";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Pixels() {
  const [, setLocation] = useLocation();
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: pixels = {} } = useYearInPixels(year);

  // Build full year grid
  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeapYear ? 366 : 365;

  const today = new Date().toISOString().split("T")[0];

  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = new Array(startDayOfWeek).fill(null);

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, d + 1);
    const dateStr = date.toISOString().split("T")[0];
    week.push(dateStr);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>Year in Pixels</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Every day, coloured by your mood</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
            <ChevronLeft size={15} />
          </button>
          <span className="font-semibold text-sm w-12 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Month Labels */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month header */}
          <div className="flex mb-2 pl-8">
            {MONTHS_SHORT.map((m, i) => {
              const monthStart = new Date(year, i, 1);
              const dayOfYear = Math.floor((monthStart.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
              const weekCol = Math.floor((dayOfYear + startDayOfWeek - 1) / 7);
              return (
                <div key={m} className="text-xs" style={{ color: "hsl(var(--muted-foreground))", width: `${weekCol === 0 ? 0 : 14}px`, minWidth: "28px" }}>
                  {m}
                </div>
              );
            })}
          </div>

          {/* Day labels + grid */}
          <div className="flex gap-1">
            {/* Day of week */}
            <div className="flex flex-col gap-1 mr-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="w-6 h-3.5 flex items-center justify-end text-xs pr-1" style={{ color: "hsl(var(--muted-foreground))", fontSize: "9px" }}>
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Pixel Grid */}
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((dateStr, di) => {
                    if (!dateStr) return <div key={di} className="w-3.5 h-3.5" />;
                    const pixel = pixels[dateStr];
                    const isFuture = dateStr > today;
                    const isToday = dateStr === today;

                    return (
                      <motion.button
                        key={dateStr}
                        whileHover={{ scale: 1.3 }}
                        onClick={() => pixel && setLocation(`/entry/${pixel.id}`)}
                        className="w-3.5 h-3.5 rounded-sm transition-all"
                        style={{
                          background: pixel
                            ? getMoodColor(pixel.mood)
                            : isFuture
                            ? "transparent"
                            : "hsl(var(--muted))",
                          border: isToday ? "2px solid hsl(var(--primary))" : pixel ? "none" : "1px solid hsl(var(--border))",
                          cursor: pixel ? "pointer" : "default",
                          opacity: isFuture ? 0.15 : 1,
                        }}
                        title={pixel ? `${dateStr}: ${pixel.mood} — ${pixel.title}` : dateStr}
                        data-testid={`pixel-${dateStr}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {["happy", "calm", "energized", "reflective", "sad", "anxious"].map((mood) => (
          <div key={mood} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: getMoodColor(mood) }} />
            <span className="capitalize">{mood}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-sm border" style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }} />
          <span>No entry</span>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-2xl p-4 border" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
        <p className="text-sm font-medium mb-1">
          {Object.keys(pixels).length} days recorded in {year}
        </p>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Click any coloured pixel to view that entry
        </p>
      </div>
    </div>
  );
}
