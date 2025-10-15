import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DisposableIncomeTrendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HistoryData {
  month: string;
  disposableIncome: number;
  remaining: number;
}

export default function DisposableIncomeTrendDialog({
  open,
  onOpenChange,
}: DisposableIncomeTrendDialogProps) {
  const { data: history, isLoading } = useQuery<HistoryData[]>({
    queryKey: ['/api/budgets/history/disposable-income'],
    enabled: open,
  });

  const chartData = history?.map(item => ({
    month: item.month,
    可支配金額: item.disposableIncome,
    剩餘金額: item.remaining,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>可支配金額歷史趨勢</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">載入中...</div>
        ) : !history || history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">暫無歷史數據</div>
        ) : (
          <div className="space-y-6">
            <Card className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => `NT$ ${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="可支配金額"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="剩餘金額"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-3))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid gap-2">
              <h3 className="font-semibold">歷史記錄</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((item) => (
                  <Card key={item.month} className="p-3" data-testid={`history-item-${item.month}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.month}</span>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">可支配：</span>
                          <span className="font-semibold ml-1">
                            NT$ {item.disposableIncome.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">剩餘：</span>
                          <span
                            className={`font-semibold ml-1 ${
                              item.remaining >= 0 ? "text-chart-3" : "text-destructive"
                            }`}
                          >
                            NT$ {item.remaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
