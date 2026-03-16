import { createClient } from '@/lib/supabase/client';

export interface TransferWalletRef {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'other';
  icon?: string | null;
}

export interface TransferListItem {
  id: string;
  amount: number;
  fee_amount: number;
  note: string | null;
  transfer_date: string;
  created_at: string;
  from_wallet_id: string;
  to_wallet_id: string;
  from_wallet: TransferWalletRef | null;
  to_wallet: TransferWalletRef | null;
}

export async function fetchTransfers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transfer_groups')
    .select(
      `
        id,
        amount,
        fee_amount,
        note,
        transfer_date,
        created_at,
        from_wallet_id,
        to_wallet_id,
        from_wallet:wallets!transfer_groups_from_wallet_id_fkey(id, name, type, icon),
        to_wallet:wallets!transfer_groups_to_wallet_id_fkey(id, name, type, icon)
      `
    )
    .is('deleted_at', null)
    .order('transfer_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TransferListItem[];
}

export async function fetchTransferDetail(transferGroupId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transfer_groups')
    .select(
      `
        id,
        amount,
        fee_amount,
        note,
        transfer_date,
        created_at,
        from_wallet_id,
        to_wallet_id,
        from_wallet:wallets!transfer_groups_from_wallet_id_fkey(id, name, type, icon),
        to_wallet:wallets!transfer_groups_to_wallet_id_fkey(id, name, type, icon)
      `
    )
    .eq('id', transferGroupId)
    .is('deleted_at', null)
    .single();

  if (error) {
    throw error;
  }

  return data as TransferListItem;
}
