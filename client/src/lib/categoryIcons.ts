// 統一的類別圖標管理系統
import { 
  Car, 
  Users, 
  Home, 
  ShoppingCart, 
  Utensils, 
  Heart, 
  Smartphone,
  BookOpen,
  Wallet,
  TrendingUp,
  Gift,
  Plane,
  Coffee,
  Zap,
  Music,
  Film,
  Gamepad2,
  Dumbbell,
  ShoppingBag,
  Shirt,
  Flower2,
  Baby,
  PawPrint,
  Briefcase,
  GraduationCap,
  Building2,
  Bus,
  Train,
  Bike,
  Fuel,
  Wrench,
  Lightbulb,
  Tv,
  Wifi,
  Pizza,
  IceCream,
  Wine,
  DollarSign,
  PiggyBank,
  CreditCard,
  Receipt,
  Tag,
  CircleDollarSign,
  HandCoins,
  Banknote,
  Leaf,
  Sparkles,
  Star,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Zap as Lightning,
  type LucideIcon
} from "lucide-react";

// 類別圖標定義
export interface CategoryIcon {
  name: string;
  icon: LucideIcon;
  keywords: string[]; // 用於智能匹配的關鍵字
}

// 所有可用的圖標選項
export const AVAILABLE_ICONS: CategoryIcon[] = [
  // 交通
  { name: "汽車", icon: Car, keywords: ["交通", "車", "uber", "計程車", "開車"] },
  { name: "公車", icon: Bus, keywords: ["公車", "巴士", "客運"] },
  { name: "火車", icon: Train, keywords: ["火車", "高鐵", "捷運", "地鐵", "台鐵"] },
  { name: "腳踏車", icon: Bike, keywords: ["腳踏車", "單車", "youbike", "自行車"] },
  { name: "加油", icon: Fuel, keywords: ["油", "加油", "汽油", "柴油"] },
  { name: "飛機", icon: Plane, keywords: ["旅遊", "旅行", "出國", "飛機", "機票"] },
  
  // 飲食
  { name: "餐飲", icon: Utensils, keywords: ["餐", "吃", "食", "用餐", "午餐", "晚餐"] },
  { name: "咖啡", icon: Coffee, keywords: ["咖啡", "飲料", "茶", "星巴克", "飲品"] },
  { name: "披薩", icon: Pizza, keywords: ["披薩", "pizza", "外送"] },
  { name: "甜點", icon: IceCream, keywords: ["冰淇淋", "甜點", "冰", "dessert"] },
  { name: "酒", icon: Wine, keywords: ["酒", "bar", "聚餐", "應酬", "喝酒"] },
  
  // 購物
  { name: "購物", icon: ShoppingCart, keywords: ["購物", "買", "shopping"] },
  { name: "購物袋", icon: ShoppingBag, keywords: ["包包", "提袋", "袋子"] },
  { name: "服飾", icon: Shirt, keywords: ["服飾", "衣服", "鞋", "穿搭", "fashion"] },
  { name: "美妝", icon: Flower2, keywords: ["美妝", "化妝", "保養", "美容"] },
  { name: "標籤", icon: Tag, keywords: ["雜費", "其他", "標籤"] },
  
  // 居住
  { name: "房屋", icon: Home, keywords: ["房", "租", "家", "住"] },
  { name: "大樓", icon: Building2, keywords: ["大樓", "管理費", "社區"] },
  { name: "燈泡", icon: Lightbulb, keywords: ["水電", "電費", "水費", "瓦斯"] },
  { name: "維修", icon: Wrench, keywords: ["維修", "修繕", "修理"] },
  
  // 娛樂
  { name: "遊戲", icon: Gamepad2, keywords: ["娛樂", "遊戲", "game", "電玩"] },
  { name: "電影", icon: Film, keywords: ["電影", "影片", "movie", "cinema"] },
  { name: "音樂", icon: Music, keywords: ["音樂", "演唱會", "concert", "KTV"] },
  { name: "運動", icon: Dumbbell, keywords: ["運動", "健身", "gym", "fitness"] },
  { name: "電視", icon: Tv, keywords: ["電視", "netflix", "訂閱", "串流"] },
  { name: "星星", icon: Star, keywords: ["評分", "獎勵", "成就"] },
  { name: "閃電", icon: Zap, keywords: ["快速", "電力", "能量"] },
  
  // 通訊
  { name: "手機", icon: Smartphone, keywords: ["通訊", "電話", "手機", "門號"] },
  { name: "網路", icon: Wifi, keywords: ["網路", "wifi", "寬頻", "上網"] },
  
  // 教育
  { name: "書籍", icon: BookOpen, keywords: ["教育", "學", "課", "讀書", "書"] },
  { name: "畢業帽", icon: GraduationCap, keywords: ["學費", "補習", "學校", "教育"] },
  
  // 醫療
  { name: "愛心", icon: Heart, keywords: ["醫療", "醫", "健康", "藥", "看病"] },
  
  // 家庭
  { name: "家人", icon: Users, keywords: ["家庭", "家人", "親子", "社交", "聚會"] },
  { name: "嬰兒", icon: Baby, keywords: ["小孩", "嬰兒", "寶寶", "兒童"] },
  { name: "寵物", icon: PawPrint, keywords: ["寵物", "貓", "狗", "動物"] },
  
  // 工作金融
  { name: "錢包", icon: Wallet, keywords: ["薪", "獎金", "收入", "錢包"] },
  { name: "公事包", icon: Briefcase, keywords: ["工作", "辦公", "事業", "職場"] },
  { name: "投資", icon: TrendingUp, keywords: ["投資", "股票", "基金", "理財"] },
  { name: "存錢筒", icon: PiggyBank, keywords: ["儲蓄", "存錢", "存款"] },
  { name: "信用卡", icon: CreditCard, keywords: ["信用卡", "刷卡", "卡片"] },
  { name: "鈔票", icon: Banknote, keywords: ["現金", "提款", "鈔票"] },
  { name: "收據", icon: Receipt, keywords: ["帳單", "繳費", "發票"] },
  { name: "錢幣", icon: CircleDollarSign, keywords: ["稅", "罰款", "費用"] },
  { name: "硬幣", icon: HandCoins, keywords: ["零錢", "硬幣", "小費"] },
  { name: "金錢", icon: DollarSign, keywords: ["金錢", "財務", "預算"] },
  
  // 其他
  { name: "禮物", icon: Gift, keywords: ["禮物", "送禮", "紅包", "禮金"] },
  { name: "葉子", icon: Leaf, keywords: ["環保", "自然", "植物"] },
  { name: "閃亮", icon: Sparkles, keywords: ["特殊", "亮點", "獎勵"] },
  { name: "太陽", icon: Sun, keywords: ["陽光", "夏天", "戶外"] },
  { name: "月亮", icon: Moon, keywords: ["夜晚", "睡眠", "休息"] },
  { name: "雲朵", icon: Cloud, keywords: ["天氣", "雲端"] },
  { name: "雨傘", icon: Umbrella, keywords: ["雨天", "保護", "傘"] },
];

