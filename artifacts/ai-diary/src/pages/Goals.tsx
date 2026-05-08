import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Target, CheckCircle2, Circle, Trash2, Sparkles, ChevronDown, ChevronUp, Calendar
} from "lucide-react";
import {
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useGoalMilestones, useGenerateMilestones, useUpdateMilestone
} from "../hooks/useApi";
import type { Goal } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";
import { formatDate } from "../lib/utils";

function GoalCard({ goal }: { goal: Goal }) {
  const [expanded, setExpanded] = useState(false);
  const { data: milestones = [] } = useGoalMilestones(goal.id);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const generateMilestones = useGenerateMilestones();
  const updateMilestone = useUpdateMilestone();

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : goal.progress || 0;

  const handleDelete = async () => {
    if (!confirm("Delete this goal?")) return;
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

  const handleGenerateMilestones = async () => {
    try {
      await generateMilestones.mutateAsync(goal.id);
      toast({ title: "Milestones generated!" });
      setExpanded(true);
    } catch { toast({ title: "Failed to generate", variant: "destructive" }); }
  };

  const handleToggleMilestone = async (milestoneId: number, completed: boolean) => {
    try {
      await updateMilestone.mutateAsync({ goalId: goal.id, id: milestoneId, completed: !completed });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const statusColors: Record<string, string> = {
    active: "hsl(var(--primary))",
    completed: "#22c55e",
    abandoned: "#94a3b8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={handleComplete}>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{ borderColor: statusColors[goal.status] || "hsl(var(--border))", background: goal.status === "completed" ? statusColors[goal.status] : "transparent" }}>
                {goal.status === "completed" && <CheckCircle2 size={12} className="text-white" />}
              </div>
            </button>
            <h3 className={`font-semibold ${goal.status === "completed" ? "line-through" : ""}`} style={{ color: goal.status === "completed" ? "hsl(var(--muted-foreground))" : undefined }}>
              {goal.title}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize ml-auto" style={{ background: statusColors[goal.status] + "20", color: statusColors[goal.status] }}>
              {goal.status}
            </span>
          </div>
          {goal.description && <p className="text-sm mb-2 ml-7" style={{ color: "hsl(var(--muted-foreground))" }}>{goal.description}</p>}
          {goal.targetDate && (
            <div className="flex items-center gap-1.5 text-xs ml-7 mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              <Calendar size={11} />
              Target: {formatDate(goal.targetDate)}
            </div>
          )}

          {/* Progress bar */}
          <div className="ml-7">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span>{completedCount}/{milestones.length} milestones</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: statusColors[goal.status] }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t ml-7 space-y-2" style={{ borderColor: "hsl(var(--border))" }}>
              {milestones.length === 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateMilestones}
                    disabled={generateMilestones.isPending}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg text-white"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    {generateMilestones.isPending ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <Sparkles size={13} />}
                    Generate AI Milestones
                  </button>
                </div>
              ) : (
                <>
                  {milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => handleToggleMilestone(m.id, m.completed)}>
                      {m.completed ? (
                        <CheckCircle2 size={15} style={{ color: statusColors[goal.status] }} />
                      ) : (
                        <Circle size={15} style={{ color: "hsl(var(--muted-foreground))" }} />
                      )}
                      <span className={m.completed ? "line-through" : ""} style={{ color: m.completed ? "hsl(var(--muted-foreground))" : undefined }}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", targetDate: "" });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ title: "Please enter a title", variant: "destructive" }); return; }
    try {
      await createGoal.mutateAsync(form);
      setForm({ title: "", description: "", targetDate: "" });
      setShowForm(false);
      toast({ title: "Goal created!" });
    } catch { toast({ title: "Failed to create goal", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Goals</h1>
          <p className="text-sm mt-1 text-muted-foreground">Set and track your aspirations</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: "hsl(var(--primary))" }}
          data-testid="button-add-goal"
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
              <input
                type="text"
                placeholder="Goal title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                data-testid="input-goal-title"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={createGoal.isPending}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ background: "hsl(var(--primary))" }}>
                  {createGoal.isPending ? "Creating..." : "Create Goal"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "hsl(var(--border))" }}>
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
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <Target size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Set a goal and let AI generate milestones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
    </div>
  );
}
