-- Update existing category colors to use new HSL color scheme
-- This ensures all categories have distinct colors from the new color palette

-- Update budget_categories colors (assign colors based on row number)
WITH numbered_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS row_num
  FROM budget_categories
)
UPDATE budget_categories
SET color = CASE 
  WHEN numbered_categories.row_num % 20 = 0 THEN 'hsl(220, 88%, 63%)'
  WHEN numbered_categories.row_num % 20 = 1 THEN 'hsl(200, 85%, 58%)'
  WHEN numbered_categories.row_num % 20 = 2 THEN 'hsl(180, 75%, 52%)'
  WHEN numbered_categories.row_num % 20 = 3 THEN 'hsl(160, 72%, 48%)'
  WHEN numbered_categories.row_num % 20 = 4 THEN 'hsl(140, 75%, 45%)'
  WHEN numbered_categories.row_num % 20 = 5 THEN 'hsl(90, 70%, 52%)'
  WHEN numbered_categories.row_num % 20 = 6 THEN 'hsl(60, 82%, 58%)'
  WHEN numbered_categories.row_num % 20 = 7 THEN 'hsl(40, 85%, 58%)'
  WHEN numbered_categories.row_num % 20 = 8 THEN 'hsl(20, 88%, 60%)'
  WHEN numbered_categories.row_num % 20 = 9 THEN 'hsl(0, 82%, 62%)'
  WHEN numbered_categories.row_num % 20 = 10 THEN 'hsl(340, 75%, 58%)'
  WHEN numbered_categories.row_num % 20 = 11 THEN 'hsl(320, 70%, 60%)'
  WHEN numbered_categories.row_num % 20 = 12 THEN 'hsl(280, 75%, 62%)'
  WHEN numbered_categories.row_num % 20 = 13 THEN 'hsl(260, 72%, 58%)'
  WHEN numbered_categories.row_num % 20 = 14 THEN 'hsl(240, 78%, 60%)'
  WHEN numbered_categories.row_num % 20 = 15 THEN 'hsl(210, 85%, 55%)'
  WHEN numbered_categories.row_num % 20 = 16 THEN 'hsl(190, 78%, 50%)'
  WHEN numbered_categories.row_num % 20 = 17 THEN 'hsl(170, 68%, 48%)'
  WHEN numbered_categories.row_num % 20 = 18 THEN 'hsl(120, 65%, 48%)'
  WHEN numbered_categories.row_num % 20 = 19 THEN 'hsl(50, 88%, 55%)'
END
FROM numbered_categories
WHERE budget_categories.id = numbered_categories.id;

-- Update savings_jar_categories colors (continue from budget_categories count)
WITH numbered_categories AS (
  SELECT 
    id,
    (SELECT COUNT(*) FROM budget_categories) + ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS row_num
  FROM savings_jar_categories
)
UPDATE savings_jar_categories
SET color = CASE 
  WHEN numbered_categories.row_num % 20 = 0 THEN 'hsl(220, 88%, 63%)'
  WHEN numbered_categories.row_num % 20 = 1 THEN 'hsl(200, 85%, 58%)'
  WHEN numbered_categories.row_num % 20 = 2 THEN 'hsl(180, 75%, 52%)'
  WHEN numbered_categories.row_num % 20 = 3 THEN 'hsl(160, 72%, 48%)'
  WHEN numbered_categories.row_num % 20 = 4 THEN 'hsl(140, 75%, 45%)'
  WHEN numbered_categories.row_num % 20 = 5 THEN 'hsl(90, 70%, 52%)'
  WHEN numbered_categories.row_num % 20 = 6 THEN 'hsl(60, 82%, 58%)'
  WHEN numbered_categories.row_num % 20 = 7 THEN 'hsl(40, 85%, 58%)'
  WHEN numbered_categories.row_num % 20 = 8 THEN 'hsl(20, 88%, 60%)'
  WHEN numbered_categories.row_num % 20 = 9 THEN 'hsl(0, 82%, 62%)'
  WHEN numbered_categories.row_num % 20 = 10 THEN 'hsl(340, 75%, 58%)'
  WHEN numbered_categories.row_num % 20 = 11 THEN 'hsl(320, 70%, 60%)'
  WHEN numbered_categories.row_num % 20 = 12 THEN 'hsl(280, 75%, 62%)'
  WHEN numbered_categories.row_num % 20 = 13 THEN 'hsl(260, 72%, 58%)'
  WHEN numbered_categories.row_num % 20 = 14 THEN 'hsl(240, 78%, 60%)'
  WHEN numbered_categories.row_num % 20 = 15 THEN 'hsl(210, 85%, 55%)'
  WHEN numbered_categories.row_num % 20 = 16 THEN 'hsl(190, 78%, 50%)'
  WHEN numbered_categories.row_num % 20 = 17 THEN 'hsl(170, 68%, 48%)'
  WHEN numbered_categories.row_num % 20 = 18 THEN 'hsl(120, 65%, 48%)'
  WHEN numbered_categories.row_num % 20 = 19 THEN 'hsl(50, 88%, 55%)'
END
FROM numbered_categories
WHERE savings_jar_categories.id = numbered_categories.id;
