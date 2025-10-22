-- Add iconName column to budget_categories table
ALTER TABLE "budget_categories" ADD COLUMN "icon_name" varchar NOT NULL DEFAULT 'Wallet';

-- Add iconName column to savings_jar_categories table
ALTER TABLE "savings_jar_categories" ADD COLUMN "icon_name" varchar NOT NULL DEFAULT 'PiggyBank';
