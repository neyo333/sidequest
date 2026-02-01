import { useStats } from "@/hooks/use-stats";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Flame, Award, Zap, Crown, Sparkles, Target, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ACHIEVEMENT_TYPES } from "@db/schema";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_CONFIG = {
  [ACHIEVEMENT_TYPES.FIRST_QUEST]: {
    icon: Star,
    title: "First Steps",
    description: "Complete your first quest",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  [ACHIEVEMENT_TYPES.FIRST_PERFECT_DAY]: {
    icon: Trophy,
    title: "Perfect Day",
    description: "Complete all 3 quests in one day",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_7]: {
    icon: Flame,
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_30]: {
    icon: Zap,
    title: "Monthly Master",
    description: "Maintain a 30-day streak",
    color: "text-orange-600",
    bgColor: "bg-orange-600/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_100]: {
    icon: Award,
    title: "Century Club",
    description: "Maintain a 100-day streak",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_200]: {
    icon: Crown,
    title: "Elite Achiever",
    description: "Maintain a 200-day streak",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_300]: {
    icon: Sparkles,
    title: "Legend Status",
    description: "Maintain a 300-day streak",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_365]: {
    icon: Target,
    title: "Year Champion",
    description: "Maintain a 365-day streak",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  [ACHIEVEMENT_TYPES.STREAK_500]: {
    icon: Crown,
    title: "Beyond Limits",
    description: "Maintain a 500+ day streak",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
};

export default function Achievements() {
  const { data: stats, isLoading } = useStats();

  const unlockedAchievements = new Set(stats?.achievements?.map(a => a.achievementType) || []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalAchievements = Object.keys(ACHIEVEMENT_TYPES).length;
  const unlockedCount = unlockedAchievements.size;
  const progress = (unlockedCount / totalAchievements) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-8 pb-20 px-4"
    >
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-5xl font-display font-bold italic tracking-tighter">Achievements</h1>
        <p className="text-muted-foreground mt-2 text-lg font-light">
          Your collection of milestones and badges
        </p>
      </div>

      {/* Progress Summary */}
      <Card className="rounded-[2rem] border-border shadow-sm bg-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-display font-bold">
              {unlockedCount} <span className="text-muted-foreground text-xl">/ {totalAchievements}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Achievements Unlocked</p>
          </div>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </Card>

      {/* Achievement Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(ACHIEVEMENT_CONFIG).map(([type, config]) => {
          const Icon = config.icon;
          const isUnlocked = unlockedAchievements.has(type);
          const unlockedData = stats?.achievements?.find(a => a.achievementType === type);

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={cn(
                  "rounded-[2rem] border-2 shadow-sm overflow-hidden transition-all",
                  isUnlocked
                    ? `${config.bgColor} border-current ${config.color}`
                    : "bg-card border-border/40 opacity-50 grayscale"
                )}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center",
                        isUnlocked ? `${config.bgColor} ${config.color}` : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {isUnlocked ? (
                        <Icon className="w-7 h-7" />
                      ) : (
                        <Lock className="w-7 h-7" />
                      )}
                    </div>
                    {isUnlocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                      >
                        <Trophy className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg mb-1">
                      {config.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </div>

                  {isUnlocked && unlockedData && (
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                      Unlocked {new Date(unlockedData.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Motivational Message */}
      {unlockedCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-secondary/30 rounded-[2rem] border border-dashed border-border"
        >
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-display font-bold mb-2 italic">Start Your Journey</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete quests to unlock achievements and build your collection of badges!
          </p>
        </motion.div>
      )}

      {unlockedCount === totalAchievements && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-[2rem] border-2 border-primary/20"
        >
          <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-3xl font-display font-bold mb-2 italic">Perfect Collection!</h3>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            You've unlocked every achievement. You're a true SideQuest champion! 🎉
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}