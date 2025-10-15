import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useCreateSavingsJarCategory, useUpdateSavingsJarCategory, useDeleteSavingsJarCategory } from "@/hooks/useSavingsJarCategories";
import type { SavingsJarCategory } from "@shared/schema";

interface SavingsJarAllocationProps {
  totalAmount: number;
  jarId: string;
  categories: SavingsJarCategory[];
}

const categoryColors = [
  "#F7F9F9", "#E4F1F6", "#D9F2E6", "#BEE3F8", 
  "#A8E6CF", "#C7CEEA", "#FDE2E4", "#F6E7CB",
];

export default function SavingsJarAllocation({
  totalAmount,
  jarId,
  categories,
}: SavingsJarAllocationProps) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const createCategory = useCreateSavingsJarCategory();
  const updateCategory = useUpdateSavingsJarCategory();
  const deleteCategory = useDeleteSavingsJarCategory();

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleSliderChange = (id: string, value: number[]) => {
    const newValue = value[0];
    setLocalCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, percentage: newValue } : cat
      )
    );
  };

  const handleSliderCommit = async (id: string, value: number[]) => {
    const newValue = value[0];
    await updateCategory.mutateAsync({
      id,
      data: { percentage: newValue },
    });
  };

  const handleAddCategory = async () => {
    if (!jarId || !newCategoryName.trim()) return;

    const usedColors = new Set(categories.map(c => c.color));
    const color = categoryColors.find(c => !usedColors.has(c)) || categoryColors[0];

    await createCategory.mutateAsync({
      jarId,
      data: {
        name: newCategoryName.trim(),
        percentage: 0,
        color,
      },
    });

    setNewCategoryName("");
    setDialogOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory.mutateAsync(id);
  };

  const totalPercentage = localCategories.reduce((sum, cat) => sum + cat.percentage, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">類別分配</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid="button-add-jar-category">
              <Plus className="w-4 h-4 mr-1" />
              新增類別
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增類別</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>類別名稱</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="例如：旅遊、緊急預備金"
                  data-testid="input-jar-category-name"
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full" data-testid="button-save-jar-category">
                新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {localCategories.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">尚無分配類別</p>
      ) : (
        <div className="space-y-6">
          {localCategories
            .sort((a, b) => b.percentage - a.percentage)
            .map((category) => {
              const amount = (totalAmount * category.percentage) / 100;
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        NT$ {amount.toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        data-testid={`button-delete-jar-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[category.percentage]}
                      onValueChange={(value) => handleSliderChange(category.id, value)}
                      onValueCommit={(value) => handleSliderCommit(category.id, value)}
                      max={100}
                      step={1}
                      className="flex-1"
                      data-testid={`slider-jar-${category.id}`}
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">總計</span>
              <span className={`font-semibold ${totalPercentage > 100 ? 'text-destructive' : ''}`}>
                {totalPercentage}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
