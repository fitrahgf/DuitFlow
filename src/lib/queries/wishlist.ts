import { createClient } from '@/lib/supabase/client';

export type WishlistStatus =
  | 'pending_review'
  | 'approved_to_buy'
  | 'cancelled'
  | 'postponed'
  | 'purchased';

export type WishlistPriority = 'low' | 'medium' | 'high';

export interface WishlistItem {
  id: string;
  item_name: string;
  target_price: number | null;
  url: string | null;
  note: string | null;
  reason: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  cooling_days: number;
  start_date: string;
  review_date: string;
  selected_wallet_id: string | null;
  created_at: string;
  updated_at?: string | null;
  wallets?: {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'other';
  } | null;
}

export async function fetchWishlistItems() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wishlist')
    .select(
      'id, item_name, target_price, url, note, reason, priority, status, cooling_days, start_date, review_date, selected_wallet_id, created_at, updated_at, wallets(id, name, type)'
    )
    .order('review_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WishlistItem[];
}
