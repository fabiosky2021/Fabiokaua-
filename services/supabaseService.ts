
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://widueebgcpfajqrahjtf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_eDhNETqNyZaWwZ4jVFET7A_hCZL6aM4';

const getSupabaseConfig = () => {
  const syncId = localStorage.getItem('maestro_sync_id') || 'global';
  const saved = localStorage.getItem(`maestro_settings_${syncId}`);
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      if (settings.integration?.supabaseConfig?.url && settings.integration?.supabaseConfig?.key) {
        return {
          url: settings.integration.supabaseConfig.url,
          key: settings.integration.supabaseConfig.key
        };
      }
    } catch (e) {}
  }
  return {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY
  };
};

let cachedClient: any = null;
let lastConfig: string = '';

export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  const configStr = JSON.stringify(config);
  
  if (!cachedClient || configStr !== lastConfig) {
    cachedClient = createClient(config.url, config.key);
    lastConfig = configStr;
  }
  return cachedClient;
};

export const saveEvolutionLog = async (message: string, node: string, version: string) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from('evolution_logs')
      .insert([
        { 
          message, 
          node, 
          version, 
          timestamp: new Date().toISOString() 
        },
      ]);
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Fallback: Salvando log localmente');
    const localLogs = JSON.parse(localStorage.getItem('maestro_logs') || '[]');
    localLogs.unshift({ message, node, version, timestamp: new Date().toISOString() });
    localStorage.setItem('maestro_logs', JSON.stringify(localLogs.slice(0, 50)));
  }
};

export const fetchLogs = async () => {
  try {
    const { data, error } = await getSupabaseClient()
      .from('evolution_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  } catch (e) {
    return JSON.parse(localStorage.getItem('maestro_logs') || '[]');
  }
};

// Sincronização de Configurações Alpha
export const syncSettings = async (syncId: string, settings: any) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from('maestro_configs')
      .upsert({ 
        sync_id: syncId, 
        payload: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'sync_id' });
    
    if (error) throw error;
    return data;
  } catch (e) {
    localStorage.setItem(`maestro_settings_${syncId}`, JSON.stringify(settings));
  }
};

export const fetchSettings = async (syncId: string) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from('maestro_configs')
      .select('payload')
      .eq('sync_id', syncId)
      .single();
    
    if (error) throw error;
    return data?.payload;
  } catch (e) {
    const saved = localStorage.getItem(`maestro_settings_${syncId}`);
    return saved ? JSON.parse(saved) : null;
  }
};

// Sincronização de Mensagens (Opcional, mas melhora a experiência)
export const syncMessages = async (syncId: string, messages: any[]) => {
  try {
    const { error } = await getSupabaseClient()
      .from('maestro_history')
      .upsert({ 
        sync_id: syncId, 
        messages: messages,
        last_sync: new Date().toISOString()
      }, { onConflict: 'sync_id' });
    if (error) throw error;
  } catch (e) {
    localStorage.setItem(`maestro_history_${syncId}`, JSON.stringify(messages));
  }
};

export const fetchMessages = async (syncId: string) => {
  try {
    const { data, error } = await getSupabaseClient()
      .from('maestro_history')
      .select('messages')
      .eq('sync_id', syncId)
      .single();
    if (error) throw error;
    return data?.messages || [];
  } catch (e) {
    const saved = localStorage.getItem(`maestro_history_${syncId}`);
    return saved ? JSON.parse(saved) : [];
  }
};

export const checkSupabaseConnection = async () => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('evolution_logs').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { success: true, message: "Conectado com sucesso!" };
  } catch (e: any) {
    return { success: false, message: e.message || "Erro ao conectar." };
  }
};
