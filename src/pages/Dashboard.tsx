import { useDailyQuests } from "@/hooks/use-daily";
import { useStats } from "@/hooks/use-stats";
import { QuestCard } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, Flame, Trophy, Clock } from "lucide-react";
import ReactConfetti from "react-confetti";
import { useWindowSize, useInterval } from "react-use";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { achievementEmitter } from "@/App";
import { useSettings } from "@/hooks/use-settings";
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast";

function CountdownTimer({ refreshTime = "04:00", onReset }: { refreshTime?: string, onReset?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");

  const updateTimer = () => {
    const now = new Date();
    const target = new Date();
    const [hours, minutes] = refreshTime.split(':').map(Number);
    target.setHours(hours, minutes, 0, 0);
    
    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }
    
    const diff = target.getTime() - now.getTime();
    
    // IF THE TIMER HITS ZERO (or less), trigger the reset!
    if (diff <= 0 && onReset) {
      onReset();
    }

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft(`${h}h ${m}m ${s}s`);
  };

  useInterval(updateTimer, 1000);

  return (
    <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full text-sm font-medium">
      <Clock className="w-4 h-4" />
      <span>Reset in {timeLeft}</span>
    </div>
  );
}


export default function Dashboard() {
  const queryClient = useQueryClient(); 
  const { toast } = useToast();
  const { data: dailyQuests, isLoading: isQuestsLoading } = useDailyQuests();
  const { data: stats } = useStats();
  const { data: settings } = useSettings(); 
  const handleReset = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/daily"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    
    toast({
      title: "New Day!",
      description: "Your quests have been refreshed.",
    });
  };
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false); 

  const completedCount = dailyQuests?.filter(q => q.completed).length || 0;
  const isGoalMet = completedCount >= 1;

  // Show confetti when goal is first met
  useEffect(() => {
    if (isGoalMet && completedCount === 1) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isGoalMet, completedCount]);

  if (isQuestsLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (dailyQuests && dailyQuests.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-3 italic">Begin Your Journey</h2>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          Your quest pool is empty. Add quests to receive your daily challenges.
        </p>
        <Link href="/pool">
          <Button size="lg" className="gap-2 text-lg px-8 rounded-full">
            Add Quests <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-8 pb-20 px-4"
    >
      {showConfetti && <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-5xl font-display font-bold text-foreground italic tracking-tighter">
            Today
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-light">
            Because life is more than just getting through the day.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          {stats && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-sm">
              <Flame className="w-5 h-5 fill-current" />
              <span className="font-bold tracking-tight">{stats.currentStreak} Day Streak</span>
            </div>
          )}
          <CountdownTimer 
            refreshTime={settings?.refreshTime}
            onReset={handleReset} 
          />
        </div>
      </div>

      <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-sm transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm uppercase tracking-widest text-muted-foreground font-semibold">Daily Progress</span>
          <span className="font-display font-bold text-2xl">{completedCount} <span className="text-muted-foreground text-lg">/ 3</span></span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / 3) * 100}%` }}
            className="h-full bg-primary"
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
        </div>
        {isGoalMet && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-foreground font-medium flex items-center gap-2 text-sm italic"
          >
            <Trophy className="w-4 h-4" /> Goal met. Your streak is safe for another day.
          </motion.p>
        )}
      </div>

      <div className="space-y-4">
        {dailyQuests?.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <QuestCard 
              dailyQuest={quest} 
              onAchievementUnlocked={(achievements) => {
                achievements.forEach(achievement => {
                  achievementEmitter.emit(achievement);
                });
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
