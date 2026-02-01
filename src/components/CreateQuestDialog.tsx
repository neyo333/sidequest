import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useBulkCreateQuests } from "@/hooks/use-quests";
import { useToast } from "@/hooks/use-toast";

export function CreateQuestDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const { mutate: bulkCreate, isPending } = useBulkCreateQuests();
  const { toast } = useToast();

  const handleSubmit = () => {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      toast({
        title: "No quests entered",
        description: "Please enter at least one quest.",
        variant: "destructive",
      });
      return;
    }

    bulkCreate(lines, {
      onSuccess: (data) => {
        toast({
          title: "Quests added",
          description: `Successfully added ${data.length} quest${data.length === 1 ? '' : 's'}.`,
        });
        setContent("");
        setOpen(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add quests. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Add Quests
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold italic">
            Add Quests to Pool
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Textarea
              placeholder="Enter one quest per line...&#10;&#10;e.g.&#10;Do 20 pushups&#10;Read for 30 minutes&#10;Meditate for 10 minutes"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-2xl resize-none min-h-[300px] font-mono text-sm"
              autoFocus
            />
            <p className="text-sm text-muted-foreground mt-2">
              {content.split('\n').filter(line => line.trim()).length} quest{content.split('\n').filter(line => line.trim()).length === 1 ? '' : 's'} ready to add
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setContent("");
                setOpen(false);
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              className="rounded-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Pool
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}