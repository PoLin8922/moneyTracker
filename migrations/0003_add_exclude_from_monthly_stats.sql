-- Add exclude_from_monthly_stats column to ledger_entries table
-- This allows balance adjustment entries to be excluded from monthly income/expense calculations

ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS exclude_from_monthly_stats BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN ledger_entries.exclude_from_monthly_stats IS '是否從月收支統計中排除（用於餘額調整等不應計入月收支的記錄）';
