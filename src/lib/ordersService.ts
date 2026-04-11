import { supabase } from '@/integrations/supabase/client';

export interface SupabaseOrder {
  id: string;
  shop_id: string;
  shop_product_id: string;
  product_id: string;
  product_name: string;
  product_print_type: string;
  shop_name: string;
  copies: number;
  color_mode: string;
  sides: string;
  size: string;
  finish: string;
  total_quantity: number;
  total_price: number;
  file_paths: string[];
  status: string;
  created_at: string;
}

export async function fetchOrders(): Promise<SupabaseOrder[]> {
  const { data, error } = await supabase
    .from('print_orders')
    .select(`
      id,
      shop_id,
      shop_product_id,
      copies,
      color_mode,
      sides,
      size,
      finish,
      total_quantity,
      total_price,
      file_paths,
      status,
      created_at,
      print_shops ( name ),
      shop_products (
        product_id,
        products ( name, print_type )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    shop_id: row.shop_id,
    shop_product_id: row.shop_product_id,
    product_id: row.shop_products?.product_id ?? '',
    product_name: row.shop_products?.products?.name ?? '—',
    product_print_type: row.shop_products?.products?.print_type ?? 'document',
    shop_name: row.print_shops?.name ?? '—',
    copies: row.copies,
    color_mode: row.color_mode,
    sides: row.sides,
    size: row.size,
    finish: row.finish,
    total_quantity: row.total_quantity,
    total_price: row.total_price,
    file_paths: row.file_paths ?? [],
    status: row.status,
    created_at: row.created_at,
  }));
}

export async function fetchOrdersByShopId(shopId: string): Promise<SupabaseOrder[]> {
  const { data, error } = await supabase
    .from('print_orders')
    .select(`
      id,
      shop_id,
      shop_product_id,
      copies,
      color_mode,
      sides,
      size,
      finish,
      total_quantity,
      total_price,
      file_paths,
      status,
      created_at,
      print_shops ( name ),
      shop_products (
        product_id,
        products ( name, print_type )
      )
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    shop_id: row.shop_id,
    shop_product_id: row.shop_product_id,
    product_id: row.shop_products?.product_id ?? '',
    product_name: row.shop_products?.products?.name ?? '—',
    product_print_type: row.shop_products?.products?.print_type ?? 'document',
    shop_name: row.print_shops?.name ?? '—',
    copies: row.copies,
    color_mode: row.color_mode,
    sides: row.sides,
    size: row.size,
    finish: row.finish,
    total_quantity: row.total_quantity,
    total_price: row.total_price,
    file_paths: row.file_paths ?? [],
    status: row.status,
    created_at: row.created_at,
  }));
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('print_orders')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('print_orders')
    .delete()
    .eq('id', id);
  if (error) throw error;
}