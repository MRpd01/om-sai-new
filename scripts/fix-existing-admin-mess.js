// Usage (Windows cmd):
// node scripts/fix-existing-admin-mess.js <admin_email> [mess_name]
// Example: node scripts/fix-existing-admin-mess.js owner@omsai.com "Om Sai Bhojnalay"

// Load .env.local
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
  }
} catch (e) {
  // ignore
}

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
  }

  const adminEmail = process.argv[2];
  const messName = process.argv[3] || 'ओम साई भोजनालय';

  if (!adminEmail) {
    console.error('Usage: node scripts/fix-existing-admin-mess.js <admin_email> [mess_name]');
    console.error('Example: node scripts/fix-existing-admin-mess.js owner@omsai.com "Om Sai Bhojnalay"');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    console.log('Step 1: Finding admin user...');
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id, name, mess_id, role')
      .eq('id', adminEmail.includes('@') ? '00000000-0000-0000-0000-000000000000' : adminEmail) // dummy query
      .maybeSingle();

    // If email lookup failed, try to get user from auth.users
    const listRes = await supabase.auth.admin.listUsers();
    const usersArr = (listRes && (listRes.users || (listRes.data && listRes.data.users))) || [];
    const authUser = usersArr.find((u) => u.email === adminEmail);

    if (!authUser) {
      console.error('No user found with email:', adminEmail);
      console.error('Available users:');
      usersArr.forEach(u => console.log(' -', u.email, '(ID:', u.id + ')'));
      process.exit(1);
    }

    const userId = authUser.id;
    console.log('✓ Found admin user:', userId);

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, mess_id, role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Admin profile not found in users table. Creating...');
      const { error: createError } = await supabase.from('users').insert([
        {
          id: userId,
          name: 'Mess Owner',
          mobile_number: `+91-${Date.now().toString().slice(-10)}`,
          role: 'admin',
          mess_id: null,
          is_active: true
        }
      ]);
      
      if (createError) {
        console.error('Failed to create profile:', createError);
        process.exit(1);
      }
      console.log('✓ Profile created');
    } else {
      console.log('✓ Profile exists. Role:', profile.role, 'Mess ID:', profile.mess_id || 'null');
    }

    // Check if mess already exists
    console.log('\nStep 2: Checking for existing mess...');
    const { data: existingMess } = await supabase
      .from('messes')
      .select('id, name')
      .eq('admin_id', userId)
      .maybeSingle();

    let messId;
    if (existingMess) {
      console.log('✓ Mess already exists:', existingMess.name, '(ID:', existingMess.id + ')');
      messId = existingMess.id;
    } else {
      console.log('Creating new mess...');
      const { data: messData, error: messError } = await supabase
        .from('messes')
        .insert([
          {
            name: messName,
            description: 'Mess managed by ' + adminEmail,
            admin_id: userId,
            pricing: {
              full_month: 2600,
              half_month: 1300,
              single_morning: 800,
              single_evening: 800,
              double_time: 2600
            },
            is_active: true
          }
        ])
        .select()
        .single();

      if (messError) {
        console.error('Failed to create mess:', messError);
        process.exit(1);
      }

      messId = messData.id;
      console.log('✓ Mess created:', messName, '(ID:', messId + ')');
    }

    // Link admin to mess
    console.log('\nStep 3: Linking admin to mess...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ mess_id: messId })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to link admin to mess:', updateError);
      process.exit(1);
    }

    console.log('✓ Admin linked to mess');

    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log('Admin Email:', adminEmail);
    console.log('Admin ID:', userId);
    console.log('Mess ID:', messId);
    console.log('\nThe members page should now work correctly!');
    console.log('Sign out and sign in again to reload the profile.');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
