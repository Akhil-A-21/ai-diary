import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Target, CheckCircle2, Circle, Trash2, Sparkles,
  ChevronDown, ChevronUp, Calendar, RefreshCw, Loader2
} from "lucide-react";
import {
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useGoalMilestones, useGenerateMilestones, useUpdateMilestone
} from "../hooks/useApi";
import type { Goal } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";
import { formatDate } from "../lib/utils";

function GoalCard({ goal, autoExpand = false }: { goal: Goal; autoExpand?: boolean }) {
  const [expanded, setExpanded] = useState(autoExpand);
  const { data: milestones = [], isLoading: milestonesLoading } = useGoalMilestones(goal.id);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const generateMilestones = useGenerateMilestones();
  const updateMilestone = useUpdateMilestone();

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : goal.progress || 0;
  const nextMilestone = milestones.find((m) => !m.completed);

  const statusColors: Record<string, string> = {
    active: "hsl(var(--primary))",
    completed: "#22c55e",
    abandoned: "#94a3b8",
  };

  const color = statusColors[goal.status] || "hsl(var(--primary))";

  const handleDelete = async () => {
    if (!confirm("Delete this goal and all its milestones?")) return;
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast({ title: "Goal deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleComplete = async () => {
    try {
      await updateGoal.mutateAsync({ id: goal.id, status: goal.status === "completed" ? "active" : "completed" });
      toast({ title: goal.status === "completed" ? "Goal reactivated" : "Goal completed! 🎉" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerate milestones? This will replace existing ones.")) return;
    // Delete existing then regenerate
    try {
      await generateMilestones.mutateAsync(goal.id);
      toast({ title: "Milestones regenerated!" });
    } catch { toast({ title: "Failed to regenerate", variant: "destructive" }); }
  };

  const handleToggleMilestone = async (milestoneId: number, completed: boolean) => {
    try {
      await updateMilestone.mutateAsync({ goalId: goal.id, id: milestoneId, completed: !completed });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Progress strip at the top */}
      <div className="h-1 w-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Title row */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <button
                onClick={handleComplete}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: color,
                  background: goal.status === "completed" ? color : "transparent",
                }}
              >
                {goal.status === "completed" && <CheckCircle2 size={11} className="text-foreground" />}
              </button>
              <h3
                className={`font-semibold text-sm flex-1 ${goal.status === "completed" ? "line-through" : "text-foreground"}`}
                style={{ color: goal.status === "completed" ? "hsl(var(--muted-foreground))" : undefined }}
              >
                {goal.title}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                style={{ background: color + "20", color }}
              >
                {goal.status}
              </span>
            </div>

            {goal.description && (
              <p className="text-xs mb-2 ml-7 text-muted-foreground">{goal.description}</p>
            )}

            {goal.targetDate && (
              <div className="flex items-center gap-1.5 text-xs ml-7 mb-2 text-muted-foreground">
                <Calendar size={10} />
                Target: {formatDate(goal.targetDate)}
              </div>
            )}

            {/* Progress info */}
            <div className="ml-7 flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {milestones.length} milestones done</span>
              <span className="font-semibold" style={{ color }}>{progress}%</span>
            </div>

            {/* Next milestone preview (collapsed state) */}
            {!expanded && nextMilestone && (
              <div className="ml-7 mt-2 text-xs text-muted-foreground">
                Next: <span className="text-foreground/70">{nextMilestone.title}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Expanded milestones */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border ml-7 space-y-1.5">
                {milestonesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <Loader2 size={13} className="animate-spin" />
                    Loading milestones…
                  </div>
                ) : milestones.length === 0 ? (
                  <div className="flex items-center gap-2 py-1">
                    <button
                      onClick={() => generateMilestones.mutateAsync(goal.id).then(() => toast({ title: "Milestones generated!" }))}
                      disabled={generateMilestones.isPending}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg text-foreground disabled:opacity-60"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      {generateMilestones.isPending
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Sparkles size={12} />}
                      Generate AI Milestones
                    </button>
                  </div>
                ) : (
                  <>
                    {milestones.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-2.5 cursor-pointer group"
                        onClick={() => handleToggleMilestone(m.id, m.completed)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {m.completed ? (
                            <CheckCircle2 size={15} style={{ color }} />
                          ) : (
                            <Circle size={15} className="text-muted-foreground group-hover:text-foreground/60 transition-colors" />
                          )}
                        </div>
                        <span
                          className={`text-sm leading-snug transition-colors ${m.completed ? "line-through text-muted-foreground" : "text-foreground/80 group-hover:text-foreground"}`}
                        >
                          {m.title}
                        </span>
                      </motion.div>
                    ))}

                    {/* Regenerate button */}
                    <div className="pt-2">
                      <button
                        onClick={handleRegenerate}
                        disabled={generateMilestones.isPending}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/70 transition-colors disabled:opacity-50"
                      >
                        {generateMilestones.isPending
                          ? <Loader2 size={11} className="animate-spin" />
                          : <RefreshCw size={11} />}
                        Regenerate milestones
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetDate: "" });
  const [newlyCreatedId, setNewlyCreatedId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: "Please enter a goal title", variant: "destructive" });
      return;
    }
    try {
      const created = await createGoal.mutateAsync(form);
      setNewlyCreatedId(created.id);
      setForm({ title: "", description: "", targetDate: "" });
      setShowForm(false);
      toast({ title: "Goal created with AI milestones! 🎯" });
    } catch {
      toast({ title: "Failed to create goal", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">Goals</h1>
          <p className="text-sm mt-1 text-muted-foreground">Track your aspirations, step by step</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-foreground text-sm font-medium"
          style={{ background: "hsl(var(--primary))" }}
        >
          <Plus size={15} />
          New Goal
        </motion.button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
                <p className="text-sm font-semibold text-foreground">New Goal</p>
                <span className="text-xs text-muted-foreground ml-1">— AI will generate milestones automatically</span>
              </div>

              <input
                type="text"
                placeholder="What do you want to achieve?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none text-foreground"
                style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))" }}
                autoFocus
              />
              <textarea
                placeholder="Description (optional) — helps AI generate better milestones"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none text-foreground"
                style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))" }}
              />
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={createGoal.isPending || !form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  {createGoal.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating & generating milestones…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Create with AI Milestones
                    </>
                  )}
                </motion.button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border text-sm text-muted-foreground"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <Target size={28} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="font-semibold text-foreground">No goals yet</p>
          <p className="text-sm mt-1 text-muted-foreground">Create a goal and AI will instantly generate<br/>step-by-step milestones to help you achieve it</p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-foreground text-sm font-medium mx-auto"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Plus size={15} />
            Set your first goal
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              autoExpand={goal.id === newlyCreatedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
