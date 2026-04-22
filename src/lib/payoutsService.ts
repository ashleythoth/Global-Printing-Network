import { supabase } from '@/integrations/supabase/client';

export interface Payout {
  id: string;
  shop_id: string;
  amount: number;
  note: string;
  paid_at: string;
  created_by: string;
  created_at: string;
  // joined
  shop_name?: string;
}

export async function fetchPayouts(): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*, print_shops(name)')
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    shop_name: row.print_shops?.name ?? '',
  }));
}

export async function fetchPayoutsByShopId(shopId: string): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('shop_id', shopId)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPayout(payload: {
  shop_id: string;
  amount: number;
  note: string;
  paid_at: string;
  created_by: string;
}): Promise<Payout> {
  const { data, error } = await supabase
    .from('payouts')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePayout(id: string): Promise<void> {
  const { error } = await supabase.from('payouts').delete().eq('id', id);
  if (error) throw error;
}
