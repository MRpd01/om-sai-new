// Test Supabase sign-in from Node to diagnose client/auth issues
// Usage: node scripts/test-signin.js <email> <password>

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local like other scripts
try {
  const dotenvPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(dotenvPath)) {
    const raw = fs.readFileSync(dotenvPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z0-9_\.\-]+)\s*=\s*(.*)?\s*$/);
      if (!m) return;
      const key = m[1];
      let val = m[2] || '';
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  }
} catch (e) {
  // ignore
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error('Usage: node scripts/test-signin.js <email> <password>');
    process.exit(1);
  }

  console.log('Attempting sign-in for', email);
  try {
    const res = await supabase.auth.signInWithPassword({ email, password });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error calling signInWithPassword:', err);
  }
}

main();
