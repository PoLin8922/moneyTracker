import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCreateSavingsJar } from "@/hooks/useSavingsJars";

interface CreateSavingsJarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateSavingsJarDialog({ open, onOpenChange }: CreateSavingsJarDialogProps) {
  const { toast } = useToast();
  const createJar = useCreateSavingsJar();
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !targetAmount) {
      toast({
        title: "錯誤",
        description: "請填寫存錢罐名稱和目標金額",
        variant: "destructive",
      });
      return;
    }

    try {
      await createJar.mutateAsync({
        name: name.trim(),
        targetAmount: targetAmount,
        currentAmount: "0",
        includeInDisposable: "false",
      });

      toast({
        title: "成功",
        description: "存錢罐已創建",
      });

      setName("");
      setTargetAmount("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "錯誤",
        description: "創建存錢罐失敗",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>創建新存錢罐</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>存錢罐名稱</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：旅遊基金、買房頭期款"
              data-testid="input-jar-name"
            />
          </div>

          <div>
            <Label>目標金額</Label>
            <Input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0"
              data-testid="input-jar-target"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleCreate}
            disabled={createJar.isPending}
            data-testid="button-create-jar"
          >
            {createJar.isPending ? "創建中..." : "創建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
