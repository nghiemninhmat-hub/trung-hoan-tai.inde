import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ADMIN_EMAILS = [
  'kinhnha010@gmail.com',
  'hamthien53@gmail.com',
  'Ngoncanhtac001@gmail.com',
  'thanhhuyenbsc@gmail.com',
];

export const ADMIN_PASSWORD_DEFAULT = 'TrungHoanTai@2026!';

export const CURRENCY_LABELS: Record<string, string> = {
  HUA_TIEN: 'Hoa Tiền',
  CONG_DUC: 'Công Đức',
  AM_DUC: 'Âm Đức',
};

export const SHOP_AREA_LABELS: Record<string, string> = {
  'Thường': 'Thương Thành Thường',
  'Hiếm': 'Thương Thành Hiếm',
  'Sự kiện': 'Thương Thành Sự Kiện',
};

export const CURRENCY_ICONS: Record<string, string> = {
  HUA_TIEN: '🪙',
  CONG_DUC: '✨',
  AM_DUC: '🌑',
};

export interface Profile {
  id: string;
  email: string;
  oc_name: string;
  avatar_url: string | null;
  gender: string;
  bio: string | null;
  hua_tien: number;
  cong_duc: number;
  am_duc: number;
  is_approved: boolean;
  anonymous_name: string | null;
  anonymous_name_changes: number;
  created_at: string;
  wheel_spins: number;
  wheel_special_claimed: boolean;
}

export interface WheelSpinResult {
  reward_key: string;
  reward_label: string;
  reward_group: string;
  is_special: boolean;
  currency_type: string | null;
  amount: number;
}

export interface WheelSpinLog {
  id: string;
  user_id: string;
  reward_key: string;
  reward_label: string;
  reward_group: string;
  is_special: boolean;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: string;
  price: number;
  currency_type: string;
  description: string | null;
  stock: number;
  price_secondary: number | null;
  currency_type_secondary: string | null;
  shop_area: string;
  purchase_limit: string | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
  shop_items?: ShopItem;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  acquired_at: string;
  shop_items?: ShopItem;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  profiles?: { anonymous_name: string | null; oc_name: string } | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency_type: string;
  reason: string;
  created_at: string;
  profiles?: { oc_name: string; email: string } | null;
}

export interface SitePage {
  id: string;
  page_number: number;
  title: string;
  category: string;
  content: string;
}
