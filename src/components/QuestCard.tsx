import { useCompleteDailyQuest } from "@/hooks/use-daily";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { DailyQuest, Achievement } from "@db/schema";

interface QuestCardProps {
  dailyQuest: DailyQuest;
  onAchievementUnlocked?: (achievements: Achievement[]) => void;
}

export function QuestCard({ dailyQuest, onAchievementUnlocked }: QuestCardProps) {
  const { mutate: completeQuest } = useCompleteDailyQuest();

  const handleToggle = () => {
    completeQuest(
      { id: dailyQuest.id, completed: !dailyQuest.completed },
      {
        onSuccess: (data) => {
          if (data.newAchievements && data.newAchievements.length > 0 && onAchievementUnlocked) {
            onAchievementUnlocked(data.newAchievements);
          }
        },
      }
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        onClick={handleToggle}
        className={cn(
          "p-6 rounded-3xl cursor-pointer transition-all border-2",
          dailyQuest.completed
            ? "bg-primary/5 border-primary/30 shadow-md"
            : "bg-card border-border/40 hover:border-primary/20 hover:shadow-sm"
        )}
      >
        <div className="flex items-start gap-4">
          <motion.div
            initial={false}
            animate={{
              scale: dailyQuest.completed ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
            className="shrink-0 mt-1"
          >
            {dailyQuest.completed ? (
              <CheckCircle2 className="w-6 h-6 text-primary fill-current" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground" />
            )}
          </motion.div>

          <div className="flex-1">
            <p
              className={cn(
                "text-lg font-medium leading-relaxed transition-all",
                dailyQuest.completed
                  ? "text-muted-foreground line-through opacity-60"
                  : "text-foreground"
              )}
            >
              {dailyQuest.quest.content}
            </p>
            
            {dailyQuest.completed && dailyQuest.completedAt && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground mt-2 italic"
              >
                Completed at {new Date(dailyQuest.completedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </motion.p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}