import { supabase } from '@/integrations/supabase/client';
import { PrintShop } from './types';

const USERS_KEY = 'printhub_users';

function getLocalUsers(): any[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveLocalUsers(users: any[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Map Supabase row → PrintShop
function rowToShop(row: Record<string, unknown>): PrintShop {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) ?? '',
    address: (row.address as string) ?? '',
    status: (row.status as 'active' | 'inactive') ?? 'active',
    createdAt: row.created_at as string,
  };
}

export async function fetchShops(): Promise<PrintShop[]> {
  const { data, error } = await supabase
    .from('print_shops')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToShop);
}

export async function insertShop(
  shop: Omit<PrintShop, 'id' | 'createdAt'>,
  password: string
): Promise<PrintShop> {
  const { data, error } = await supabase
    .from('print_shops')
    .insert({
      name: shop.name,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      status: shop.status,
    })
    .select()
    .single();

  if (error) throw error;
  const newShop = rowToShop(data);

  // Create a localStorage user so the shop can log in
  const users = getLocalUsers();
  const existing = users.find((u: any) => u.email === shop.email);
  if (!existing) {
    users.push({
      id: newShop.id,
      email: shop.email,
      password,
      role: 'shop',
      shopId: newShop.id,
    });
    saveLocalUsers(users);
  }

  // Send welcome email — fire and don't block on failure
  try {
    await supabase.functions.invoke('send-welcome-email', {
      body: { shopName: newShop.name, email: newShop.email, password },
    });
  } catch (emailErr) {
    console.warn('Welcome email could not be sent:', emailErr);
  }

  return newShop;
}

export async function patchShop(
  id: string,
  updates: Partial<Omit<PrintShop, 'id' | 'createdAt'>>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.status !== undefined) payload.status = updates.status;

  const { error } = await supabase
    .from('print_shops')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export async function resetShopPassword(shopId: string, email: string, newPassword: string): Promise<void> {
  const users = getLocalUsers();
  const idx = users.findIndex((u: any) => u.email === email);
  if (idx !== -1) {
    users[idx].password = newPassword;
  } else {
    // User doesn't exist in localStorage yet — create them
    users.push({ id: shopId, email, password: newPassword, role: 'shop', shopId });
  }
  saveLocalUsers(users);
}

export async function removeShop(id: string): Promise<void> {
  const { error } = await supabase
    .from('print_shops')
    .delete()
    .eq('id', id);

  if (error) throw error;
}