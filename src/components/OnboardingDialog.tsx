import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="rounded-[2rem] bg-card border-border max-w-md" hideClose>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8 py-6"
        >
          <DialogHeader className="space-y-6 text-center">
            <DialogTitle className="text-4xl font-display font-bold italic tracking-tight">
              Welcome to SideQuest
            </DialogTitle>
            
            <div className="space-y-4 px-4">
              <p className="text-2xl font-semibold text-foreground">
                Don't cheat
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                There's no penalty for missing days
              </p>
            </div>
          </DialogHeader>

          <Button
            onClick={onComplete}
            size="lg"
            className="w-full rounded-full text-lg h-14 shadow-xl shadow-primary/20"
          >
            I understand
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}