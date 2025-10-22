// 統一的類別顏色管理系統
// 確保所有類別（預算類別 + 存錢罐類別）使用不同的顏色
// 顏色系統：淡雅色調（飽和度降低、亮度提高），與主題色協調

export const CATEGORY_COLORS = [
  // 第一輪：淡雅藍綠色系 (20個)
  "hsl(220, 65%, 70%)",  // 淡藍色
  "hsl(200, 60%, 72%)",  // 淡天藍色
  "hsl(180, 55%, 68%)",  // 淡青色
  "hsl(160, 52%, 65%)",  // 淡青綠色
  "hsl(140, 55%, 68%)",  // 淡翠綠色
  "hsl(90, 50%, 70%)",   // 淡黃綠色
  "hsl(60, 58%, 72%)",   // 淡金黃色
  "hsl(40, 62%, 70%)",   // 淡橙黃色
  "hsl(20, 65%, 72%)",   // 淡橘色
  "hsl(0, 58%, 72%)",    // 淡紅色
  
  // 第二輪：淡雅粉紫色系 (10個)
  "hsl(340, 55%, 72%)",  // 淡玫瑰紅
  "hsl(320, 50%, 72%)",  // 淡洋紅色
  "hsl(280, 55%, 73%)",  // 淡紫色
  "hsl(260, 52%, 70%)",  // 淡深紫色
  "hsl(240, 58%, 72%)",  // 淡藍紫色
  "hsl(210, 62%, 70%)",  // 淡湛藍色
  "hsl(190, 58%, 68%)",  // 淡湖藍色
  "hsl(170, 50%, 68%)",  // 淡綠松石色
  "hsl(120, 48%, 68%)",  // 淡草綠色
  "hsl(50, 65%, 70%)",   // 淡檸檬黃
  
  // 第三輪：更淡的色調 (10個)
  "hsl(215, 55%, 75%)",  // 極淡藍色
  "hsl(195, 50%, 75%)",  // 極淡天空色
  "hsl(175, 48%, 73%)",  // 極淡青綠
  "hsl(155, 45%, 70%)",  // 極淡薄荷色
  "hsl(135, 48%, 72%)",  // 極淡嫩綠
  "hsl(80, 45%, 73%)",   // 極淡嫩黃綠
  "hsl(55, 55%, 75%)",   // 極淡奶油黃
  "hsl(35, 58%, 73%)",   // 極淡杏色
  "hsl(15, 60%, 75%)",   // 極淡珊瑚色
  "hsl(345, 52%, 75%)",  // 極淡粉紅
  
  // 第四輪：中度飽和 (10個)
  "hsl(225, 60%, 68%)",  // 中藍色
  "hsl(205, 55%, 68%)",  // 中天藍
  "hsl(185, 50%, 65%)",  // 中青色
  "hsl(165, 48%, 65%)",  // 中青綠
  "hsl(145, 50%, 66%)",  // 中綠色
  "hsl(95, 48%, 68%)",   // 中黃綠
  "hsl(65, 55%, 68%)",   // 中黃色
  "hsl(45, 58%, 68%)",   // 中橙黃
  "hsl(25, 60%, 70%)",   // 中橙色
  "hsl(5, 55%, 70%)",    // 中紅色
  
  // 第五輪：柔和色調 (10個)
  "hsl(230, 50%, 73%)",  // 柔和藍紫
  "hsl(250, 48%, 72%)",  // 柔和紫色
  "hsl(270, 50%, 73%)",  // 柔和深紫
  "hsl(290, 48%, 72%)",  // 柔和紫紅
  "hsl(310, 50%, 73%)",  // 柔和桃紅
  "hsl(330, 48%, 73%)",  // 柔和粉色
  "hsl(350, 50%, 73%)",  // 柔和玫瑰
  "hsl(10, 52%, 72%)",   // 柔和朱紅
  "hsl(30, 55%, 72%)",   // 柔和橘色
  "hsl(70, 50%, 72%)",   // 柔和黃綠
];

