import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, User, Globe, DollarSign, Bell, Lock, HelpCircle } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">設定</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">帳戶設定</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover-elevate rounded-lg cursor-pointer" data-testid="button-profile">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">個人資料</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-3 hover-elevate rounded-lg cursor-pointer" data-testid="button-security">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">安全性</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">偏好設定</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                語言
              </Label>
              <Select defaultValue="zh-TW">
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                預設幣別
              </Label>
              <Select defaultValue="TWD">
                <SelectTrigger id="currency" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">台幣 (TWD)</SelectItem>
                  <SelectItem value="USD">美元 (USD)</SelectItem>
                  <SelectItem value="JPY">日幣 (JPY)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 hover-elevate rounded-lg cursor-pointer" data-testid="button-notifications">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">通知設定</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">其他</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover-elevate rounded-lg cursor-pointer" data-testid="button-help">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">說明與回饋</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <Button 
              variant="destructive" 
              className="w-full" 
              data-testid="button-logout"
              onClick={() => window.location.href = "/api/logout"}
            >
              登出
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>錢跡 MoneyTrack v1.0.0</p>
          <p className="mt-1">Track your money, shape your future</p>
        </div>
      </div>
    </div>
  );
}
