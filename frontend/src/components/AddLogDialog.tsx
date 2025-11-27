import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { usePetGuard } from "@/hooks/usePetGuard";

const AddLogDialog = () => {
  const [open, setOpen] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [logType, setLogType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sensitiveData, setSensitiveData] = useState("");
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { createCareLog, isPending, isConfirming, isSuccess, hash, error } = usePetGuard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "Wallet required",
        description: "Please connect your wallet to create care logs.",
        variant: "destructive",
      });
      return;
    }

    if (!logType || !title || !description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isEncrypted && !sensitiveData) {
      toast({
        title: "Sensitive data required",
        description: "Please enter sensitive data or disable encryption.",
        variant: "destructive",
      });
      return;
    }

    try {
      const typeMap: Record<string, number> = {
        feeding: 0,
        medication: 1,
        activity: 2,
      };

      const sensitiveValue = isEncrypted && sensitiveData ? parseInt(sensitiveData, 10) : undefined;
      
      if (isEncrypted && (isNaN(sensitiveValue!) || sensitiveValue! < 0)) {
        toast({
          title: "Invalid sensitive data",
          description: "Sensitive data must be a valid positive number.",
          variant: "destructive",
        });
        return;
      }

      await createCareLog(typeMap[logType], title, description, sensitiveValue);

      toast({
        title: "Transaction submitted",
        description: "Your care log is being created on the blockchain...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create care log.",
        variant: "destructive",
      });
    }
  };

  // Reset form and close dialog on success
  useEffect(() => {
    if (isSuccess && open) {
      const wasEncrypted = isEncrypted;
      setOpen(false);
      setLogType("");
      setTitle("");
      setDescription("");
      setSensitiveData("");
      setIsEncrypted(false);
      toast({
        title: "Care log created",
        description: wasEncrypted ? "Your encrypted log has been saved securely on-chain." : "Your log has been saved on-chain.",
      });
    }
  }, [isSuccess, open, toast]);

  // Show error if transaction fails
  useEffect(() => {
    if (error && open) {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to create care log. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, open, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
          <Plus className="w-4 h-4" />
          Add Care Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Add Care Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feeding">🍽️ Feeding</SelectItem>
                <SelectItem value="medication">💊 Medication</SelectItem>
                <SelectItem value="activity">🎾 Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="e.g., Morning feeding" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Add details about this care log..." 
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <div>
                <Label htmlFor="encrypt" className="cursor-pointer font-medium">Encrypt sensitive data</Label>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Only you can decrypt this information" : "Wallet connection required"}
                </p>
              </div>
            </div>
            <Switch 
              id="encrypt" 
              checked={isEncrypted} 
              onCheckedChange={setIsEncrypted}
              disabled={!isConnected}
            />
          </div>

          {!isConnected && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/20 border border-accent/30 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-accent-foreground mt-0.5" />
              <p className="text-xs text-accent-foreground">
                Connect your wallet to enable encryption for sensitive care data
              </p>
            </div>
          )}


          {isEncrypted && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="sensitive">Sensitive Information (Number)</Label>
              <Input 
                id="sensitive" 
                type="number"
                placeholder="e.g., 100 (for dosage in mg, weight in kg, etc.)"
                className="bg-primary/5 border-primary/20" 
                value={sensitiveData}
                onChange={(e) => setSensitiveData(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Enter a numeric value that will be encrypted. This could represent dosage, weight, or any sensitive metric.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isPending || isConfirming || !isConnected}
          >
            {(isPending || isConfirming) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isPending ? "Preparing transaction..." : "Confirming..."}
              </>
            ) : (
              "Save Care Log"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLogDialog;
