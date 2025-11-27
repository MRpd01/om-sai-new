import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? '✓' : '✗',
    key: supabaseAnonKey ? '✓' : '✗'
  });
  throw new Error('Supabase environment variables are not configured');
}

// Log successful configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase client configured:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 20) + '...'
  });
}

// Enhanced retry logic with exponential backoff
async function fetchWithRetry(url: RequestInfo | URL, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is ok, if not throw to trigger retry
      if (!response.ok && attempt < maxRetries - 1) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries - 1;
      
      // Don't retry on abort errors or network failures on last attempt
      if (isLastAttempt || error.name === 'AbortError') {
        if (isLastAttempt) {
          console.error('❌ Supabase fetch failed after retries:', {
            url: typeof url === 'string' ? url : url.toString(),
            errorName: error?.name || 'Unknown',
            errorMessage: error?.message || String(error),
          });
        }
        throw error;
      }
      
      // Only retry on network errors or 5xx server errors
      const shouldRetry = error.name === 'TypeError' || (error.message && error.message.includes('HTTP 5'));
      
      if (shouldRetry) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5s wait
        console.warn(`🔄 Retry ${attempt + 1}/${maxRetries} in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    },
    fetch: async (url, options = {}) => {
      const maxRetries = 2;
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return response;
          
        } catch (error: any) {
          lastError = error;
          
          // Don't retry on abort or if it's the last attempt
          if (error.name === 'AbortError' || attempt === maxRetries - 1) {
            if (attempt === maxRetries - 1) {
              console.error('❌ Supabase request failed after retries:', {
                url: typeof url === 'string' ? url : 'Request',
                error: error?.message || String(error)
              });
            }
            throw error;
          }
          
          // Only retry on network errors
          if (error.name === 'TypeError' || error.message?.includes('fetch')) {
            const waitTime = 500 * (attempt + 1); // 500ms, 1000ms
            console.warn(`🔄 Retrying request in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        }
      }
      
      throw lastError || new Error('Request failed');
    }
  },
  db: {
    schema: 'public'
  }
});

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      fetch: async (url, options = {}) => {
        const maxRetries = 2;
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            return response;
            
          } catch (error: any) {
            lastError = error;
            
            if (error.name === 'AbortError' || attempt === maxRetries - 1) {
              throw error;
            }
            
            if (error.name === 'TypeError' || error.message?.includes('fetch')) {
              const waitTime = 500 * (attempt + 1);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              throw error;
            }
          }
        }
        
        throw lastError || new Error('Request failed');
      }
    }
  });
}

// Menu RPC helpers
export async function createMenu(mess_id: string, menu_date: string, title?: string, notes?: string) {
  return supabase.rpc('create_menu', { p_mess_id: mess_id, p_menu_date: menu_date, p_title: title || null, p_notes: notes || null });
}

export async function updateMenu(menu_id: string, title?: string, notes?: string, is_active?: boolean) {
  return supabase.rpc('update_menu', { p_menu_id: menu_id, p_title: title || null, p_notes: notes || null, p_is_active: is_active ?? true });
}

export async function deleteMenu(menu_id: string) {
  return supabase.rpc('delete_menu', { p_menu_id: menu_id });
}

// Menu items RPC helpers
export async function createMenuItem(menu_id: string, name: string, description?: string, is_veg = true, price = 0, image_url?: string) {
  return supabase.rpc('create_menu_item', { p_menu_id: menu_id, p_name: name, p_description: description || null, p_is_veg: is_veg, p_price: price, p_image_url: image_url || null });
}

export async function updateMenuItem(item_id: string, name: string, description?: string, is_veg = true, price = 0, image_url?: string) {
  return supabase.rpc('update_menu_item', { p_item_id: item_id, p_name: name, p_description: description || null, p_is_veg: is_veg, p_price: price, p_image_url: image_url || null });
}

export async function deleteMenuItem(item_id: string) {
  return supabase.rpc('delete_menu_item', { p_item_id: item_id });
}

// Fetch a single menu (with items) for a mess and date
export async function fetchMenu(mess_id: string, menu_date: string) {
  return supabase
    .from('menus')
    .select('*, menu_items(*)')
    .eq('mess_id', mess_id)
    .eq('menu_date', menu_date)
    .maybeSingle();
}

// Fetch recent menus for a mess
export async function fetchMenusForMess(mess_id: string) {
  return supabase
    .from('menus')
    .select('*, menu_items(*)')
    .eq('mess_id', mess_id)
    .order('menu_date', { ascending: false });
}

// Fetch active messes
export async function fetchMesses() {
  return supabase
    .from('messes')
    .select('*')
    .eq('is_active', true);
}

// Create a payment record (simulated). For production, integrate with PhonePe flow.
export async function createPayment(user_id: string, mess_id: string, amount: number, subscription_type: string) {
  const transactionId = `local_txn_${Date.now()}`;
  return supabase.from('payments').insert([{ user_id, mess_id, amount, phonepe_transaction_id: transactionId, status: 'success', subscription_type }]);
}

// Create a membership record
export async function createMembership(user_id: string, mess_id: string, subscription_type: string, joining_date: string, expiry_date: string) {
  return supabase.from('mess_members').insert([{ user_id, mess_id, subscription_type, joining_date, expiry_date, payment_status: 'success', is_active: true }]);
}

// Health check utility
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('messes').select('count').limit(1).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
      console.error('❌ Supabase health check failed:', error);
      return { connected: false, error };
    }
    console.log('✅ Supabase connection healthy');
    return { connected: true, data };
  } catch (error) {
    console.error('❌ Supabase health check exception:', error);
    return { connected: false, error };
  }
}