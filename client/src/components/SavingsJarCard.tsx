import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { PiggyBank, Settings } from "lucide-react";
import type { SavingsJar } from "@shared/schema";
import { useUpdateSavingsJar } from "@/hooks/useSavingsJars";

interface SavingsJarCardProps {
  jar: SavingsJar;
  onOpenSettings: () => void;
}

export default function SavingsJarCard({ jar, onOpenSettings }: SavingsJarCardProps) {
  const updateJar = useUpdateSavingsJar();
  
  const current = parseFloat(jar.currentAmount);
  const target = parseFloat(jar.targetAmount);
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isIncluded = jar.includeInDisposable === "true";

  const handleToggleInclude = async () => {
    await updateJar.mutateAsync({
      id: jar.id,
      data: { includeInDisposable: isIncluded ? "false" : "true" }
    });
  };

  return (
    <Card className="p-6 hover-elevate active-elevate-2 cursor-pointer" onClick={onOpenSettings}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <PiggyBank className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg" data-testid={`text-jar-name-${jar.id}`}>{jar.name}</h3>
            <p className="text-sm text-muted-foreground">
              NT$ {current.toLocaleString()} / {target.toLocaleString()}
            </p>
          </div>
        </div>
        <Button 
          size="icon" 
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          data-testid={`button-settings-${jar.id}`}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar with animation */}
      <div className="mb-4">
        <Progress 
          value={percentage} 
          className="h-3"
          data-testid={`progress-${jar.id}`}
        />
        <motion.p 
          className="text-sm text-muted-foreground mt-2 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {percentage.toFixed(1)}% 完成
        </motion.p>
      </div>

      {/* Include in disposable income switch */}
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm text-muted-foreground">計入可支配收入</span>
        <Switch
          checked={isIncluded}
          onCheckedChange={handleToggleInclude}
          onClick={(e) => e.stopPropagation()}
          data-testid={`switch-include-${jar.id}`}
        />
      </div>
    </Card>
  );
}
