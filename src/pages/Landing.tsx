import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Trophy, ListTodo, Flame, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [hasError, setHasError] = useState(false);
  const { login, signup, isLoggingIn, isSigningUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      login(
        { email, password },
        {
          onError: (error: any) => {
            setHasError(true);
            toast({
              title: "Login failed",
              description: error.response?.data?.message || "Invalid email or password",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      if (!username.trim()) {
        toast({
          title: "Username required",
          description: "Please enter a username",
          variant: "destructive",
        });
        return;
      }

      signup(
        { email, password, username },
        {
          onError: (error: any) => {
            setHasError(true);
            toast({
              title: "Signup failed",
              description: error.response?.data?.message || "Unable to create account",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const isLoading = isLoggingIn || isSigningUp;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Hero/Branding */}
      <div className="lg:w-1/2 relative bg-primary text-primary-foreground p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.1),transparent)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">SideQuest</span>
          </div>
          
          <h1 className="font-display font-bold text-5xl lg:text-7xl leading-[1.1] mb-6">
            Turn your daily habits into an epic adventure.
          </h1>
          
          <p className="text-xl text-primary-foreground/90 max-w-md font-light leading-relaxed">
            Build consistency, track your streaks, and level up your life one daily quest at a time.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 mt-12">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ListTodo className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Custom Pool</h3>
            <p className="text-sm opacity-80">Curate your own list of potential tasks.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Daily 3</h3>
            <p className="text-sm opacity-80">Get 3 random quests every morning.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Streak</h3>
            <p className="text-sm opacity-80">Do just one to keep the streak alive.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Log in to continue your streak" : "Start your quest journey today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 rounded-xl h-12"
                    required={!isLogin}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll get a unique 4-digit tag (e.g., {username || "Player"}#1234)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl h-12"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Enter your password" : "Create a password (min 8 characters)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-xl h-12"
                  required
                  minLength={isLogin ? undefined : 8}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit"
              size="lg" 
              className="w-full h-14 text-lg rounded-full shadow-xl shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Log In" : "Sign Up"
              )}
            </Button>

            <AnimatePresence mode="wait">
              {(hasError || !isLogin) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center space-y-2"
                >
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setHasError(false);
                    }}
                    className="w-full h-14 text-lg rounded-full"
                    disabled={isLoading}
                  >
                    {isLogin ? "Sign Up" : "Log In"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}