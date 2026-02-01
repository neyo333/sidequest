import { Trophy, Flame, Star, Award, Zap, Crown, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import { ACHIEVEMENT_TYPES, type AchievementType } from "@db/schema";

interface AchievementToastProps {
  achievementType: AchievementType;
  onDismiss?: () => void;
}

const ACHIEVEMENT_CONFIG = {
  [ACHIEVEMENT_TYPES.FIRST_QUEST]: {
    icon: Star,
    title: "First Steps",
    description: "You completed your first quest!",
    color: "text-yellow-500",
  },
  [ACHIEVEMENT_TYPES.FIRST_PERFECT_DAY]: {
    icon: Trophy,
    title: "Perfect Day",
    description: "All 3 quests completed in one day!",
    color: "text-amber-500",
  },
  [ACHIEVEMENT_TYPES.STREAK_7]: {
    icon: Flame,
    title: "Week Warrior",
    description: "7 day streak achieved!",
    color: "text-orange-500",
  },
  [ACHIEVEMENT_TYPES.STREAK_30]: {
    icon: Zap,
    title: "Monthly Master",
    description: "30 day streak! You're unstoppable!",
    color: "text-orange-600",
  },
  [ACHIEVEMENT_TYPES.STREAK_100]: {
    icon: Award,
    title: "Century Club",
    description: "100 days of consistency!",
    color: "text-red-500",
  },
  [ACHIEVEMENT_TYPES.STREAK_200]: {
    icon: Crown,
    title: "Elite Achiever",
    description: "200 day streak! Incredible!",
    color: "text-purple-500",
  },
  [ACHIEVEMENT_TYPES.STREAK_300]: {
    icon: Sparkles,
    title: "Legend Status",
    description: "300 days! You're a true legend!",
    color: "text-pink-500",
  },
  [ACHIEVEMENT_TYPES.STREAK_365]: {
    icon: Target,
    title: "Year Champion",
    description: "365 days! A full year of dedication!",
    color: "text-blue-500",
  },
  [ACHIEVEMENT_TYPES.STREAK_500]: {
    icon: Crown,
    title: "Beyond Limits",
    description: "500+ days! You've transcended!",
    color: "text-violet-500",
  },
};

export function AchievementToast({ achievementType, onDismiss }: AchievementToastProps) {
  const { width, height } = useWindowSize();
  const config = ACHIEVEMENT_CONFIG[achievementType];
  const Icon = config.icon;

  return (
    <>
      <ReactConfetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={300}
        gravity={0.3}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="glass-panel rounded-[2rem] p-6 shadow-2xl border-2 border-primary/20">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ${config.color}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-xl italic tracking-tight mb-1">
                {config.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {config.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}