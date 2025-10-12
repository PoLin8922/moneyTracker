import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PiggyBankIcon from "@/components/PiggyBankIcon";
import { TrendingUp, PieChart, BookOpen, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <PiggyBankIcon netWorth={500000} className="mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">錢跡 MoneyTrack</h1>
          <p className="text-xl text-muted-foreground mb-8">
            追蹤你的金錢，塑造你的未來
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            data-testid="button-login"
            className="text-lg px-8 py-6"
          >
            開始使用
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card className="p-6 text-center hover-elevate">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">資產總覽</h3>
            <p className="text-sm text-muted-foreground">
              即時查看您的總資產與趨勢圖
            </p>
          </Card>

          <Card className="p-6 text-center hover-elevate">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">現金流規劃</h3>
            <p className="text-sm text-muted-foreground">
              智慧分配預算，掌控每月收支
            </p>
          </Card>

          <Card className="p-6 text-center hover-elevate">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">記帳本</h3>
            <p className="text-sm text-muted-foreground">
              簡單記錄，清楚了解金錢流向
            </p>
          </Card>

          <Card className="p-6 text-center hover-elevate">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">投資組合</h3>
            <p className="text-sm text-muted-foreground">
              追蹤股票、加密貨幣損益
            </p>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>專為台灣人設計的理財應用</p>
          <p className="mt-2">支援台幣、美元、日幣等多幣別管理</p>
        </div>
      </div>
    </div>
  );
}
