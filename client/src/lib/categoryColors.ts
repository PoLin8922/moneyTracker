// 統一的類別顏色管理系統
// 確保所有類別（預算類別 + 存錢罐類別）使用不同的顏色
// 顏色系統：與主題色 (220, 88%, 63% - 藍色) 協調的色調

export const CATEGORY_COLORS = [
  "hsl(220, 88%, 63%)",  // 主題藍色
  "hsl(200, 85%, 58%)",  // 天藍色
  "hsl(180, 75%, 52%)",  // 青色
  "hsl(160, 72%, 48%)",  // 青綠色
  "hsl(140, 75%, 45%)",  // 翠綠色
  "hsl(90, 70%, 52%)",   // 黃綠色
  "hsl(60, 82%, 58%)",   // 金黃色
  "hsl(40, 85%, 58%)",   // 橙黃色
  "hsl(20, 88%, 60%)",   // 橘色
  "hsl(0, 82%, 62%)",    // 紅色
  "hsl(340, 75%, 58%)",  // 玫瑰紅
  "hsl(320, 70%, 60%)",  // 洋紅色
  "hsl(280, 75%, 62%)",  // 紫色
  "hsl(260, 72%, 58%)",  // 深紫色
  "hsl(240, 78%, 60%)",  // 藍紫色
  "hsl(210, 85%, 55%)",  // 湛藍色
  "hsl(190, 78%, 50%)",  // 湖藍色
  "hsl(170, 68%, 48%)",  // 綠松石色
  "hsl(120, 65%, 48%)",  // 草綠色
  "hsl(50, 88%, 55%)",   // 檸檬黃
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
