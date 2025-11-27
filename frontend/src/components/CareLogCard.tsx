import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Loader2 } from "lucide-react";

interface CareLogCardProps {
  type: "feeding" | "medication" | "activity";
  title: string;
  time: string;
  description: string;
  isEncrypted?: boolean;
  sensitiveInfo?: string;
  onDecrypt?: () => void;
  isDecrypting?: boolean;
}

const CareLogCard = ({ type, title, time, description, isEncrypted, sensitiveInfo, onDecrypt, isDecrypting }: CareLogCardProps) => {
  const getIcon = () => {
    switch (type) {
      case "feeding":
        return "🍽️";
      case "medication":
        return "💊";
      case "activity":
        return "🎾";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "feeding":
        return "bg-accent/20 text-accent-foreground";
      case "medication":
        return "bg-secondary/20 text-secondary-foreground";
      case "activity":
        return "bg-primary/20 text-primary";
    }
  };

  return (
    <Card className="p-4 bg-card shadow-soft border-border hover:shadow-elevated transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getIcon()}</span>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        </div>
        {isEncrypted && (
          <div className="p-1.5 rounded-full bg-primary/10">
            <Lock className="w-4 h-4 text-primary" />
          </div>
        )}
        {!isEncrypted && (
          <div className="p-1.5 rounded-full bg-muted/50">
            <Unlock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getTypeColor()}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </div>
      <p className="text-sm text-foreground/80 mb-2">{description}</p>
      {isEncrypted && (
        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Encrypted Data</span>
          </div>
          {sensitiveInfo ? (
            <p className="text-xs text-muted-foreground">{sensitiveInfo}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Data is encrypted</p>
          )}
          {onDecrypt && !sensitiveInfo && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDecrypt}
              disabled={isDecrypting}
              className="mt-2 w-full"
            >
              {isDecrypting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-2" />
                  Decrypt
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default CareLogCard;
