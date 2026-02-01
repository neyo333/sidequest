import { setupAuth, registerAuthRoutes, isAuthenticated } from "../auth.js";
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage.js"
import { requireAuth } from "../auth";
import { registerAuthRoutes } from "./auth";
import { db } from "../db";
import { quests } from "@db/schema";
import { eq, and } from "drizzle-orm";


async function getGameDate(userId: string): Promise<string> {
  const settings = await storage.getSettings(userId);
  const now = new Date();
  const [hours] = settings.refreshTime.split(':').map(Number);
  
  if (now.getHours() < hours) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0];
}

export function registerRoutes(app: Express) {
  // Register auth routes
  registerAuthRoutes(app);

  // === Quests ===
  app.get("/api/quests", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const quests = await storage.getQuests(userId);
      res.json(quests);
    } catch (error) {
      console.error("Get quests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quests", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { content } = req.body;
      const quest = await storage.createQuest(userId, content);
      res.status(201).json(quest);
    } catch (error) {
      console.error("Create quest error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quests/bulk", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { quests } = req.body;
      
      if (!Array.isArray(quests)) {
        return res.status(400).json({ message: "quests must be an array" });
      }
      
      const created = await storage.bulkCreateQuests(userId, quests);
      res.status(201).json(created);
    } catch (error) {
      console.error("Bulk create quests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/quests/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = Number(req.params.id);
      await storage.deleteQuest(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete quest error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quests/bulk-delete", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { questIds } = req.body;
      
      if (!Array.isArray(questIds)) {
        return res.status(400).json({ message: "questIds must be an array" });
      }
      
      const count = await storage.bulkDeleteQuests(questIds, userId);
      res.json({ deleted: count });
    } catch (error) {
      console.error("Bulk delete quests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quests/:id/archive", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = Number(req.params.id);
      const quest = await storage.archiveQuest(id, userId);
      
      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      
      res.json(quest);
    } catch (error) {
      console.error("Archive quest error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quests/bulk-archive", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { questIds } = req.body;
      
      if (!Array.isArray(questIds)) {
        return res.status(400).json({ message: "questIds must be an array" });
      }
      
      const count = await storage.bulkArchiveQuests(questIds, userId);
      res.json({ archived: count });
    } catch (error) {
      console.error("Bulk archive quests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Daily Quests ===
  app.get("/api/daily", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const date = await getGameDate(userId);
      
      let daily = await storage.getDailyQuests(userId, date);

      if (daily.length === 0) {
        const allQuests = await storage.getQuests(userId);
        
        if (allQuests.length > 0) {
          const shuffled = [...allQuests].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, Math.min(3, allQuests.length));
          const selectedIds = selected.map(q => q.id);
          
          await storage.createDailyQuests(userId, selectedIds, date);
          daily = await storage.getDailyQuests(userId, date);
        }
      }

      res.json(daily);
    } catch (error) {
      console.error("Get daily quests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/daily/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = Number(req.params.id);
      const { completed } = req.body;

      const updated = await storage.updateQuest(parseInt(req.params.id), req.user!.id, req.body.content);
      
      if (!updated) {
        return res.status(404).json({ message: "Daily quest not found" });
      }

      const newAchievements = await storage.checkAndUnlockAchievements(userId);

      res.json({ dailyQuest: updated, newAchievements });
    } catch (error) {
      console.error("Complete daily quest error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Stats ===
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const date = await getGameDate(userId);
      const stats = await storage.getStats(userId, date);
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Settings ===
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const settings = await storage.getSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const settings = await storage.updateSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/settings/complete-onboarding", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      await storage.completeOnboarding(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Complete onboarding error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/quests/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    const { content } = req.body;
    
    const [updated] = await db.update(quests)
      .set({ content })
      .where(and(eq(quests.id, id), eq(quests.userId, userId)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Quest not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Update quest error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

  // === Data Export ===
  app.get("/api/export", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const date = await getGameDate(userId);
      
      const [quests, stats] = await Promise.all([
        storage.getQuests(userId, true),
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
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}