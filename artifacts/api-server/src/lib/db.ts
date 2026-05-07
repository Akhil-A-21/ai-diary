import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  pgTable, serial, text, integer, boolean, timestamp, real, uniqueIndex
} from "drizzle-orm/pg-core";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Schema definitions inline to avoid workspace resolution issues
export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  transcript: text("transcript"),
  summary: text("summary"),
  mood: text("mood"),
  moodScore: real("mood_score"),
  energyLevel: integer("energy_level"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  entryDate: text("entry_date").notNull(),
  tags: text("tags").array(),
  triggers: text("triggers").array(),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pinSettings = pgTable("pin_settings", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().unique(),
  pinHash: text("pin_hash"),
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: text("target_date"),
  status: text("status").default("active"),
  progress: integer("progress").default(0),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalMilestones = pgTable("goal_milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  order: integer("order").default(0),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gratitudeEntries = pgTable(
  "gratitude_entries",
  {
    id: serial("id").primaryKey(),
    item1: text("item1"),
    item2: text("item2"),
    item3: text("item3"),
    date: text("date").notNull(),
    userEmail: text("user_email").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userDateUnique: uniqueIndex("gratitude_user_date_unique").on(table.userEmail, table.date),
  })
);

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().unique(),
  reminderTime: text("reminder_time").default("20:00"),
  reminderEnabled: boolean("reminder_enabled").default(true),
  inactivityAlertEnabled: boolean("inactivity_alert_enabled").default(true),
  friendEmail: text("friend_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").default("✅"),
  frequency: text("frequency").default("daily"),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  date: text("date").notNull(),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodTrends = pgTable("mood_trends", {
  id: serial("id").primaryKey(),
  source: text("source").default("diary"),
  mood: text("mood"),
  moodScore: real("mood_score"),
  date: text("date").notNull(),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: text("keys").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const db = drizzle(pool, {
  schema: {
    diaryEntries, pinSettings, goals, goalMilestones,
    gratitudeEntries, userPreferences, habits, habitCompletions,
    moodTrends, pushSubscriptions,
  },
});
