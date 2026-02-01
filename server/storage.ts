import { db } from "./db";
import { quests, dailyQuests, userSettings, achievements, userStats, users, ACHIEVEMENT_TYPES } from "@db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import type { Quest, DailyQuest, StatsResponse, UserSettings, Achievement } from "@db/schema";

// Helper to get "today's date" relative to user's refresh time
function getGameDate(refreshTime: string = "04:00"): string {
  const now = new Date();
  const [hours] = refreshTime.split(':').map(Number);
  
  if (now.getHours() < hours) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0];
}

export const storage = {
  // === QUESTS ===
  async getQuests(userId: string, includeArchived: boolean = false): Promise<Quest[]> {
    if (includeArchived) {
      return db.select().from(quests).where(eq(quests.userId, userId));
    }
    return db.select().from(quests).where(
      and(eq(quests.userId, userId), eq(quests.archived, false))
    );
  },

  async createQuest(userId: string, content: string): Promise<Quest> {
    const [quest] = await db.insert(quests).values({
      userId,
      content,
      archived: false,
    }).returning();
    return quest;
  },

  async bulkCreateQuests(userId: string, contents: string[]): Promise<Quest[]> {
    const values = contents.map(content => ({
      userId,
      content,
      archived: false,
    }));
    return db.insert(quests).values(values).returning();
  },

  async deleteQuest(questId: number, userId: string): Promise<boolean> {
    const result = await db.delete(quests).where(
      and(eq(quests.id, questId), eq(quests.userId, userId))
    ).returning();
    return result.length > 0;
  },

  async bulkDeleteQuests(questIds: number[], userId: string): Promise<number> {
    const result = await db.delete(quests).where(
      and(sql`${quests.id} = ANY(${questIds})`, eq(quests.userId, userId))
    ).returning();
    return result.length;
  },

  async archiveQuest(questId: number, userId: string): Promise<Quest | null> {
    const [quest] = await db.update(quests)
      .set({ archived: true })
      .where(and(eq(quests.id, questId), eq(quests.userId, userId)))
      .returning();
    return quest || null;
  },

  async bulkArchiveQuests(questIds: number[], userId: string): Promise<number> {
    const result = await db.update(quests)
      .set({ archived: true })
      .where(and(sql`${quests.id} = ANY(${questIds})`, eq(quests.userId, userId)))
      .returning();
    return result.length;
  },

  // === DAILY QUESTS ===
  async getDailyQuests(userId: string, date: string): Promise<DailyQuest[]> {
    return db.select({
      id: dailyQuests.id,
      userId: dailyQuests.userId,
      questId: dailyQuests.questId,
      date: dailyQuests.date,
      completed: dailyQuests.completed,
      completedAt: dailyQuests.completedAt,
      quest: quests,
    })
      .from(dailyQuests)
      .leftJoin(quests, eq(dailyQuests.questId, quests.id))
      .where(and(eq(dailyQuests.userId, userId), eq(dailyQuests.date, date)));
  },

  async createDailyQuests(userId: string, questIds: number[], date: string): Promise<void> {
    const values = questIds.map(questId => ({
      userId,
      questId,
      date,
      completed: false,
    }));
    await db.insert(dailyQuests).values(values);
  },

  async updateDailyQuestCompletion(dailyQuestId: number, userId: string, completed: boolean): Promise<DailyQuest | null> {
    const [updated] = await db.update(dailyQuests)
      .set({ 
        completed,
        completedAt: completed ? new Date() : null,
      })
      .where(and(eq(dailyQuests.id, dailyQuestId), eq(dailyQuests.userId, userId)))
      .returning();

    if (!updated) return null;

    // Check for achievements
    if (completed) {
      await this.checkAndUnlockAchievements(userId);
    }

    // Return with quest details
    const [result] = await db.select({
      id: dailyQuests.id,
      userId: dailyQuests.userId,
      questId: dailyQuests.questId,
      date: dailyQuests.date,
      completed: dailyQuests.completed,
      completedAt: dailyQuests.completedAt,
      quest: quests,
    })
      .from(dailyQuests)
      .leftJoin(quests, eq(dailyQuests.questId, quests.id))
      .where(eq(dailyQuests.id, dailyQuestId));

    return result || null;
  },

  // === STATS ===
  async getStats(userId: string, currentDate: string): Promise<StatsResponse> {
    // Get or create user stats
    let [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    
    if (!stats) {
      [stats] = await db.insert(userStats).values({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalQuestsCompleted: 0,
        totalDaysActive: 0,
        lastActiveDate: null,
      }).returning();
    }

    // Recalculate streaks and stats
    await this.recalculateStats(userId, currentDate);

    // Fetch updated stats
    [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));

    // Get history (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];

    const history = await db.select({
      date: dailyQuests.date,
      id: dailyQuests.id,
      questId: dailyQuests.questId,
      userId: dailyQuests.userId,
      completed: dailyQuests.completed,
      completedAt: dailyQuests.completedAt,
      quest: quests,
    })
      .from(dailyQuests)
      .leftJoin(quests, eq(dailyQuests.questId, quests.id))
      .where(
        and(
          eq(dailyQuests.userId, userId),
          gte(dailyQuests.date, startDate),
          eq(dailyQuests.completed, true)
        )
      )
      .orderBy(desc(dailyQuests.date));

    // Group by date
    const historyMap = new Map<string, DailyQuest[]>();
    history.forEach((record) => {
      if (!historyMap.has(record.date)) {
        historyMap.set(record.date, []);
      }
      historyMap.get(record.date)!.push(record);
    });

    const historyStats = Array.from(historyMap.entries()).map(([date, completedQuests]) => ({
      date,
      count: completedQuests.length,
      completedQuests,
    }));

    // Get achievements
    const userAchievements = await db.select().from(achievements).where(eq(achievements.userId, userId));

    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalQuestsCompleted: stats.totalQuestsCompleted,
      totalDaysActive: stats.totalDaysActive,
      lastActiveDate: stats.lastActiveDate,
      history: historyStats,
      achievements: userAchievements,
    };
  },
      async recalculateStats(userId: string, currentDate: string): Promise<void> {
    const allDailyQuests = await db.select()
      .from(dailyQuests)
      .where(eq(dailyQuests.userId, userId))
      .orderBy(desc(dailyQuests.date));

    const totalQuestsCompleted = allDailyQuests.filter(q => q.completed).length;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const dateMap = new Map<string, { completed: number, total: number }>();
    allDailyQuests.forEach(q => {
      if (!dateMap.has(q.date)) {
        dateMap.set(q.date, { completed: 0, total: 0 });
      }
      const day = dateMap.get(q.date)!;
      day.total++;
      if (q.completed) day.completed++;
    });

    const sortedDates = Array.from(dateMap.keys()).sort().reverse();
    const todayData = dateMap.get(currentDate);
    const hasCompletedToday = todayData && todayData.completed >= 1;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const dayData = dateMap.get(date)!;

      if (dayData.completed >= 1) {
        tempStreak++;
        if (i === 0 || this.isConsecutiveDay(sortedDates[i - 1], date)) {
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (date === currentDate && !hasCompletedToday) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }

    const totalDaysActive = Array.from(dateMap.values()).filter(d => d.completed >= 1).length;

    await db.update(userStats)
      .set({
        currentStreak: hasCompletedToday ? currentStreak : 0,
        longestStreak,
        totalQuestsCompleted,
        totalDaysActive,
        lastActiveDate: sortedDates[0] ? new Date(sortedDates[0]) : null,
      })
      .where(eq(userStats.userId, userId));
  },

  isConsecutiveDay(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d1.getTime() - d2.getTime());
    return diff <= (1000 * 60 * 60 * 24);
  },

  async checkAndUnlockAchievements(userId: string): Promise<void> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    if (!stats) return;

    if (stats.totalQuestsCompleted >= 1) {
      const [existing] = await db.select().from(achievements)
        .where(and(eq(achievements.userId, userId), eq(achievements.type, 'FIRST_QUEST')));
      if (!existing) {
        await db.insert(achievements).values({
          userId,
          type: 'FIRST_QUEST',
          unlockedAt: new Date()
        });
      }
    }
  },

  async getSettings(userId: string): Promise<UserSettings | null> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || null;
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const [settings] = await db.update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings;
  }
};
