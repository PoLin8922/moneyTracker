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
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">尚無預算分配</p>
        </div>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.budgeted, 0);
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 150;

  // 計算每個扇形的起始和結束角度
  let currentAngle = -90; // 從頂部開始
  const segments = data.map(item => {
    const percentage = item.budgeted / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const usagePercentage = item.budgeted > 0 ? Math.min(1, item.used / item.budgeted) : 0;
    const innerRadius = usagePercentage * maxRadius; // 內圈半徑根據使用率變化
    
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
    const labelRadius = maxRadius + 30;
    const x = centerX + labelRadius * Math.cos(midRad);
    const y = centerY + labelRadius * Math.sin(midRad);
    
    // 線條起點（扇形外緣）
    const lineStartX = centerX + maxRadius * Math.cos(midRad);
    const lineStartY = centerY + maxRadius * Math.sin(midRad);
    
    // 文字錨點（左對齊或右對齊）
    const textAnchor = x > centerX ? 'start' : 'end';
    const textX = x + (textAnchor === 'start' ? 10 : -10);
    
    return { x, y, lineStartX, lineStartY, textX, textAnchor };
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">各類預算使用狀況</h3>

      <svg width="100%" height="500" viewBox="0 0 400 450">
        {/* 繪製扇形 */}
        {segments.map((segment, index) => (
          <g key={index}>
            {/* 底層（淺色） - 完整扇形 */}
            <path
              d={createArcPath({ ...segment, innerRadius: 0 })}
              fill={segment.color}
              opacity={0.25}
              stroke={segment.color}
              strokeWidth={1}
            />
            {/* 上層（深色） - 根據使用率變化的扇形 */}
            <path
              d={createArcPath(segment)}
              fill={segment.color}
              opacity={0.9}
              stroke={segment.color}
              strokeWidth={1}
            />
          </g>
        ))}

        {/* 繪製標籤 */}
        {segments.map((segment, index) => {
          const { x, y, lineStartX, lineStartY, textX, textAnchor } = getLabelPosition(segment);
          const usageText = `$${segment.used.toLocaleString()} / $${segment.budgeted.toLocaleString()}`;
          
          return (
            <g key={`label-${index}`}>
              {/* 連接線 */}
              <line
                x1={lineStartX}
                y1={lineStartY}
                x2={x}
                y2={y}
                stroke={segment.color}
                strokeWidth={1.5}
              />
              {/* 類別名稱 */}
              <text
                x={textX}
                y={y - 5}
                textAnchor={textAnchor}
                fill={segment.color}
                className="text-sm font-semibold"
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                {segment.name}
              </text>
              {/* 金額資訊 */}
              <text
                x={textX}
                y={y + 12}
                textAnchor={textAnchor}
                fill="currentColor"
                className="text-xs"
                style={{ fontSize: '11px' }}
                opacity={0.7}
              >
                {usageText}
              </text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}
