-- Add iconName column to budget_categories table (optional field)
ALTER TABLE "budget_categories" ADD COLUMN IF NOT EXISTS "icon_name" varchar DEFAULT 'Wallet';

-- Add iconName column to savings_jar_categories table (optional field)
ALTER TABLE "savings_jar_categories" ADD COLUMN IF NOT EXISTS "icon_name" varchar DEFAULT 'PiggyBank';
