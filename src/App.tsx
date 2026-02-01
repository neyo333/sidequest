import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useSettings, useCompleteOnboarding } from "@/hooks/use-settings";
import { Navigation, MobileNav } from "@/components/Navigation";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { AchievementToast } from "@/components/AchievementToast";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Achievement } from "@db/schema";
import Achievements from "@/pages/Achievements";

import Dashboard from "@/pages/Dashboard";
import Pool from "@/pages/Pool";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-12 overflow-y-auto min-h-screen">
        <Component />
      </main>
      <MobileNav />
    </div>
  );
}

function OnboardingManager({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = useSettings();
  const { mutate: completeOnboarding } = useCompleteOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && settings && !settings.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [settings, isLoading]);

  const handleComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
      <OnboardingDialog open={showOnboarding} onComplete={handleComplete} />
      {children}
    </>
  );
}

// Global achievement tracker
export const achievementEmitter = {
  listeners: new Set<(achievement: Achievement) => void>(),
  emit(achievement: Achievement) {
    this.listeners.forEach(listener => listener(achievement));
  },
  subscribe(listener: (achievement: Achievement) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

function AchievementManager({ children }: { children: React.ReactNode }) {
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    return achievementEmitter.subscribe((newAchievement) => {
      setAchievement(newAchievement);
      setTimeout(() => setAchievement(null), 5000);
    });
  }, []);

  return (
    <>
      <AnimatePresence>
        {achievement && (
          <AchievementToast
            achievementType={achievement.achievementType}
            onDismiss={() => setAchievement(null)}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

function ThemeManager({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings) {
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (settings.theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        // System preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }, [settings]);

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/" /> : <Landing />}
      </Route>
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/pool">
        <ProtectedRoute component={Pool} />
      </Route>
      
      <Route path="/stats">
        <ProtectedRoute component={Stats} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route path="/achievements">
        <ProtectedRoute component={Achievements} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeManager>
          <OnboardingManager>
            <AchievementManager>
              <Toaster />
              <Router />
            </AchievementManager>
          </OnboardingManager>
        </ThemeManager>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;