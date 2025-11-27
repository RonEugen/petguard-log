import { Card } from "@/components/ui/card";
import petSilhouette from "@/assets/pet-silhouette.png";

const PetProfile = () => {
  return (
    <Card className="p-6 bg-gradient-card shadow-elevated border-border">
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-pastel p-1">
          <img 
            src={petSilhouette} 
            alt="Pet silhouette" 
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground mb-2">Buddy</h2>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>🐕 Golden Retriever</span>
            <span>📅 3 years old</span>
            <span>⚖️ 65 lbs</span>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Active
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-medium">
              Healthy
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PetProfile;
