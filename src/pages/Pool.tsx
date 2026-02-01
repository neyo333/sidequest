import { useQuests, useDeleteQuest, useBulkDeleteQuests, useUpdateQuest } from "@/hooks/use-quests";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { CreateQuestDialog } from "@/components/CreateQuestDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ScrollText, Plus, Search, CheckSquare, Square, ChevronDown, ChevronUp, Info, Filter, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DEFAULT_QUESTS } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export default function Pool() {
  const { data: quests, isLoading } = useQuests();
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { mutate: deleteQuest } = useDeleteQuest();
  const { mutate: bulkDeleteQuests } = useBulkDeleteQuests();
  const { mutate: updateQuest } = useUpdateQuest();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [defaultQuestsExpanded, setDefaultQuestsExpanded] = useState(false);
  const [customQuestsExpanded, setCustomQuestsExpanded] = useState(true);
  const [defaultQuestSearch, setDefaultQuestSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingQuest, setEditingQuest] = useState<{ id: number; content: string } | null>(null);

  const filteredQuests = quests?.filter(q => q.content.toLowerCase().includes(search.toLowerCase())) || [];
  
  const filteredDefaultQuests = DEFAULT_QUESTS.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(defaultQuestSearch.toLowerCase());
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const enabledDefaultQuests = settings?.enabledDefaultQuests || DEFAULT_QUESTS.map(q => q.id);
  const categories = ["all", ...Array.from(new Set(DEFAULT_QUESTS.map(q => q.category)))];

  const handleSelectAll = () => {
    if (selectedIds.length === filteredQuests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuests.map(q => q.id));
    }
  };

  const handleDeleteSelected = () => {
    bulkDeleteQuests(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const toggleDefaultQuest = (questId: string) => {
    const newEnabled = enabledDefaultQuests.includes(questId)
      ? enabledDefaultQuests.filter(id => id !== questId)
      : [...enabledDefaultQuests, questId];
    
    updateSettings({ enabledDefaultQuests: newEnabled });
  };

  const handleSelectAllDefault = () => {
    const visibleQuestIds = filteredDefaultQuests.map(q => q.id);
    const allVisible = visibleQuestIds.every(id => enabledDefaultQuests.includes(id));
    
    if (allVisible) {
      // Unselect all visible
      const newEnabled = enabledDefaultQuests.filter(id => !visibleQuestIds.includes(id));
      updateSettings({ enabledDefaultQuests: newEnabled });
    } else {
      // Select all visible
      const newEnabled = [...new Set([...enabledDefaultQuests, ...visibleQuestIds])];
      updateSettings({ enabledDefaultQuests: newEnabled });
    }
  };

  const handleApplyDefaults = () => {
    toast({
      title: "Default quests updated",
      description: `${enabledDefaultQuests.length} quests are now active in your pool.`,
    });
  };

  const handleEditQuest = () => {
    if (!editingQuest) return;
    
    updateQuest(
      { id: editingQuest.id, content: editingQuest.content },
      {
        onSuccess: () => {
          setEditingQuest(null);
          toast({
            title: "Quest updated",
            description: "Your quest has been saved.",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8 pb-20 px-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/50 pb-8">
        <div>
          <h1 className="text-5xl font-display font-bold italic tracking-tighter">Quest Pool</h1>
          <p className="text-muted-foreground mt-2 text-lg font-light">
            Your collection of daily challenges
          </p>
        </div>
        <CreateQuestDialog />
      </div>

      {/* Default Quests Section */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
        <button
          onClick={() => setDefaultQuestsExpanded(!defaultQuestsExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-display font-bold italic">Default Quests</h2>
              <p className="text-sm text-muted-foreground">
                {enabledDefaultQuests.length} of {DEFAULT_QUESTS.length} enabled
              </p>
            </div>
          </div>
          {defaultQuestsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {defaultQuestsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/30"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-2 p-3 bg-secondary/30 rounded-xl">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Check the boxes next to quests you want to include in your daily randomization. Unchecked quests won't appear in your daily selection.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search default quests..." 
                      className="pl-10 rounded-full bg-secondary/30 border-none"
                      value={defaultQuestSearch}
                      onChange={(e) => setDefaultQuestSearch(e.target.value)}
                    />
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] rounded-full">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.filter(c => c !== "all").map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllDefault}
                    className="rounded-full"
                  >
                    {filteredDefaultQuests.every(q => enabledDefaultQuests.includes(q.id)) ? "Unselect All" : "Select All"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleApplyDefaults}
                    className="rounded-full"
                  >
                    Apply
                  </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredDefaultQuests.map((quest) => {
                    const isEnabled = enabledDefaultQuests.includes(quest.id);
                    return (
                      <motion.div
                        key={quest.id}
                        layout
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer",
                          isEnabled 
                            ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                            : "bg-secondary/10 border-border/30 hover:bg-secondary/20"
                        )}
                        onClick={() => toggleDefaultQuest(quest.id)}
                      >
                        {isEnabled ? (
                          <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                        <p className="text-sm font-medium flex-1">{quest.content}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Quests Section */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
        <button
          onClick={() => setCustomQuestsExpanded(!customQuestsExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-display font-bold italic">Your Custom Quests</h2>
              <p className="text-sm text-muted-foreground">
                {quests?.length || 0} custom quests
              </p>
            </div>
          </div>
          {customQuestsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {customQuestsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/30"
            >
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search quests..." 
                      className="pl-10 rounded-full bg-secondary/30 border-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="rounded-full">
                    {selectedIds.length === filteredQuests.length ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                    Select All
                  </Button>
                  
                  {selectedIds.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="rounded-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedIds.length})
                    </Button>
                  )}
                </div>

                {quests?.length === 0 ? (
                  <div className="text-center py-16 bg-secondary/30 rounded-2xl border border-dashed border-border">
                    <ScrollText className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-3" />
                    <p className="text-muted-foreground">No custom quests yet. Add some above!</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    <AnimatePresence mode="popLayout">
                      {filteredQuests.map((quest) => (
                        <motion.div 
                          layout
                          key={quest.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                            selectedIds.includes(quest.id) ? "bg-secondary/40 border-border/50" : "bg-secondary/10 border-border/30 hover:bg-secondary/20"
                          )}
                        >
                          <button 
                            onClick={() => {
                              setSelectedIds(prev => prev.includes(quest.id) ? prev.filter(id => id !== quest.id) : [...prev, quest.id]);
                            }}
                            className="shrink-0"
                          >
                            {selectedIds.includes(quest.id) ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          
                          <p className="text-sm font-medium flex-1">{quest.content}</p>
                          
                          <Dialog open={editingQuest?.id === quest.id} onOpenChange={(open) => !open && setEditingQuest(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuest({ id: quest.id, content: quest.content });
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2rem]">
                              <DialogHeader>
                                <DialogTitle>Edit Quest</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Quest Content</Label>
                                  <Textarea
                                    value={editingQuest?.content || ""}
                                    onChange={(e) => setEditingQuest(prev => prev ? { ...prev, content: e.target.value } : null)}
                                    className="rounded-xl mt-2"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => setEditingQuest(null)} className="rounded-full">
                                    Cancel
                                  </Button>
                                  <Button onClick={handleEditQuest} className="rounded-full">
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                            onClick={() => deleteQuest(quest.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}