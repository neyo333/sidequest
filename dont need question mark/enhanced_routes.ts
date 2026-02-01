import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

// Helper to get "today's date" relative to user's refresh time
async function getGameDate(userId: string): Promise<string> {
  const settings = await storage.getSettings(userId);
  const now = new Date();
  const [hours] = settings.refreshTime.split(':').map(Number);
  
  if (now.getHours() < hours) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Quests ===
  app.get("/api/quests", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const quests = await storage.getQuests(userId);
    res.json(quests);
  });

  app.post("/api/quests", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    try {
      const { content } = req.body;
      const quest = await storage.createQuest(userId, content);
      res.status(201).json(quest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post("/api/quests/bulk", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    try {
      const { quests } = req.body;
      if (!Array.isArray(quests)) {
        return res.status(400).json({ message: "quests must be an array" });
      }
      const created = await storage.bulkCreateQuests(userId, quests);
      res.status(201).json(created);
    } catch (err) {
      throw err;
    }
  });

  app.delete("/api/quests/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const id = Number(req.params.id);
    await storage.deleteQuest(id, userId);
    res.status(204).send();
  });

  app.post("/api/quests/bulk-delete", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    try {
      const { questIds } = req.body;
      if (!Array.isArray(questIds)) {
        return res.status(400).json({ message: "questIds must be an array" });
      }
      const count = await storage.bulkDeleteQuests(questIds, userId);
      res.json({ deleted: count });
    } catch (err) {
      throw err;
    }
  });

  app.post("/api/quests/:id/archive", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const id = Number(req.params.id);
    const quest = await storage.archiveQuest(id, userId);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found" });
    }
    res.json(quest);
  });

  app.post("/api/quests/bulk-archive", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    try {
      const { questIds } = req.body;
      if (!Array.isArray(questIds)) {
        return res.status(400).json({ message: "questIds must be an array" });
      }
      const count = await storage.bulkArchiveQuests(questIds, userId);
      res.json({ archived: count });
    } catch (err) {
      throw err;
    }
  });

  // === Daily Quests ===
  app.get("/api/daily", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const date = await getGameDate(userId);
    
    let daily = await storage.getDailyQuests(userId, date);

    // If no quests for today, generate them!
    if (daily.length === 0) {
      const allQuests = await storage.getQuests(userId);
      
      if (allQuests.length > 0) {
        // Pick 3 random (or less if pool is small)
        const shuffled = [...allQuests].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(3, allQuests.length));
        const selectedIds = selected.map(q => q.id);
        
        await storage.createDailyQuests(userId, selectedIds, date);
        daily = await storage.getDailyQuests(userId, date);
      }
    }

    res.json(daily);
  });

  app.post("/api/daily/:id/complete", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const id = Number(req.params.id);
    const { completed } = req.body;

    const updated = await storage.updateDailyQuestCompletion(id, userId, completed);
    if (!updated) {
      return res.status(404).json({ message: "Daily quest not found" });
    }

    // Check for new achievements
    const newAchievements = await storage.checkAndUnlockAchievements(userId);

    res.json({ dailyQuest: updated, newAchievements });
  });

  // === Stats ===
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const date = await getGameDate(userId);
    const stats = await storage.getStats(userId, date);
    res.json(stats);
  });

  // === Settings ===
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const settings = await storage.getSettings(userId);
    res.json(settings);
  });

  app.patch("/api/settings", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const settings = await storage.updateSettings(userId, req.body);
    res.json(settings);
  });

  app.post("/api/settings/complete-onboarding", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    await storage.completeOnboarding(userId);
    res.json({ success: true });
  });

  // === Data Export ===
  app.get("/api/export", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.claims.sub;
    const date = await getGameDate(userId);
    
    const [quests, stats] = await Promise.all([
      storage.getQuests(userId, true), // Include archived
      storage.getStats(userId, date),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      stats: {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalQuestsCompleted: stats.totalQuestsCompleted,
        totalDaysActive: stats.totalDaysActive,
      },
      quests,
      history: stats.history,
      achievements: stats.achievements,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="sidequest-export-${date}.json"`);
    res.json(exportData);
  });

  return httpServer;
}