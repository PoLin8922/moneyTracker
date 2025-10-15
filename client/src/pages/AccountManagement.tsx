import { ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAssets } from "@/hooks/useAssets";
import { useLocation } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";

export default function AccountManagement() {
  const [, setLocation] = useLocation();
  const { data: accounts, isLoading } = useAssets();

  const groupedAccounts = accounts?.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">帳戶管理</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Button 
          className="w-full" 
          onClick={() => setLocation("/account-management/add")}
          data-testid="button-add-account"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加帳戶
        </Button>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">載入中...</div>
        ) : accounts && accounts.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedAccounts || {}).map(([type, typeAccounts]) => (
              <Card key={type} className="p-4">
                <h3 className="font-semibold mb-3 text-lg">{type}</h3>
                <div className="space-y-2">
                  {typeAccounts?.map((account) => {
                    const twd = account.currency === "TWD" 
                      ? parseFloat(account.balance)
                      : parseFloat(account.balance) * parseFloat(account.exchangeRate || "1");
                    
                    return (
                      <div
                        key={account.id}
                        onClick={() => setLocation(`/account-management/edit/${account.id}`)}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover-elevate cursor-pointer"
                        data-testid={`account-${account.accountName}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{account.accountName}</p>
                          {account.note && (
                            <p className="text-xs text-muted-foreground mt-1">{account.note}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {account.currency} {parseFloat(account.balance).toLocaleString()}
                            {account.currency !== "TWD" && ` × ${account.exchangeRate}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">NT$ {twd.toLocaleString()}</p>
                          {account.includeInTotal === "false" && (
                            <p className="text-xs text-muted-foreground">不計入總資產</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">尚未新增任何帳戶</p>
            <Button onClick={() => setLocation("/account-management/add")}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一個帳戶
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
