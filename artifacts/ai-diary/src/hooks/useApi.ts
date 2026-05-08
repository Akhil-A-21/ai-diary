import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// Diary entries
export const useDiaryEntries = (search?: string) =>
  useQuery({
    queryKey: ["diary-entries", search],
    queryFn: () => apiFetch<DiaryEntry[]>(`/diary/entries${search ? `?search=${search}` : ""}`),
  });

export const useDiaryEntry = (id: number) =>
  useQuery({
    queryKey: ["diary-entry", id],
    queryFn: () => apiFetch<DiaryEntry>(`/diary/entries/${id}`),
    enabled: !!id,
  });

export const useCreateEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiaryEntry>) =>
      apiFetch<DiaryEntry>("/diary/entries", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diary-entries"] }),
  });
};

export const useDeleteEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/diary/entries/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diary-entries"] }),
  });
};

// AI diary features
export const useMoodTrends = () =>
  useQuery({ queryKey: ["mood-trends"], queryFn: () => apiFetch<MoodTrend[]>("/diary/mood-trends") });

export const useStreak = () =>
  useQuery({ queryKey: ["streak"], queryFn: () => apiFetch<{ streak: number; totalEntries: number }>("/diary/streak") });

export const useMotivationalQuote = () =>
  useQuery({ queryKey: ["motivational-quote"], queryFn: () => apiFetch<{ quote: string; mood: string }>("/diary/motivational-quote"), staleTime: 1000 * 60 * 60 });

export const useJournalPrompt = () =>
  useQuery({ queryKey: ["journal-prompt"], queryFn: () => apiFetch<{ prompt: string }>("/diary/journal-prompt"), staleTime: 1000 * 60 * 60 });

export const useMoodPrediction = () =>
  useQuery({ queryKey: ["mood-prediction"], queryFn: () => apiFetch<{ mood: string; score: number; reason: string }>("/diary/mood-prediction") });

export const useAffirmation = () =>
  useQuery({ queryKey: ["affirmation"], queryFn: () => apiFetch<{ affirmation: string }>("/diary/affirmation"), staleTime: 1000 * 60 * 60 });

export const useWeeklyReflection = () =>
  useQuery({ queryKey: ["weekly-reflection"], queryFn: () => apiFetch<WeeklyReflection>("/diary/weekly-reflection") });

export const useDailyDelight = () =>
  useQuery({ queryKey: ["daily-delight"], queryFn: () => apiFetch<{ funFact: string; challenge: string; emoji: string }>("/diary/daily-delight"), staleTime: 1000 * 60 * 60 });

export const useKindnessAct = () =>
  useQuery({ queryKey: ["kindness-act"], queryFn: () => apiFetch<{ act: string }>("/diary/kindness-act"), staleTime: 1000 * 60 * 60 });

export const useKindMessage = () =>
  useMutation({
    mutationFn: (data: { name: string; relationship: string; context: string }) =>
      apiFetch<{ message: string }>("/diary/kind-message", { method: "POST", body: JSON.stringify(data) }),
  });

export const useEmotionPatterns = () =>
  useQuery({ queryKey: ["emotion-patterns"], queryFn: () => apiFetch<{ patterns: { mood: string; count: number }[]; insight: string }>("/diary/emotion-patterns") });

export const useEmotionReasons = (mood: string | null) =>
  useQuery({
    queryKey: ["emotion-reasons", mood],
    queryFn: () => apiFetch<{ reasons: string[]; entries: { id: number; title: string; date: string }[] }>(`/diary/emotion-reasons/${mood}`),
    enabled: !!mood,
    staleTime: 1000 * 60 * 5,
  });

// Goals
export const useGoals = () =>
  useQuery({ queryKey: ["goals"], queryFn: () => apiFetch<Goal[]>("/goals") });

export const useLatestGoal = () =>
  useQuery({ queryKey: ["latest-goal"], queryFn: () => apiFetch<GoalWithMilestones | null>("/goals/latest-with-milestones") });

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => apiFetch<Goal>("/goals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); qc.invalidateQueries({ queryKey: ["latest-goal"] }); },
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Goal> & { id: number }) =>
      apiFetch<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); qc.invalidateQueries({ queryKey: ["latest-goal"] }); },
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); qc.invalidateQueries({ queryKey: ["latest-goal"] }); },
  });
};

export const useGoalMilestones = (goalId: number) =>
  useQuery({
    queryKey: ["milestones", goalId],
    queryFn: () => apiFetch<Milestone[]>(`/goals/${goalId}/milestones`),
    enabled: !!goalId,
  });

