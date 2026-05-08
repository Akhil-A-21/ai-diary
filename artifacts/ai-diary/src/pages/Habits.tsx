import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Flame, Activity } from "lucide-react";
import { useHabits, useHabitCompletions, useCreateHabit, useDeleteHabit, useToggleHabit, useHabitStats } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";

const EMOJI_OPTIONS = ["✅", "🏃", "💧", "📚", "🧘", "💪", "🥗", "😴", "🎨", "🎵", "🌿", "🦷"];

export default function Habits() {
  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useHabitCompletions();
  const { data: stats = [] } = useHabitStats();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const toggleHabit = useToggleHabit();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "✅", frequency: "daily" });

  const today = new Date().toISOString().split("T")[0];
  const todayCompletions = new Set(completions.filter((c) => c.date === today).map((c) => c.habitId));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: "Please enter a habit name", variant: "destructive" }); return; }
    try {
      await createHabit.mutateAsync(form);
      setForm({ name: "", emoji: "✅", frequency: "daily" });
      setShowForm(false);
      toast({ title: "Habit added!" });
    } catch { toast({ title: "Failed to add habit", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this habit?")) return;
    try { await deleteHabit.mutateAsync(id); toast({ title: "Habit deleted" }); }
    catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleToggle = async (id: number) => {
    try { await toggleHabit.mutateAsync({ id, date: today }); }
    catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">Habits</h1>
          <p className="text-sm mt-1 text-muted-foreground">Build consistency, one day at a time</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground text-sm font-medium"
          style={{ background: "hsl(var(--primary))" }}
          data-testid="button-add-habit"
        >
          <Plus size={15} />
          Add Habit
        </motion.button>
      </div>

      {/* Add Habit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex gap-3">
                <select
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="px-3 py-2.5 rounded-xl border text-lg outline-none"
                  style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))" }}
                >
                  {EMOJI_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Habit name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  data-testid="input-habit-name"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={createHabit.isPending}
                  className="flex-1 py-2.5 rounded-xl text-foreground text-sm font-medium"
                  style={{ background: "hsl(var(--primary))" }}>
                  {createHabit.isPending ? "Adding..." : "Add Habit"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: "hsl(var(--border))" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Check-ins */}
      {habits.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} style={{ color: "hsl(var(--primary))" }} />
            <h2 className="font-semibold text-sm">Today's Check-in</h2>
            <span className="ml-auto text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {todayCompletions.size}/{habits.length} done
            </span>
          </div>
          <div className="space-y-2">
            {habits.map((habit) => {
              const done = todayCompletions.has(habit.id);
              return (
                <motion.button
                  key={habit.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToggle(habit.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                  style={{
                    background: done ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                    border: done ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                  }}
                  data-testid={`button-toggle-habit-${habit.id}`}
                >
                  {done ? (
                    <CheckCircle2 size={20} style={{ color: "hsl(var(--primary))" }} />
                  ) : (
                    <Circle size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
                  )}
                  <span className="text-lg">{habit.emoji}</span>
                  <span className={`text-sm font-medium ${done ? "line-through" : ""}`}
                    style={{ color: done ? "hsl(var(--muted-foreground))" : undefined }}>
                    {habit.name}
                  </span>
                  {done && <span className="ml-auto text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>Done!</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Habit Stats */}
      {stats.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Streaks & Stats</h2>
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{stat.emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{stat.name}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{stat.totalCompletions} total completions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {stat.streak > 0 && (
                    <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "#f97316" }}>
                      <Flame size={14} />
                      {stat.streak}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(stat.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    data-testid={`button-delete-habit-${stat.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Last 7 days */}
              <div className="flex gap-1 mt-3">
                {last7Days.map((date) => {
                  const completed = completions.some((c) => c.habitId === stat.id && c.date === date);
                  return (
                    <div
                      key={date}
                      className="flex-1 h-2 rounded-full"
                      style={{ background: completed ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                      title={date}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>7 days ago</span>
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Today</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {habits.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <p className="font-medium">No habits yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Add your first habit to start building consistency</p>
        </div>
      )}
    </div>
  );
}
