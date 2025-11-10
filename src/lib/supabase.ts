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

// Create Supabase client with retry configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (url, options = {}) => {
      // Add retry logic for network failures
      return fetch(url, {
        ...options,
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }).catch(error => {
        console.error('🔄 Supabase fetch failed, retrying...', {
          url,
          error: error.message
        });
        // Retry once after 1 second
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fetch(url, options).then(resolve).catch(reject);
          }, 1000);
        });
      });
    }
  }
});

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
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