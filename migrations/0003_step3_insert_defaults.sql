-- ========================================
-- 步驟 3: 插入預設類別
-- ========================================
-- 用途: 為所有用戶新增預設的收入和支出類別

-- 3.1 預設支出類別（10個）
INSERT INTO ledger_categories (user_id, name, type, icon_name, color)
SELECT u.id, category_name, 'expense', icon_name, color
FROM users u
CROSS JOIN (
  VALUES 
    ('餐飲', 'UtensilsCrossed', 'hsl(25, 95%, 53%)'),
    ('交通', 'Car', 'hsl(217, 91%, 60%)'),
    ('購物', 'ShoppingBag', 'hsl(280, 85%, 60%)'),
    ('娛樂', 'Gamepad2', 'hsl(340, 82%, 52%)'),
    ('醫療', 'Heart', 'hsl(0, 84%, 60%)'),
    ('教育', 'GraduationCap', 'hsl(262, 83%, 58%)'),
    ('居家', 'Home', 'hsl(173, 80%, 40%)'),
    ('保險', 'Shield', 'hsl(221, 83%, 53%)'),
    ('投資', 'TrendingUp', 'hsl(142, 76%, 36%)'),
    ('其他支出', 'Minus', 'hsl(0, 84%, 60%)')
) AS categories(category_name, icon_name, color)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- 3.2 預設收入類別（4個）
INSERT INTO ledger_categories (user_id, name, type, icon_name, color)
SELECT u.id, category_name, 'income', icon_name, color
FROM users u
CROSS JOIN (
  VALUES 
    ('薪資', 'Wallet', 'hsl(142, 76%, 36%)'),
    ('獎金', 'Gift', 'hsl(168, 76%, 42%)'),
    ('利息', 'TrendingUp', 'hsl(160, 84%, 39%)'),
    ('其他收入', 'Plus', 'hsl(142, 71%, 45%)')
) AS categories(category_name, icon_name, color)
ON CONFLICT (user_id, name, type) DO NOTHING;
