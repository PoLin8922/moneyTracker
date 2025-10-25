-- Add exclude_from_monthly_stats column to ledger_entries table
-- This allows balance adjustment entries to be excluded from monthly income/expense calculations

-- Note: Using VARCHAR to store "true"/"false" for consistency with other boolean fields (e.g., includeInTotal)
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS exclude_from_monthly_stats VARCHAR DEFAULT 'false';

-- Add comment to explain the column
COMMENT ON COLUMN ledger_entries.exclude_from_monthly_stats IS '是否從月收支統計中排除（用於餘額調整等不應計入月收支的記錄）。值為 "true" 或 "false"';

-- For existing databases that may have added this as BOOLEAN, we need to handle the migration
-- If the column exists as BOOLEAN, drop and recreate it as VARCHAR
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ledger_entries' 
    AND column_name = 'exclude_from_monthly_stats'
    AND data_type = 'boolean'
  ) THEN
    -- Drop the BOOLEAN column
    ALTER TABLE ledger_entries DROP COLUMN exclude_from_monthly_stats;
    -- Recreate as VARCHAR
    ALTER TABLE ledger_entries ADD COLUMN exclude_from_monthly_stats VARCHAR DEFAULT 'false';
    RAISE NOTICE 'Converted exclude_from_monthly_stats from BOOLEAN to VARCHAR';
  END IF;
END $$;
