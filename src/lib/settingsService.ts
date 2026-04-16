import { supabase } from '@/integrations/supabase/client';

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  return data?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value');
  if (error) return {};
  return Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}
