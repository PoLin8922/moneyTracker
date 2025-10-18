import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBudgetItems } from "./useBudgetItems";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * 自動更新「上月額外收入」的 Hook
 * 
 * 更新條件：
 * 1. 每次頁面載入時檢查
 * 2. 當上個月的收入記錄有變化時
 * 3. 當本月預算的固定收入變化時
 * 
 * 計算公式：上月額外收入 = Max(0, 上月總收入 - 本月固定收入)
 */
export function useAutoUpdateExtraIncome(budgetId: string | undefined, currentMonth: string, fixedIncome: number) {
  const isProcessingRef = useRef(false);
  const lastUpdateRef = useRef<string>("");
  
  const { data: items } = useBudgetItems(budgetId);
  
  // 獲取上月總收入
  const { data: prevIncomeData } = useQuery<{ totalIncome: number }>({
    queryKey: ['/api/budgets', currentMonth, 'previous-income'],
    enabled: !!budgetId,
  });

  const previousMonthIncome = prevIncomeData?.totalIncome || 0;
  // 上月額外收入 = 上月總收入 - 本月固定收入，最小為 0
  const calculatedPrevExtra = Math.max(0, previousMonthIncome - fixedIncome);

  useEffect(() => {
    if (!budgetId || !items || isProcessingRef.current) return;

    // 生成更新標記 (用於避免重複更新)
    const updateKey = `${budgetId}-${calculatedPrevExtra}`;
    if (lastUpdateRef.current === updateKey) return;

    const autoItems = items.filter(
      item =>
        item.type === "extra_income" &&
        item.isAutoCalculated === "true"
    );

    const performUpdate = async () => {
      isProcessingRef.current = true;

      try {
        if (autoItems.length === 0) {
          // 沒有自動項目，建立一個
          await apiRequest("POST", `/api/budgets/${budgetId}/items`, {
            type: "extra_income",
            name: "上月額外收入",
            amount: calculatedPrevExtra.toString(),
            isAutoCalculated: "true",
          });
          console.log(`[AutoUpdateExtraIncome] 創建上月額外收入項目: ${calculatedPrevExtra}`);
        } else if (autoItems.length === 1) {
          // 有一個，檢查金額是否不同
          const existing = autoItems[0];
          const existingAmount = parseFloat(existing.amount);
          
          if (Math.abs(existingAmount - calculatedPrevExtra) > 0.01) {
            await apiRequest("PATCH", `/api/budgets/items/${existing.id}`, {
              type: "extra_income",
              name: "上月額外收入",
              amount: calculatedPrevExtra.toString(),
              isAutoCalculated: "true",
            });
            console.log(`[AutoUpdateExtraIncome] 更新上月額外收入: ${existingAmount} → ${calculatedPrevExtra}`);
          }
        } else {
          // 有多筆自動項目（異常），刪除重複的
          console.warn("[AutoUpdateExtraIncome] 偵測到多筆上月額外收入自動項目，進行清理");
          
          // 保留第一個並更新
          const [keep, ...duplicates] = autoItems;
          
          // 刪除重複項目
          await Promise.all(
            duplicates.map(item => 
              apiRequest("DELETE", `/api/budgets/items/${item.id}`)
            )
          );
          
          // 更新保留的項目
          await apiRequest("PATCH", `/api/budgets/items/${keep.id}`, {
            type: "extra_income",
            name: "上月額外收入",
            amount: calculatedPrevExtra.toString(),
            isAutoCalculated: "true",
          });
        }

        // 更新成功，設置標記
        lastUpdateRef.current = updateKey;
        
        // 刷新相關查詢
        await queryClient.invalidateQueries({
          queryKey: ["/api/budgets", budgetId, "items"],
        });
      } catch (error) {
        console.error("[AutoUpdateExtraIncome] 更新失敗:", error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    performUpdate();
  }, [budgetId, items, calculatedPrevExtra]);

  return {
    previousMonthIncome,
    calculatedPrevExtra,
    isProcessing: isProcessingRef.current,
  };
}
