import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, ListTodo, TrendingUp, Settings, Trophy, Sun } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", label: "Today's Quests", icon: Home },
  { path: "/pool", label: "Quest Pool", icon: ListTodo },
  { path: "/stats", label: "Stats", icon: TrendingUp },
  { path: "/achievements", label: "Achievements", icon: Trophy },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col">
      <div className="p-8 border-b border-border">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2 bg-primary rounded-xl group-hover:scale-110 transition-transform">
              <Sun className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">SideQuest</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  const mobileNavItems = navItems.filter(item => 
    ["/", "/pool", "/stats", "/achievements"].includes(item.path)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {item.label === "Today's Quests" ? "Today" : item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeMobileTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}