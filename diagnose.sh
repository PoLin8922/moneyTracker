#!/bin/bash

echo "🔍 診斷類別管理系統問題..."
echo ""

# 1. 檢查伺服器是否運行
echo "1️⃣ 檢查伺服器狀態..."
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "✅ 伺服器運行中 (Port 5000)"
    PID=$(lsof -ti:5000)
    echo "   PID: $PID"
else
    echo "❌ 伺服器未運行"
    echo "   請執行: npm run dev"
    exit 1
fi

echo ""

# 2. 測試 GET 請求
echo "2️⃣ 測試 GET /api/ledger-categories..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/ledger-categories)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ GET 請求成功 (200)"
    echo "   回應: $BODY"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  需要認證 (401)"
    echo "   這是正常的，需要登入後才能存取"
else
    echo "❌ GET 請求失敗 ($HTTP_CODE)"
    echo "   回應: $BODY"
fi

echo ""

# 3. 測試 POST 請求
echo "3️⃣ 測試 POST /api/ledger-categories..."
POST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"測試","type":"expense","iconName":"Wallet","color":"hsl(25, 95%, 53%)"}' \
  http://localhost:5000/api/ledger-categories)
POST_HTTP_CODE=$(echo "$POST_RESPONSE" | tail -n 1)
POST_BODY=$(echo "$POST_RESPONSE" | head -n -1)

if [ "$POST_HTTP_CODE" = "200" ]; then
    echo "✅ POST 請求成功 (200)"
elif [ "$POST_HTTP_CODE" = "401" ]; then
    echo "⚠️  需要認證 (401)"
    echo "   這是正常的，需要登入後才能存取"
elif [ "$POST_HTTP_CODE" = "405" ]; then
    echo "❌ 方法不允許 (405)"
    echo "   這表示路由沒有正確註冊"
else
    echo "❌ POST 請求失敗 ($POST_HTTP_CODE)"
fi
echo "   回應: $POST_BODY"

echo ""

# 4. 檢查路由檔案
echo "4️⃣ 檢查路由檔案..."
if grep -q "app.post('/api/ledger-categories'" server/routes.ts; then
    echo "✅ POST 路由已定義"
else
    echo "❌ POST 路由未找到"
fi

if grep -q "app.get('/api/ledger-categories'" server/routes.ts; then
    echo "✅ GET 路由已定義"
else
    echo "❌ GET 路由未找到"
fi

if grep -q "app.delete('/api/ledger-categories" server/routes.ts; then
    echo "✅ DELETE 路由已定義"
else
    echo "❌ DELETE 路由未找到"
fi

echo ""

# 5. 檢查 authMiddleware
echo "5️⃣ 檢查認證中間件..."
if grep -q "let authMiddleware: any;" server/routes.ts; then
    echo "✅ authMiddleware 已正確宣告"
else
    echo "⚠️  authMiddleware 宣告可能有問題"
fi

echo ""
echo "🎯 診斷完成！"
echo ""
echo "💡 建議："
echo "   1. 如果看到 401 錯誤，請先登入應用程式"
echo "   2. 如果看到 405 錯誤，請重啟伺服器: npm run dev"
echo "   3. 檢查瀏覽器 Console 是否有其他錯誤訊息"