// 飽和顏色系統 - 僅用於圖表中「已使用金額」的進度條顯示
// 高飽和度 (80-90%)、中等亮度 (50-60%)，讓已使用部分更明顯
export const SATURATED_COLORS = [
  // 第一輪：高飽和色系 (20個)
  "hsl(220, 88%, 55%)",  // 飽和藍色
  "hsl(200, 85%, 52%)",  // 飽和天藍色
  "hsl(180, 82%, 48%)",  // 飽和青色
  "hsl(160, 80%, 45%)",  // 飽和青綠色
  "hsl(140, 82%, 42%)",  // 飽和翠綠色
  "hsl(90, 78%, 50%)",   // 飽和黃綠色
  "hsl(60, 88%, 52%)",   // 飽和金黃色
  "hsl(40, 90%, 55%)",   // 飽和橙黃色
  "hsl(20, 90%, 58%)",   // 飽和橘色
  "hsl(0, 85%, 58%)",    // 飽和紅色
  "hsl(340, 82%, 55%)",  // 飽和玫瑰紅
  "hsl(320, 78%, 58%)",  // 飽和洋紅色
  "hsl(280, 82%, 60%)",  // 飽和紫色
  "hsl(260, 80%, 55%)",  // 飽和深紫色
  "hsl(240, 85%, 58%)",  // 飽和藍紫色
  "hsl(210, 90%, 52%)",  // 飽和湛藍色
  "hsl(190, 85%, 48%)",  // 飽和湖藍色
  "hsl(170, 78%, 45%)",  // 飽和綠松石色
  "hsl(120, 75%, 45%)",  // 飽和草綠色
  "hsl(50, 90%, 52%)",   // 飽和檸檬黃
  
  // 第二輪：高飽和色系 (10個)
  "hsl(215, 85%, 53%)",  // 飽和中藍
  "hsl(195, 82%, 50%)",  // 飽和中天藍
  "hsl(175, 78%, 47%)",  // 飽和中青
  "hsl(155, 75%, 44%)",  // 飽和中青綠
  "hsl(135, 78%, 46%)",  // 飽和中綠
  "hsl(80, 75%, 50%)",   // 飽和中黃綠
  "hsl(55, 85%, 52%)",   // 飽和中黃
  "hsl(35, 88%, 55%)",   // 飽和中橙黃
  "hsl(15, 88%, 58%)",   // 飽和中橘
  "hsl(345, 80%, 56%)",  // 飽和中粉紅
  
  // 第三輪：高飽和色系 (10個)
  "hsl(225, 82%, 54%)",  // 飽和淺藍
  "hsl(205, 80%, 51%)",  // 飽和淺天藍
  "hsl(185, 78%, 48%)",  // 飽和淺青
  "hsl(165, 75%, 46%)",  // 飽和淺青綠
  "hsl(145, 78%, 47%)",  // 飽和淺綠
  "hsl(95, 76%, 51%)",   // 飽和淺黃綠
  "hsl(65, 86%, 53%)",   // 飽和淺黃
  "hsl(45, 88%, 56%)",   // 飽和淺橙黃
  "hsl(25, 87%, 58%)",   // 飽和淺橘
  "hsl(5, 83%, 57%)",    // 飽和淺紅
  
  // 第四輪：高飽和色系 (10個)
  "hsl(230, 80%, 56%)",  // 飽和藍紫
  "hsl(250, 78%, 58%)",  // 飽和紫
  "hsl(270, 80%, 59%)",  // 飽和深紫
  "hsl(290, 78%, 58%)",  // 飽和紫紅
  "hsl(310, 80%, 59%)",  // 飽和桃紅
  "hsl(330, 78%, 58%)",  // 飽和粉
  "hsl(350, 80%, 58%)",  // 飽和玫瑰
  "hsl(10, 82%, 57%)",   // 飽和朱紅
  "hsl(30, 85%, 57%)",   // 飽和橘
  "hsl(70, 78%, 52%)",   // 飽和黃綠
  
  // 第五輪：高飽和色系 (10個)
  "hsl(218, 84%, 54%)",  // 飽和深藍
  "hsl(198, 82%, 51%)",  // 飽和深天藍
  "hsl(178, 79%, 49%)",  // 飽和深青
  "hsl(158, 76%, 46%)",  // 飽和深青綠
  "hsl(138, 79%, 46%)",  // 飽和深綠
  "hsl(88, 77%, 51%)",   // 飽和深黃綠
  "hsl(58, 87%, 53%)",   // 飽和深黃
  "hsl(38, 89%, 56%)",   // 飽和深橙黃
  "hsl(18, 89%, 59%)",   // 飽和深橘
  "hsl(358, 84%, 58%)",  // 飽和深紅
];

// 獲取類別顏色 - 淡雅色調用於一般顯示
export function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

// 獲取飽和顏色 - 僅用於圖表進度條的「已使用」部分
export function getSaturatedColor(index: number): string {
  return SATURATED_COLORS[index % SATURATED_COLORS.length];
}

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
