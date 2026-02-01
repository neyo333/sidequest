import { useStats } from "@/hooks/use-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, CheckCircle2, CalendarDays, TrendingUp, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay, parseISO, subDays, startOfWeek, endOfWeek } from "date-fns";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Stats() {
  const { data: stats, isLoading } = useStats();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayQuests, setSelectedDayQuests] = useState<{ content: string }[] | null>(null);

  const historyMap = useMemo(() => {
    const map = new Map<string, { count: number; quests: any[] }>();
    if (stats?.history) {
      stats.history.forEach((h: any) => {
        map.set(h.date, { count: h.count, quests: h.completedQuests.map((dq: any) => dq.quest) });
      });
    }
    return map;
  }, [stats?.history]);

  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const day = subDays(today, 6 - i); // Last 7 days including today
      const dateStr = format(day, 'yyyy-MM-dd');
      days.push({
        day: format(day, 'EEE'),
        completed: historyMap.get(dateStr)?.count || 0,
        fullDate: dateStr
      });
    }
    return days;
  }, [historyMap]);

  if (isLoading) {
    return <div className="space-y-6 max-w-5xl mx-auto px-4">
      <Skeleton className="h-12 w-48 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const joinDate = user?.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <Dialog open={!!selectedDayQuests} onOpenChange={(open) => !open && setSelectedDayQuests(null)}>
        <DialogContent className="rounded-[2rem] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold italic">Completed Quests</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayQuests?.length ? (
              selectedDayQuests.map((q, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/30">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium">{q.content}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic text-center py-4">No quests completed on this day.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-5xl font-display font-bold italic tracking-tighter">Progress</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[2rem] border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Streak</CardTitle>
            <Flame className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-display italic tracking-tighter">{stats?.currentStreak}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Finished</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-display italic tracking-tighter">{stats?.totalQuestsCompleted}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Active Days</CardTitle>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-display italic tracking-tighter">{stats?.totalDaysActive}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-[2rem] border-border shadow-sm bg-card p-8">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="flex items-center gap-2 text-xl italic tracking-tight">
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="day" 
                  stroke="currentColor" 
                  className="text-muted-foreground"
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => v.toUpperCase()}
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-muted-foreground"
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  ticks={[0, 1, 2, 3]}
                />
                <Bar dataKey="completed" radius={[4, 4, 4, 4]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="#f97316" 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        const dayHistory = historyMap.get(entry.fullDate);
                        if (dayHistory) setSelectedDayQuests(dayHistory.quests);
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-border shadow-sm bg-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold italic tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isStart = joinDate && isSameDay(day, joinDate);
              const dayHistory = historyMap.get(dateStr);
              const isCompleted = dayHistory && dayHistory.count > 0;
              
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-full text-sm font-medium relative cursor-pointer hover:bg-secondary/40 transition-colors",
                    !isSameMonth(day, currentMonth) && "opacity-20 pointer-events-none"
                  )}
                  style={{ gridColumnStart: i === 0 ? day.getDay() + 1 : undefined }}
                  onClick={() => {
                    if (isCompleted) setSelectedDayQuests(dayHistory.quests);
                  }}
                >
                  {day.getDate()}
                  {isCompleted && (
                    <div className="absolute inset-0 border-2 border-orange-500 rounded-full" />
                  )}
                  {isStart && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-sm" title="Account Created" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

