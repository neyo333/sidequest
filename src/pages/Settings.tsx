import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Moon, Sun, Clock, User, Mail, LogOut, Hash, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const { user, logout } = useAuth();
  const { mutate: updateSettings } = useUpdateSettings();
  const { toast } = useToast();

  const [theme, setTheme] = useState<string>("light");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [notificationText, setNotificationText] = useState("Time to conquer your daily quests!");
  const [refreshTime, setRefreshTime] = useState("04:00");

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme);
      setNotificationEnabled(settings.notificationEnabled);
      setNotificationTime(settings.notificationTime);
      setNotificationText(settings.notificationText);
      setRefreshTime(settings.refreshTime);
      
      // Apply theme
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings]);

  // Auto-save function
  const autoSave = (updates: Partial<typeof settings>) => {
    updateSettings(updates, {
      onSuccess: () => {
        // Apply theme immediately
        if (updates.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (updates.theme === "light") {
          document.documentElement.classList.remove("dark");
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto px-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-8 pb-20 px-4"
    >
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-5xl font-display font-bold italic tracking-tighter">Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg font-light">
          Customize your SideQuest experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card className="rounded-[2rem] border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display italic">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>Your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                <div className="flex items-center gap-2 text-sm p-3 bg-secondary/30 rounded-xl">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{user?.email}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Username</Label>
                <div className="flex items-center gap-2 text-sm p-3 bg-secondary/30 rounded-xl">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{user?.username}</span>
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-muted-foreground">{user?.tag}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
              <div className="flex items-center gap-2 text-sm p-3 bg-secondary/30 rounded-xl">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">••••••••</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Password management coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="rounded-[2rem] border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display italic">
              <Sun className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={theme} 
                onValueChange={(value) => {
                  setTheme(value);
                  autoSave({ theme: value });
                }}
              >
                <SelectTrigger id="theme" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quest Refresh */}
        <Card className="rounded-[2rem] border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display italic">
              <Clock className="w-5 h-5" />
              Quest Refresh
            </CardTitle>
            <CardDescription>When should your daily quests reset?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refreshTime">Refresh Time</Label>
              <Input
                id="refreshTime"
                type="time"
                value={refreshTime}
                onChange={(e) => setRefreshTime(e.target.value)}
                onBlur={() => autoSave({ refreshTime })}
                className="rounded-xl"
              />
              <p className="text-sm text-muted-foreground">
                Your quests will refresh at {refreshTime} each day
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-[2rem] border-border shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display italic">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your quest reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to complete your daily quests
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notificationEnabled}
                onCheckedChange={(checked) => {
                  setNotificationEnabled(checked);
                  autoSave({ notificationEnabled: checked });
                }}
              />
            </div>

            {notificationEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-4 border-t border-border/30"
              >
                <div className="space-y-2">
                  <Label htmlFor="notificationTime">Reminder Time</Label>
                  <Input
                    id="notificationTime"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    onBlur={() => autoSave({ notificationTime })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationText">Reminder Message</Label>
                  <Textarea
                    id="notificationText"
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    onBlur={() => autoSave({ notificationText })}
                    className="rounded-xl resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground">
                    {notificationText.length}/200 characters
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <div className="pt-4">
          <Button
            variant="destructive"
            onClick={() => logout()}
            className="w-full rounded-full gap-2 h-14 text-lg"
            size="lg"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </motion.div>
  );
}