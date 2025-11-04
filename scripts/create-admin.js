// Usage (Windows cmd):
// set NEXT_PUBLIC_SUPABASE_URL=https://your.supabase.co && set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key && node scripts/create-admin.js pd001q@gmail.com pd@123

// Load .env.local into process.env if present so we don't need to pass secrets on the command line.
const fs = require('fs');
const path = require('path');
try {
  const dotenvPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(dotenvPath)) {
    const raw = fs.readFileSync(dotenvPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z0-9_\.\-]+)\s*=\s*(.*)?\s*$/);
      if (!m) return;
      const key = m[1];
      let val = m[2] || '';
      // remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  }
} catch (e) {
  // ignore errors reading .env.local
}

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    console.log('Creating auth user (service role)...');
    // Use admin API to create user
    const createRes = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Mess Owner',
        language: 'mr'
      }
    });

    // supabase-js v2 may return { data: { user }, error } or { user, error }
    const user = (createRes && (createRes.user || (createRes.data && createRes.data.user)));
    if (createRes && createRes.error) {
      // If user already exists, try to locate and upsert the profile instead of failing.
      const errCode = createRes.error && createRes.error.code;
      if (errCode === 'email_exists') {
        console.log('User already exists — attempting to locate existing auth user and upsert profile.');
        try {
          // List users via admin API and find the matching email
          const listRes = await supabase.auth.admin.listUsers?.() || await supabase.auth.admin.listUsers?.({});
          const usersArr = (listRes && (listRes.users || (listRes.data && listRes.data.users))) || [];
          const existingUser = usersArr.find((u) => u.email === email);
          if (existingUser) {
            const userId = existingUser.id;
            console.log('Found auth user id:', userId);
            console.log('Upserting profile in `users` table...');
            const { data, error } = await supabase.from('users').upsert([
              {
                id: userId,
                name: 'Mess Owner',
                mobile_number: `owner-${Date.now()}`,
                parent_mobile: null,
                photo_url: null,
                role: 'admin',
                mess_id: null,
                is_active: true
              }
            ], { onConflict: ['id'] });

            if (error) {
              console.error('Failed to insert user profile:', error);
              process.exit(1);
            }

            console.log('Profile upserted successfully. Admin user is ready.');
            console.log('You can now sign in at /login?role=admin with:', email);
            process.exit(0);
          } else {
            console.error('Could not find existing auth user by email. Response from listUsers:', listRes);
            process.exit(1);
          }
        } catch (e) {
          console.error('Error while locating existing user:', e);
          process.exit(1);
        }
      }
      console.error('Failed to create auth user (error):', createRes.error);
      process.exit(1);
    }
    if (!user) {
      console.error('Failed to create auth user (unexpected response):', createRes);
      process.exit(1);
    }

    console.log('Auth user created:', user.id);

    console.log('Inserting profile in `users` table...');
    const { data, error } = await supabase.from('users').upsert([
      {
        id: user.id,
        name: 'Mess Owner',
        mobile_number: `owner-${Date.now()}`,
        parent_mobile: null,
        photo_url: null,
        role: 'admin',
        mess_id: null,
        is_active: true
      }
    ], { onConflict: ['id'] });

    if (error) {
      console.error('Failed to insert user profile:', error);
      process.exit(1);
    }

    console.log('Profile upserted successfully. Admin user is ready.');
    console.log('You can now sign in at /login?role=admin with:', email);
  } catch (err) {
    console.error('Unexpected error creating admin:', err);
    process.exit(1);
  }
}

main();
