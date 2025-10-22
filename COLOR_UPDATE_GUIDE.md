# 顏色更新指南

## 問題
現有類別可能都使用相同的顏色（藍紫色），導致難以區分。

## 原因
舊的類別使用舊的顏色系統（如 `hsl(var(--chart-1))`），需要更新為新的 HSL 顏色。

## 解決方案

### 立即修復（推薦）

在 **Neon SQL Editor** 執行以下 SQL：

```sql
-- Budget Categories - 分配不同顏色
UPDATE budget_categories 
SET color = (
  ARRAY[
    'hsl(220, 88%, 63%)', 'hsl(200, 85%, 58%)', 'hsl(180, 75%, 52%)', 'hsl(160, 72%, 48%)',
    'hsl(140, 75%, 45%)', 'hsl(90, 70%, 52%)', 'hsl(60, 82%, 58%)', 'hsl(40, 85%, 58%)',
    'hsl(20, 88%, 60%)', 'hsl(0, 82%, 62%)', 'hsl(340, 75%, 58%)', 'hsl(320, 70%, 60%)',
    'hsl(280, 75%, 62%)', 'hsl(260, 72%, 58%)', 'hsl(240, 78%, 60%)', 'hsl(210, 85%, 55%)',
    'hsl(190, 78%, 50%)', 'hsl(170, 68%, 48%)', 'hsl(120, 65%, 48%)', 'hsl(50, 88%, 55%)'
  ]
)[
  1 + (
    (SELECT COUNT(*) FROM budget_categories b2 WHERE b2.created_at < budget_categories.created_at)
    % 20
  )
];

-- Savings Jar Categories - 分配不同顏色
UPDATE savings_jar_categories 
SET color = (
  ARRAY[
    'hsl(220, 88%, 63%)', 'hsl(200, 85%, 58%)', 'hsl(180, 75%, 52%)', 'hsl(160, 72%, 48%)',
    'hsl(140, 75%, 45%)', 'hsl(90, 70%, 52%)', 'hsl(60, 82%, 58%)', 'hsl(40, 85%, 58%)',
    'hsl(20, 88%, 60%)', 'hsl(0, 82%, 62%)', 'hsl(340, 75%, 58%)', 'hsl(320, 70%, 60%)',
    'hsl(280, 75%, 62%)', 'hsl(260, 72%, 58%)', 'hsl(240, 78%, 60%)', 'hsl(210, 85%, 55%)',
    'hsl(190, 78%, 50%)', 'hsl(170, 68%, 48%)', 'hsl(120, 65%, 48%)', 'hsl(50, 88%, 55%)'
  ]
)[
  1 + (
    (
      (SELECT COUNT(*) FROM budget_categories) +
      (SELECT COUNT(*) FROM savings_jar_categories s2 WHERE s2.created_at < savings_jar_categories.created_at)
    ) % 20
  )
];
```

### 驗證更新

執行後可運行以下查詢確認：

```sql
SELECT name, color FROM budget_categories ORDER BY created_at;
SELECT name, color FROM savings_jar_categories ORDER BY created_at;
```

## 顏色方案

新的顏色系統基於主題藍色 (220°) 的色輪漸變：

1. 🔵 主題藍色 - hsl(220, 88%, 63%)
2. 🔵 天藍色 - hsl(200, 85%, 58%)
3. 🔵 青色 - hsl(180, 75%, 52%)
4. 🟢 青綠色 - hsl(160, 72%, 48%)
5. 🟢 翠綠色 - hsl(140, 75%, 45%)
6. 🟢 黃綠色 - hsl(90, 70%, 52%)
7. 🟡 金黃色 - hsl(60, 82%, 58%)
8. 🟡 橙黃色 - hsl(40, 85%, 58%)
9. 🟠 橘色 - hsl(20, 88%, 60%)
10. 🔴 紅色 - hsl(0, 82%, 62%)
11. 🔴 玫瑰紅 - hsl(340, 75%, 58%)
12. 🟣 洋紅色 - hsl(320, 70%, 60%)
13. 🟣 紫色 - hsl(280, 75%, 62%)
14. 🟣 深紫色 - hsl(260, 72%, 58%)
15. 🟣 藍紫色 - hsl(240, 78%, 60%)
16. 🔵 湛藍色 - hsl(210, 85%, 55%)
17. 🔵 湖藍色 - hsl(190, 78%, 50%)
18. 🟢 綠松石色 - hsl(170, 68%, 48%)
19. 🟢 草綠色 - hsl(120, 65%, 48%)
20. 🟡 檸檬黃 - hsl(50, 88%, 55%)

## 效果

執行後，每個類別將自動獲得不同的顏色，按創建順序循環使用 20 種顏色。

## 新建類別

從現在開始，新建的類別會自動：
1. 檢查是否有重複名稱（使用相同顏色）
2. 否則分配下一個未使用的顏色
3. 確保每個類別都有獨特的視覺識別