export const useGenerateMilestones = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: number) => apiFetch<Milestone[]>(`/goals/${goalId}/milestones/generate`, { method: "POST" }),
    onSuccess: (_d, goalId) => { qc.invalidateQueries({ queryKey: ["milestones", goalId] }); qc.invalidateQueries({ queryKey: ["latest-goal"] }); },
  });
};

export const useUpdateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, id, ...data }: { goalId: number; id: number; completed?: boolean; title?: string }) =>
      apiFetch<Milestone>(`/goals/${goalId}/milestones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_d, { goalId }) => { qc.invalidateQueries({ queryKey: ["milestones", goalId] }); qc.invalidateQueries({ queryKey: ["latest-goal"] }); },
  });
};

// Gratitude
export const useGratitude = () =>
  useQuery({ queryKey: ["gratitude"], queryFn: () => apiFetch<GratitudeEntry[]>("/gratitude") });

export const useSaveGratitude = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { item1: string; item2: string; item3: string; date?: string }) =>
      apiFetch<GratitudeEntry>("/gratitude", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gratitude"] }),
  });
};

// Habits
export const useHabits = () =>
  useQuery({ queryKey: ["habits"], queryFn: () => apiFetch<Habit[]>("/habits") });

export const useHabitCompletions = () =>
  useQuery({ queryKey: ["habit-completions"], queryFn: () => apiFetch<HabitCompletion[]>("/habits/completions") });

export const useCreateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; emoji: string; frequency: string }) =>
      apiFetch<Habit>("/habits", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
};

export const useDeleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["habits"] }); qc.invalidateQueries({ queryKey: ["habit-completions"] }); },
  });
};

export const useToggleHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) =>
      apiFetch<{ completed: boolean }>(`/habits/${id}/toggle`, { method: "POST", body: JSON.stringify({ date }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habit-completions"] }),
  });
};

// Preferences
export const usePreferences = () =>
  useQuery({ queryKey: ["preferences"], queryFn: () => apiFetch<UserPreferences>("/preferences") });

export const useUpdatePreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => apiFetch<UserPreferences>("/preferences", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences"] }),
  });
};

// Analytics
export const useResilienceScore = () =>
  useQuery({ queryKey: ["resilience"], queryFn: () => apiFetch<ResilienceData>("/analytics/resilience") });

export const useYearInPixels = (year?: number) =>
  useQuery({
    queryKey: ["year-pixels", year],
    queryFn: () => apiFetch<Record<string, { mood: string; title: string; id: number }>>(`/analytics/year-in-pixels${year ? `?year=${year}` : ""}`),
  });

export const useHabitStats = () =>
  useQuery({ queryKey: ["habit-stats"], queryFn: () => apiFetch<HabitStat[]>("/analytics/habit-stats") });

// Re-export getMoodColor for use in pages
export { getMoodColor } from "../lib/utils";

// Types
export interface DiaryEntry {
  id: number;
  title: string;
  transcript?: string;
  summary?: string;
  mood?: string;
  moodScore?: number;
  energyLevel?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  entryDate: string;
  tags?: string[];
  triggers?: string[];
  userEmail: string;
  createdAt: string;
}

export interface MoodTrend {
  id: number;
  source: string;
  mood?: string;
  moodScore?: number;
  date: string;
  createdAt: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  targetDate?: string;
  status: string;
  progress: number;
  userEmail: string;
  createdAt: string;
}

export interface Milestone {
  id: number;
  goalId: number;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];
}

export interface GratitudeEntry {
  id: number;
  item1?: string;
  item2?: string;
  item3?: string;
  date: string;
  userEmail: string;
  createdAt: string;
}

export interface Habit {
  id: number;
  name: string;
  emoji: string;
  frequency: string;
  userEmail: string;
  createdAt: string;
}

export interface HabitCompletion {
  id: number;
  habitId: number;
  date: string;
  userEmail: string;
}

export interface HabitStat extends Habit {
  streak: number;
  totalCompletions: number;
  lastCompleted: string | null;
}

export interface UserPreferences {
  id: number;
  userEmail: string;
  reminderTime: string;
  reminderEnabled: boolean;
  inactivityAlertEnabled: boolean;
  friendEmail?: string;
}

export interface ResilienceData {
  score: number;
  avgMoodScore: number;
  trend: string;
  dataPoints: number;
}

export interface WeeklyReflection {
  entryCount: number;
  dominantMood: string;
  avgScore: number;
  topTriggers: string[];
  narrative: string;
}
