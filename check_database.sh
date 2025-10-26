#!/bin/bash

echo "🔍 檢查資料庫連線和表格狀態"
echo "======================================"

# 檢查 .env 檔案
if [ ! -f .env ]; then
  echo "❌ .env 檔案不存在"
  echo ""
  echo "請建立 .env 檔案並設定 DATABASE_URL:"
  echo ""
  echo "DATABASE_URL=postgresql://user:password@host/db?sslmode=require"
  echo ""
  exit 1
fi

# 檢查 DATABASE_URL
if ! grep -q "DATABASE_URL" .env; then
  echo "❌ .env 中未設定 DATABASE_URL"
  exit 1
fi

echo "✅ .env 檔案存在"
echo ""

# 讀取 DATABASE_URL
source .env

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL 為空"
  exit 1
fi

echo "✅ DATABASE_URL 已設定"
echo ""

# 檢查 ledger_categories 表是否存在
echo "📋 檢查 ledger_categories 表..."
echo ""

# 使用 psql 檢查（如果有安裝）
if command -v psql &> /dev/null; then
  echo "執行 SQL 查詢..."
  psql "$DATABASE_URL" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ledger_categories');" 2>&1
  
  echo ""
  echo "查詢表結構..."
  psql "$DATABASE_URL" -c "\d ledger_categories" 2>&1
  
  echo ""
  echo "查詢資料數量..."
  psql "$DATABASE_URL" -c "SELECT user_id, COUNT(*) as count FROM ledger_categories GROUP BY user_id;" 2>&1
else
  echo "⚠️ psql 未安裝，無法直接查詢資料庫"
  echo ""
  echo "請手動檢查 Neon Console:"
  echo "1. 登入 https://console.neon.tech"
  echo "2. 選擇您的專案"
  echo "3. 執行以下 SQL:"
  echo ""
  echo "   SELECT * FROM information_schema.tables WHERE table_name = 'ledger_categories';"
  echo ""
  echo "   如果表不存在，請執行遷移檔案:"
  echo "   migrations/0003_step1_create_table.sql"
  echo "   migrations/0003_step2_migrate_existing.sql"
  echo "   migrations/0003_step3_insert_defaults.sql"
fi

echo ""
echo "======================================"
echo "檢查完成"