// 預設類別（與記一筆保持一致）
export const DEFAULT_CATEGORIES = [
  { name: "交通", iconName: "汽車" },
  { name: "社交", iconName: "家人" },
  { name: "房租", iconName: "房屋" },
  { name: "購物", iconName: "購物" },
  { name: "餐飲", iconName: "餐飲" },
  { name: "醫療", iconName: "愛心" },
  { name: "通訊", iconName: "手機" },
  { name: "教育", iconName: "書籍" },
  { name: "薪資", iconName: "錢包" },
  { name: "投資", iconName: "投資" },
  { name: "禮物", iconName: "禮物" },
  { name: "旅遊", iconName: "飛機" },
];

/**
 * 根據圖標名稱獲取圖標組件
 */
export function getIconByName(iconName: string): LucideIcon {
  const found = AVAILABLE_ICONS.find(item => item.name === iconName);
  return found ? found.icon : DollarSign; // 預設圖標
}

/**
 * 根據類別名稱智能匹配圖標
 */
export function matchIconForCategory(categoryName: string): string {
  const name = categoryName.toLowerCase();
  
  // 尋找關鍵字匹配
  for (const iconItem of AVAILABLE_ICONS) {
    for (const keyword of iconItem.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return iconItem.name;
      }
    }
  }
  
  // 預設返回金錢圖標
  return "金錢";
}
