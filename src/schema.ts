import { pgTable, text, serial, boolean, timestamp, integer, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// This alias points to your root db/schema.ts file
import { users } from "@db/schema"; 
export * from "@db/schema";

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