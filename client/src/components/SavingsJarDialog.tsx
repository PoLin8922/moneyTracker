import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import { useCreateSavingsJarDeposit, useSavingsJarDeposits } from "@/hooks/useSavingsJarDeposits";
import { useSavingsJarCategories } from "@/hooks/useSavingsJarCategories";
import SavingsJarAllocation from "@/components/SavingsJarAllocation";
import type { SavingsJar } from "@shared/schema";
import { Trash2, CalendarIcon } from "lucide-react";
import { useDeleteSavingsJar } from "@/hooks/useSavingsJars";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SavingsJarDialogProps {
  jar: SavingsJar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SavingsJarDialog({ jar, open, onOpenChange }: SavingsJarDialogProps) {
  const { toast } = useToast();
  const { data: accounts } = useAssets();
  const { data: categories } = useSavingsJarCategories(jar?.id);
  const { data: deposits } = useSavingsJarDeposits(jar?.id);
  const createDeposit = useCreateSavingsJarDeposit();
  const deleteJar = useDeleteSavingsJar();
  
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccount, setDepositAccount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositDate, setDepositDate] = useState<Date>(new Date());

  if (!jar) return null;

  const current = parseFloat(jar.currentAmount);
  const target = parseFloat(jar.targetAmount);

  const handleAddDeposit = async () => {
    if (!depositAmount || !depositAccount) {
      toast({
        title: "錯誤",
        description: "請填寫存款金額和選擇帳戶",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeposit.mutateAsync({
        jarId: jar.id,
        data: {
          amount: depositAmount,
          accountId: depositAccount,
          note: depositNote,
          depositDate: format(depositDate, 'yyyy-MM-dd'),
        },
      });

      toast({
        title: "成功",
        description: "存款記錄已新增",
      });

      setDepositAmount("");
      setDepositAccount("");
      setDepositNote("");
      setDepositDate(new Date());
    } catch (error) {
      toast({
        title: "錯誤",
        description: "新增存款失敗",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`確定要刪除「${jar.name}」存錢罐嗎？`)) return;
    
    try {
      await deleteJar.mutateAsync(jar.id);
      toast({
        title: "成功",
        description: "存錢罐已刪除",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "錯誤",
        description: "刪除存錢罐失敗",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{jar.name}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              data-testid="button-delete-jar"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground mb-1">目前金額 / 目標金額</p>
            <p className="text-2xl font-bold">
              NT$ {current.toLocaleString()} / {target.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              還需 NT$ {Math.max(0, target - current).toLocaleString()}
            </p>
          </div>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">新增存款</TabsTrigger>
            <TabsTrigger value="allocation">類別分配</TabsTrigger>
            <TabsTrigger value="history">歷史記錄</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>存款金額</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  data-testid="input-deposit-amount"
                />
              </div>

              <div>
                <Label>來源帳戶</Label>
                <Select value={depositAccount} onValueChange={setDepositAccount}>
                  <SelectTrigger data-testid="select-deposit-account">
                    <SelectValue placeholder="選擇帳戶" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>存款日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !depositDate && "text-muted-foreground"
                      )}
                      data-testid="button-deposit-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {depositDate ? format(depositDate, 'yyyy年M月d日', { locale: zhTW }) : <span>選擇日期</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={depositDate}
                      onSelect={(date) => date && setDepositDate(date)}
                      initialFocus
                      locale={zhTW}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>備註（選填）</Label>
                <Input
                  placeholder="備註說明"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  data-testid="input-deposit-note"
                />
              </div>

              <Button 
                onClick={handleAddDeposit}
                className="w-full"
                disabled={createDeposit.isPending}
                data-testid="button-add-deposit"
              >
                {createDeposit.isPending ? "新增中..." : "新增存款"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="allocation" className="mt-4">
            <SavingsJarAllocation
              totalAmount={current}
              jarId={jar.id}
              categories={categories || []}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-2">
              {!deposits || deposits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">尚無存款記錄</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {deposits
                    .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
                    .map((deposit) => {
                      const account = accounts?.find(acc => acc.id === deposit.accountId);
                      const amount = parseFloat(deposit.amount);
                      
                      return (
                        <div
                          key={deposit.id}
                          className="p-4 border rounded-md hover-elevate"
                          data-testid={`deposit-record-${deposit.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-lg">
                                  NT$ {amount.toLocaleString()}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(deposit.depositDate), 'yyyy年M月d日', { locale: zhTW })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                來源：{account ? `${account.accountName} (${account.type})` : '未知帳戶'}
                              </p>
                              {deposit.note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  備註：{deposit.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
