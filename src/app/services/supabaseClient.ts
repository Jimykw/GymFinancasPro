import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  key: string;
}

const STORAGE_KEY = 'gym_financas_supabase';

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as SupabaseConfig;
  } catch {
    return null;
  }
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const createSupabaseClient = (config: SupabaseConfig): SupabaseClient => {
  return createClient(config.url, config.key);
};

export async function testSupabaseConnection(config: SupabaseConfig) {
  const supabase = createSupabaseClient(config);
  const { error } = await supabase.auth.getSession();
  if (error) {
    return { ok: false, message: `Falha na conexão: ${error.message}` };
  }

  return { ok: true, message: 'Conectado ao Supabase com sucesso.' };
}
