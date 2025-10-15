import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAssets } from "@/hooks/useAssets";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AccountFormDialog from "@/components/AccountFormDialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountManagementDialog({ open, onOpenChange }: AccountManagementDialogProps) {
  const { data: accounts, isLoading } = useAssets();
  const { toast } = useToast();
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>(undefined);

  const handleEdit = (accountId: string) => {
    setEditingAccountId(accountId);
    setAccountFormOpen(true);
  };

  const handleDelete = async (accountId: string, accountName: string) => {
    if (!confirm(`確定要刪除帳戶「${accountName}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${accountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      toast({
        title: "刪除成功",
        description: "帳戶已刪除",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    }
  };

  const groupedAccounts = accounts?.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>帳戶管理</DialogTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingAccountId(undefined);
                  setAccountFormOpen(true);
                }}
                data-testid="button-add-account"
              >
                <Plus className="w-4 h-4 mr-1" />
                新增帳戶
              </Button>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">尚未新增任何帳戶</p>
              <p className="text-sm text-muted-foreground mt-2">點擊上方按鈕開始新增</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAccounts || {}).map(([type, typeAccounts]) => (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{type}</h3>
                  <div className="space-y-2">
                    {typeAccounts.map((account) => (
                      <Card key={account.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{account.accountName}</h4>
                              {account.includeInTotal === "false" && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  不計入總資產
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {account.currency} {parseFloat(account.balance).toLocaleString()}
                              {account.currency !== "TWD" && account.exchangeRate && (
                                <span className="ml-2">
                                  ≈ NT$ {(parseFloat(account.balance) * parseFloat(account.exchangeRate)).toLocaleString()}
                                </span>
                              )}
                            </p>
                            {account.note && (
                              <p className="text-xs text-muted-foreground mt-1">{account.note}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(account.id)}
                              data-testid={`button-edit-${account.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(account.id, account.accountName)}
                              data-testid={`button-delete-${account.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AccountFormDialog
        open={accountFormOpen}
        onOpenChange={setAccountFormOpen}
        accountId={editingAccountId}
      />
    </>
  );
}
