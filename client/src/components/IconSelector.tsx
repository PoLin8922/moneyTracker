import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AVAILABLE_ICONS, DEFAULT_CATEGORIES, getIconByName } from "@/lib/categoryIcons";
import { cn } from "@/lib/utils";

interface IconSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (categoryName: string, iconName: string) => void;
}

export default function IconSelector({ open, onOpenChange, onSelect }: IconSelectorProps) {
  const [customName, setCustomName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePresetSelect = (categoryName: string, iconName: string) => {
    onSelect(categoryName, iconName);
    onOpenChange(false);
  };

  const handleCustomSubmit = () => {
    if (customName.trim() && selectedIcon) {
      onSelect(customName.trim(), selectedIcon);
      setCustomName("");
      setSelectedIcon("");
      setShowCustomInput(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>選擇類別</DialogTitle>
        </DialogHeader>

        {!showCustomInput ? (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-3 gap-3">
                {/* 預設類別 */}
                {DEFAULT_CATEGORIES.map((cat, index) => {
                  const Icon = getIconByName(cat.iconName);
                  return (
                    <button
                      key={index}
                      onClick={() => handlePresetSelect(cat.name, cat.iconName)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 transition-all"
                    >
                      <Icon className="w-8 h-8" />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </button>
                  );
                })}
                
                {/* 自定義類別按鈕 */}
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-2xl">
                    +
                  </div>
                  <span className="text-sm font-medium">自訂類別</span>
                </button>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>類別名稱</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="例如：咖啡、健身、寵物"
              />
            </div>

            <div>
              <Label>選擇圖標</Label>
              <ScrollArea className="h-[300px] mt-2 border rounded-lg p-4">
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((iconItem, index) => {
                    const Icon = iconItem.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedIcon(iconItem.name)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:bg-accent",
                          selectedIcon === iconItem.name
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                        title={iconItem.name}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-[10px] truncate w-full text-center">
                          {iconItem.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomName("");
                  setSelectedIcon("");
                }}
                className="flex-1"
              >
                返回
              </Button>
              <Button
                onClick={handleCustomSubmit}
                disabled={!customName.trim() || !selectedIcon}
                className="flex-1"
              >
                確認
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
