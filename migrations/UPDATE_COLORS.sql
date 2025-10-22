-- Simple version: Update all category colors to new palette
-- Run this in Neon SQL Editor to update existing categories

-- Budget Categories - Assign different colors
UPDATE budget_categories 
SET color = (
  ARRAY[
    'hsl(220, 88%, 63%)', 'hsl(200, 85%, 58%)', 'hsl(180, 75%, 52%)', 'hsl(160, 72%, 48%)',
    'hsl(140, 75%, 45%)', 'hsl(90, 70%, 52%)', 'hsl(60, 82%, 58%)', 'hsl(40, 85%, 58%)',
    'hsl(20, 88%, 60%)', 'hsl(0, 82%, 62%)', 'hsl(340, 75%, 58%)', 'hsl(320, 70%, 60%)',
    'hsl(280, 75%, 62%)', 'hsl(260, 72%, 58%)', 'hsl(240, 78%, 60%)', 'hsl(210, 85%, 55%)',
    'hsl(190, 78%, 50%)', 'hsl(170, 68%, 48%)', 'hsl(120, 65%, 48%)', 'hsl(50, 88%, 55%)'
  ]
)[
  1 + (
    (SELECT COUNT(*) FROM budget_categories b2 WHERE b2.created_at < budget_categories.created_at)
    % 20
  )
];

-- Savings Jar Categories - Assign different colors (continuing from budget categories)
UPDATE savings_jar_categories 
SET color = (
  ARRAY[
    'hsl(220, 88%, 63%)', 'hsl(200, 85%, 58%)', 'hsl(180, 75%, 52%)', 'hsl(160, 72%, 48%)',
    'hsl(140, 75%, 45%)', 'hsl(90, 70%, 52%)', 'hsl(60, 82%, 58%)', 'hsl(40, 85%, 58%)',
    'hsl(20, 88%, 60%)', 'hsl(0, 82%, 62%)', 'hsl(340, 75%, 58%)', 'hsl(320, 70%, 60%)',
    'hsl(280, 75%, 62%)', 'hsl(260, 72%, 58%)', 'hsl(240, 78%, 60%)', 'hsl(210, 85%, 55%)',
    'hsl(190, 78%, 50%)', 'hsl(170, 68%, 48%)', 'hsl(120, 65%, 48%)', 'hsl(50, 88%, 55%)'
  ]
)[
  1 + (
    (
      (SELECT COUNT(*) FROM budget_categories) +
      (SELECT COUNT(*) FROM savings_jar_categories s2 WHERE s2.created_at < savings_jar_categories.created_at)
    ) % 20
  )
];

-- Verify the update
SELECT 'Budget Categories:' AS type, name, color FROM budget_categories ORDER BY created_at;
SELECT 'Savings Jar Categories:' AS type, name, color FROM savings_jar_categories ORDER BY created_at;
