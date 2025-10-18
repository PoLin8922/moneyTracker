import { Card } from "@/components/ui/card";

interface CategoryData {
  name: string;
  budgeted: number;
  used: number;
  color: string;
}

interface BudgetUsageDonutChartProps {
  data: CategoryData[];
  totalDisposable: number;
}

export default function BudgetUsageDonutChart({ data, totalDisposable }: BudgetUsageDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">各類預算使用狀況</h3>
        <div className="flex items-center justify-center h-[240px]">
          <p className="text-muted-foreground">尚無預算分配</p>
        </div>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.budgeted, 0);
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 70; // 與第一頁的 outerRadius 一致

  // 計算每個扇形的起始和結束角度
  let currentAngle = -90; // 從頂部開始
  const segments = data.map(item => {
    const percentage = item.budgeted / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const usagePercentage = item.budgeted > 0 ? Math.min(1, item.used / item.budgeted) : 0;
    
    // 按面積計算半徑：面積比 = 半徑平方比
    // innerRadius² / maxRadius² = usagePercentage
    // innerRadius = maxRadius * √usagePercentage
    const innerRadius = maxRadius * Math.sqrt(usagePercentage);
    
    currentAngle = endAngle;
    
    return {
      ...item,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
      innerRadius,
      outerRadius: maxRadius,
      usagePercentage,
    };
  });

  // 繪製扇形路徑
  const createArcPath = (segment: any) => {
    const { startAngle, endAngle, innerRadius, outerRadius } = segment;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // 外圈的起點和終點
    const x1 = centerX + outerRadius * Math.cos(startRad);
    const y1 = centerY + outerRadius * Math.sin(startRad);
    const x2 = centerX + outerRadius * Math.cos(endRad);
    const y2 = centerY + outerRadius * Math.sin(endRad);

    // 內圈的起點和終點
    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  // 計算標籤位置
  const getLabelPosition = (segment: any) => {
    const midRad = (segment.midAngle * Math.PI) / 180;
    const labelRadius = maxRadius + 20;
    const x = centerX + labelRadius * Math.cos(midRad);
    const y = centerY + labelRadius * Math.sin(midRad);
    
    // 線條起點（扇形外緣）
    const lineStartX = centerX + maxRadius * Math.cos(midRad);
    const lineStartY = centerY + maxRadius * Math.sin(midRad);
    
    // 文字錨點（左對齊或右對齊）
    const textAnchor = x > centerX ? 'start' : 'end';
    const textX = x + (textAnchor === 'start' ? 5 : -5);
    
    return { x, y, lineStartX, lineStartY, textX, textAnchor };
  };

  // 將顏色轉為更深的版本（用於內圈）
  const getDarkerColor = (color: string) => {
    // 如果是 hsl 格式，降低亮度
    if (color.startsWith('hsl(')) {
      // 簡單處理：在現有顏色上疊加較低的透明度來模擬更深的效果
      return color;
    }
    return color;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">各類預算使用狀況</h3>

      <div className="flex items-start gap-6">
        {/* 左側：圓餅圖 */}
        <div className="flex-shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* 繪製扇形 */}
            {segments.map((segment, index) => (
              <g key={index}>
                {/* 底層（淺色） - 完整扇形 */}
                <path
                  d={createArcPath({ ...segment, innerRadius: 0 })}
                  fill={segment.color}
                  opacity={0.2}
                  stroke={segment.color}
                  strokeWidth={0.5}
                />
                {/* 上層（深色） - 根據使用率變化的扇形 */}
                <path
                  d={createArcPath(segment)}
                  fill={segment.color}
                  opacity={1}
                  stroke={segment.color}
                  strokeWidth={1}
                />
              </g>
            ))}

            {/* 繪製連接線 */}
            {segments.map((segment, index) => {
              const { x, y, lineStartX, lineStartY } = getLabelPosition(segment);
              
              return (
                <g key={`line-${index}`}>
                  <line
                    x1={lineStartX}
                    y1={lineStartY}
                    x2={x}
                    y2={y}
                    stroke={segment.color}
                    strokeWidth={0.8}
                    opacity={0.5}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 右側：類別圖例 */}
        <div className="flex-1 space-y-3">
          {segments.map((segment, index) => {
            const percentage = (segment.usagePercentage * 100).toFixed(0);
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-medium text-sm">{segment.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${segment.used.toLocaleString()} / ${segment.budgeted.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    使用率 {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
