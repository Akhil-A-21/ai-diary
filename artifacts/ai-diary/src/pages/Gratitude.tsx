import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useGratitude, useSaveGratitude } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";
import { formatDate } from "../lib/utils";

export default function Gratitude() {
  const { data: entries = [] } = useGratitude();
  const saveGratitude = useSaveGratitude();
  const [dateOffset, setDateOffset] = useState(0);
  const [items, setItems] = useState({ item1: "", item2: "", item3: "" });

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - dateOffset);
  const dateStr = targetDate.toISOString().split("T")[0];

  const existingEntry = entries.find((e) => e.date === dateStr);

  const handleSave = async () => {
    if (!items.item1.trim() || !items.item2.trim() || !items.item3.trim()) {
      toast({ title: "Please fill all 3 gratitude items", variant: "destructive" });
      return;
    }
    try {
      await saveGratitude.mutateAsync({ ...items, date: dateStr });
      toast({ title: "Gratitude saved! 💛" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const currentItems = existingEntry
    ? { item1: existingEntry.item1 || "", item2: existingEntry.item2 || "", item3: existingEntry.item3 || "" }
    : items;

  const streak = (() => {
    let s = 0;
    const today = new Date();
    const dateSet = new Set(entries.map((e) => e.date));
    let check = new Date(today);
    while (dateSet.has(check.toISOString().split("T")[0])) {
      s++;
      check.setDate(check.getDate() - 1);
    }
    return s;
  })();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Gratitude Journal</h1>
          <p className="text-sm mt-1 text-muted-foreground">Three things you're grateful for today</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "hsl(var(--secondary))" }}>
            <Heart size={13} style={{ color: "hsl(var(--accent))" }} />
            <span className="text-sm font-medium">{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between glass rounded-xl p-3">
        <button onClick={() => setDateOffset(d => d + 1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="button-prev-day">
          <ChevronLeft size={17} />
        </button>
        <div className="text-center">
          <p className="font-medium text-sm">{formatDate(dateStr)}</p>
          {dateOffset === 0 && <p className="text-xs" style={{ color: "hsl(var(--primary))" }}>Today</p>}
        </div>
        <button onClick={() => setDateOffset(d => Math.max(0, d - 1))} disabled={dateOffset === 0} className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30" data-testid="button-next-day">
          <ChevronRight size={17} />
        </button>
      </div>

      {/* Gratitude Form */}
      <div className="space-y-4">
        {[1, 2, 3].map((num) => {
          const key = `item${num}` as "item1" | "item2" | "item3";
          return (
            <motion.div
              key={num}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: num * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "hsl(var(--accent))" }}
                >
                  {num}
                </div>
                <span className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                  I'm grateful for...
                </span>
              </div>
              {existingEntry ? (
                <p className="text-sm pl-10">{currentItems[key] || "—"}</p>
              ) : (
                <textarea
                  value={items[key]}
                  onChange={(e) => setItems({ ...items, [key]: e.target.value })}
                  placeholder={`What are you grateful for? (#${num})`}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  data-testid={`input-gratitude-${num}`}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {!existingEntry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saveGratitude.isPending}
          className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
          style={{ background: "hsl(var(--accent))" }}
          data-testid="button-save-gratitude"
        >
          <Save size={16} />
          {saveGratitude.isPending ? "Saving..." : "Save Gratitude"}
        </motion.button>
      )}

      {existingEntry && (
        <div className="text-center py-2">
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            ✓ Gratitude saved for this day
          </p>
        </div>
      )}

      {/* Past Entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Past Entries</h2>
          {entries.slice(0, 7).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(entry.date)}</p>
              <ul className="space-y-1">
                {[entry.item1, entry.item2, entry.item3].filter(Boolean).map((item, j) => (
                  <li key={j} className="text-sm flex items-start gap-2">
                    <Heart size={12} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--accent))" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
