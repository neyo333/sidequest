import { pgTable, text, serial, boolean, timestamp, integer, date, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === AUTH TABLES ===

export const users = pgTable("users", {
  id: text("id").primaryKey(), // UUID
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  username: text("username").notNull(),
  tag: text("tag").notNull(), // 4-digit random tag
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === QUEST TABLES ===

export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyQuests = pgTable("daily_quests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questId: integer("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // YYYY-MM-DD
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  refreshTime: text("refresh_time").default("04:00").notNull(),
  notificationEnabled: boolean("notification_enabled").default(true).notNull(),
  notificationTime: text("notification_time").default("08:00").notNull(),
  notificationText: text("notification_text").default("Time to conquer your daily quests!").notNull(),
  theme: text("theme").default("light").notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  enabledDefaultQuests: jsonb("enabled_default_quests").$type<string[]>().default([]).notNull(), // Array of default quest IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementType: text("achievement_type").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalQuestsCompleted: integer("total_quests_completed").default(0).notNull(),
  totalDaysActive: integer("total_days_active").default(0).notNull(),
  lastActiveDate: date("last_active_date"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many, one }) => ({
  quests: many(quests),
  dailyQuests: many(dailyQuests),
  achievements: many(achievements),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
}));

export const questsRelations = relations(quests, ({ one }) => ({
  user: one(users, {
    fields: [quests.userId],
    references: [users.id],
  }),
}));

export const dailyQuestsRelations = relations(dailyQuests, ({ one }) => ({
  user: one(users, {
    fields: [dailyQuests.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [dailyQuests.questId],
    references: [quests.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

// === VALIDATION SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  emailVerified: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({ 
  id: true, 
  createdAt: true, 
  userId: true 
});

export const insertDailyQuestSchema = createInsertSchema(dailyQuests).omit({ id: true });

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ 
  userId: true, 
  createdAt: true, 
  updatedAt: true 
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type DailyQuest = typeof dailyQuests.$inferSelect & { quest: Quest };
export type UserSettings = typeof userSettings.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// === API TYPES ===

export type CreateQuestRequest = InsertQuest;
export type BulkCreateQuestsRequest = { quests: string[] };
export type BulkDeleteQuestsRequest = { questIds: number[] };
export type BulkArchiveQuestsRequest = { questIds: number[] };
export type UpdateSettingsRequest = Partial<InsertUserSettings>;

export type QuestResponse = Quest;
export type DailyQuestResponse = DailyQuest;

export type DayStats = {
  date: string;
  count: number;
  completedQuests: DailyQuest[];
};

export interface StatsResponse {
  currentStreak: number;
  longestStreak: number;
  totalQuestsCompleted: number;
  totalDaysActive: number;
  lastActiveDate: string | null;
  history: DayStats[];
  achievements: Achievement[];
}

export interface SettingsResponse extends UserSettings {}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

// === DEFAULT QUESTS ===

export interface DefaultQuest {
  id: string;
  content: string;
  category: string;
}

export const DEFAULT_QUESTS: DefaultQuest[] = [
  // Physical Health
  { id: "dq_1", content: "Do 20 pushups", category: "Physical Health" },
  { id: "dq_2", content: "Take a 15-minute walk", category: "Physical Health" },
  { id: "dq_3", content: "Drink 8 glasses of water", category: "Physical Health" },
  { id: "dq_4", content: "Do 10 minutes of stretching", category: "Physical Health" },
  { id: "dq_5", content: "Go to the gym", category: "Physical Health" },
  
  // Mental Wellness
  { id: "dq_6", content: "Meditate for 10 minutes", category: "Mental Wellness" },
  { id: "dq_7", content: "Journal for 5 minutes", category: "Mental Wellness" },
  { id: "dq_8", content: "Practice gratitude - list 3 things", category: "Mental Wellness" },
  { id: "dq_9", content: "Take a 5-minute breathing break", category: "Mental Wellness" },
  
  // Learning & Growth
  { id: "dq_10", content: "Read for 30 minutes", category: "Learning & Growth" },
  { id: "dq_11", content: "Learn something new", category: "Learning & Growth" },
  { id: "dq_12", content: "Practice a skill for 20 minutes", category: "Learning & Growth" },
  { id: "dq_13", content: "Watch an educational video", category: "Learning & Growth" },
  
  // Productivity
  { id: "dq_14", content: "Clean your workspace", category: "Productivity" },
  { id: "dq_15", content: "Plan tomorrow's tasks", category: "Productivity" },
  { id: "dq_16", content: "Complete one important task", category: "Productivity" },
  { id: "dq_17", content: "Organize something for 10 minutes", category: "Productivity" },
  
  // Social & Connection
  { id: "dq_18", content: "Call a friend or family member", category: "Social & Connection" },
  { id: "dq_19", content: "Send a thoughtful message to someone", category: "Social & Connection" },
  { id: "dq_20", content: "Spend quality time with loved ones", category: "Social & Connection" },
  
  // Self-Care
  { id: "dq_21", content: "Take a relaxing bath or shower", category: "Self-Care" },
  { id: "dq_22", content: "Go to bed before midnight", category: "Self-Care" },
  { id: "dq_23", content: "Prepare a healthy meal", category: "Self-Care" },
  { id: "dq_24", content: "Practice a hobby you enjoy", category: "Self-Care" },
  
  // Habits
  { id: "dq_25", content: "Make your bed", category: "Habits" },
  { id: "dq_26", content: "No phone for 1 hour before bed", category: "Habits" },
  { id: "dq_27", content: "Wake up before 8 AM", category: "Habits" },
  { id: "dq_28", content: "Take vitamins/supplements", category: "Habits" },
];

// === ACHIEVEMENT TYPES ===

export const ACHIEVEMENT_TYPES = {
  FIRST_QUEST: "first_quest",
  FIRST_PERFECT_DAY: "first_perfect_day",
  STREAK_7: "streak_7",
  STREAK_30: "streak_30",
  STREAK_100: "streak_100",
  STREAK_200: "streak_200",
  STREAK_300: "streak_300",
  STREAK_365: "streak_365",
  STREAK_400: "streak_400",
} as const;

export type AchievementType = typeof ACHIEVEMENT_TYPES[keyof typeof ACHIEVEMENT_TYPES];