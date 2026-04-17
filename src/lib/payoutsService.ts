import { supabase } from '@/integrations/supabase/client';

export interface Payout {
  id: string;
  shop_id: string;
  amount: number;
  note: string;
  paid_at: string;
  created_at: string;
}

export async function fetchPayouts(): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payout[];
}

export async function fetchPayoutsByShopId(shopId: string): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('shop_id', shopId)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payout[];
}

export async function insertPayout(shopId: string, amount: number, note: string, paidAt: string): Promise<Payout> {
  const { data, error } = await supabase
    .from('payouts')
    .insert({ shop_id: shopId, amount, note, paid_at: paidAt })
    .select()
    .single();
  if (error) throw error;
  return data as Payout;
}

export async function deletePayout(id: string): Promise<void> {
  const { error } = await supabase.from('payouts').delete().eq('id', id);
  if (error) throw error;
}