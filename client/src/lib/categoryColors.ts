// 統一的類別顏色管理系統
// 確保所有類別（預算類別 + 存錢罐類別）使用不同的顏色

export const CATEGORY_COLORS = [
  "hsl(var(--chart-1))", // 藍色
  "hsl(var(--chart-2))", // 綠色
  "hsl(var(--chart-3))", // 黃色
  "hsl(var(--chart-4))", // 紅色
  "hsl(var(--chart-5))", // 紫色
  "hsl(210, 70%, 50%)",  // 天藍色
  "hsl(150, 60%, 45%)",  // 青綠色
  "hsl(30, 85%, 55%)",   // 橙色
  "hsl(340, 75%, 55%)",  // 粉紅色
  "hsl(280, 65%, 55%)",  // 紫羅蘭色
  "hsl(180, 60%, 50%)",  // 青色
  "hsl(45, 80%, 55%)",   // 金黃色
  "hsl(15, 75%, 50%)",   // 橘紅色
  "hsl(120, 50%, 45%)",  // 草綠色
  "hsl(200, 70%, 50%)",  // 藍綠色
  "hsl(300, 60%, 55%)",  // 洋紅色
  "hsl(60, 70%, 50%)",   // 檸檬黃
  "hsl(330, 70%, 55%)",  // 玫瑰色
  "hsl(90, 55%, 45%)",   // 黃綠色
  "hsl(270, 65%, 55%)",  // 深紫色
];

/**
 * 獲取下一個可用的顏色（避免與已使用的顏色重複）
 * @param usedColors 已使用的顏色數組
 * @returns 下一個可用的顏色
 */
export function getNextAvailableColor(usedColors: string[]): string {
  for (const color of CATEGORY_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  // 如果所有顏色都用完了，返回第一個顏色（理論上不應該發生）
  return CATEGORY_COLORS[0];
}

/**
 * 獲取所有已使用的顏色（從預算類別和存錢罐類別中）
 * @param budgetCategories 預算類別
 * @param savingsJarCategories 存錢罐類別
 * @returns 已使用的顏色數組
 */
export function getUsedColors(
  budgetCategories: Array<{ color: string }> = [],
  savingsJarCategories: Array<{ color: string }> = []
): string[] {
  const allCategories = [...budgetCategories, ...savingsJarCategories];
  return allCategories.map(cat => cat.color);
}

/**
 * 檢查類別名稱是否已存在（在預算類別或存錢罐類別中）
 * @param categoryName 類別名稱
 * @param budgetCategories 預算類別
 * @param savingsJarCategories 存錢罐類別
 * @returns 如果存在則返回該類別的顏色，否則返回 null
 */
export function getExistingCategoryColor(
  categoryName: string,
  budgetCategories: Array<{ name: string; color: string }> = [],
  savingsJarCategories: Array<{ name: string; color: string }> = []
): string | null {
  const allCategories = [...budgetCategories, ...savingsJarCategories];
  const existingCategory = allCategories.find(cat => cat.name === categoryName);
  return existingCategory ? existingCategory.color : null;
}

/**
 * 為新類別分配顏色
 * - 如果類別名稱已存在，使用相同顏色
 * - 如果是新類別，分配下一個可用顏色
 * @param categoryName 類別名稱
 * @param budgetCategories 預算類別
 * @param savingsJarCategories 存錢罐類別
 * @returns 分配的顏色
 */
export function assignCategoryColor(
  categoryName: string,
  budgetCategories: Array<{ name: string; color: string }> = [],
  savingsJarCategories: Array<{ name: string; color: string }> = []
): string {
  // 檢查類別是否已存在
  const existingColor = getExistingCategoryColor(categoryName, budgetCategories, savingsJarCategories);
  if (existingColor) {
    return existingColor;
  }
  
  // 獲取已使用的顏色
  const usedColors = getUsedColors(budgetCategories, savingsJarCategories);
  
  // 返回下一個可用顏色
  return getNextAvailableColor(usedColors);
}
