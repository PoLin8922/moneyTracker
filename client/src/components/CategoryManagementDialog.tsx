import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLedgerCategories, useDeleteLedgerCategory, useCreateLedgerCategory } from "@/hooks/useLedgerCategories";
import { useToast } from "@/hooks/use-toast";
import { getIconByName } from "@/lib/categoryIcons";
import { Plus, Trash2 } from "lucide-react";
import IconSelector from "@/components/IconSelector";

interface CategoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CategoryManagementDialog({ open, onOpenChange }: CategoryManagementDialogProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
  
  const { toast } = useToast();
  const { data: expenseCategories, isLoading: expenseLoading, error: expenseError } = useLedgerCategories("expense");
  const { data: incomeCategories, isLoading: incomeLoading, error: incomeError } = useLedgerCategories("income");
  const deleteLedgerCategory = useDeleteLedgerCategory();
  const createLedgerCategory = useCreateLedgerCategory();

  const categories = activeTab === "expense" ? expenseCategories : incomeCategories;
  const isLoading = activeTab === "expense" ? expenseLoading : incomeLoading;
  const error = activeTab === "expense" ? expenseError : incomeError;

  // Debug: 顯示資料載入狀態
  console.log('🔍 CategoryManagementDialog 狀態:');
  console.log('  activeTab:', activeTab);
  console.log('  expenseCategories:', expenseCategories);
  console.log('  incomeCategories:', incomeCategories);
  console.log('  isLoading:', isLoading);
  console.log('  error:', error);

  const handleDeleteClick = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteLedgerCategory.mutateAsync(categoryToDelete.id);
      toast({
        title: "類別已刪除",
        description: `「${categoryToDelete.name}」已從${activeTab === 'income' ? '收入' : '支出'}類別中移除`,
      });
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async (categoryName: string, iconName: string) => {
    if (!categoryName.trim()) return;

    try {
      // 預定義的顏色調色盤（確保視覺差異明顯）
      const colorPalette = [
        'hsl(25, 95%, 53%)',   // 橘色
        'hsl(217, 91%, 60%)',  // 藍色
        'hsl(280, 85%, 60%)',  // 紫色
        'hsl(340, 82%, 52%)',  // 粉紅色
        'hsl(0, 84%, 60%)',    // 紅色
        'hsl(262, 83%, 58%)',  // 深紫色
        'hsl(173, 80%, 40%)',  // 青色
        'hsl(221, 83%, 53%)',  // 深藍色
        'hsl(142, 76%, 36%)',  // 綠色
        'hsl(168, 76%, 42%)',  // 青綠色
        'hsl(45, 93%, 47%)',   // 黃色
        'hsl(16, 90%, 55%)',   // 深橘色
        'hsl(291, 64%, 42%)',  // 深紫色
        'hsl(199, 89%, 48%)',  // 天藍色
        'hsl(48, 89%, 60%)',   // 淺黃色
      ];
      
      // 獲取已使用的顏色
      const usedColors = categories?.map(c => c.color) || [];
      
      // 找出未使用的顏色
      const availableColors = colorPalette.filter(c => !usedColors.includes(c));
      
      // 如果有未使用的顏色，使用它；否則隨機選擇
      const color = availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : colorPalette[Math.floor(Math.random() * colorPalette.length)];

      await createLedgerCategory.mutateAsync({
        name: categoryName,
        type: activeTab,
        iconName: iconName,
        color: color,
      });

      toast({
        title: "類別已新增",
        description: `「${categoryName}」已加入${activeTab === 'income' ? '收入' : '支出'}類別`,
      });

      setIconSelectorOpen(false);
    } catch (error) {
      toast({
        title: "新增失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>類別管理</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expense" | "income")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">支出類別</TabsTrigger>
              <TabsTrigger value="income">收入類別</TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-4 mt-4">
              <Button
                onClick={() => setIconSelectorOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增支出類別
              </Button>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-2">❌ 載入失敗</p>
                  <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : '請稍後再試'}</p>
                  <p className="text-xs text-muted-foreground mt-2">請確認您已登入</p>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((category) => {
                    const IconComponent = getIconByName(category.iconName);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color }}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(category.id, category.name)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  尚無支出類別，點擊上方按鈕新增
                </div>
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-4">
              <Button
                onClick={() => setIconSelectorOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增收入類別
              </Button>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-2">❌ 載入失敗</p>
                  <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : '請稍後再試'}</p>
                  <p className="text-xs text-muted-foreground mt-2">請確認您已登入</p>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((category) => {
                    const IconComponent = getIconByName(category.iconName);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color }}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(category.id, category.name)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  尚無收入類別，點擊上方按鈕新增
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Icon Selector Dialog */}
      <IconSelector
        open={iconSelectorOpen}
        onOpenChange={setIconSelectorOpen}
        onSelect={handleAddCategory}
        directToCustom={true}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此類別嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除「{categoryToDelete?.name}」類別後，相關的預算分配和存錢罐設定也會受到影響。
              已經記錄的交易不會被刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
