// Usage (Windows cmd):
// node scripts/setup-admin-with-mess.js <email> <password> <mess_name>
// Example: node scripts/setup-admin-with-mess.js owner@omsai.com password123 "Om Sai Bhojnalay"

// Load .env.local into process.env if present
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
  const messName = process.argv[4] || 'ओम साई भोजनालय';

  if (!email || !password) {
    console.error('Usage: node scripts/setup-admin-with-mess.js <email> <password> [mess_name]');
    console.error('Example: node scripts/setup-admin-with-mess.js owner@omsai.com password123 "Om Sai Bhojnalay"');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    console.log('Step 1: Creating auth user...');
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

    const user = (createRes && (createRes.user || (createRes.data && createRes.data.user)));
    
    if (createRes && createRes.error) {
      const errCode = createRes.error && createRes.error.code;
      if (errCode === 'email_exists' || createRes.error.message?.includes('already registered')) {
        console.log('User already exists, fetching existing user...');
        const listRes = await supabase.auth.admin.listUsers?.() || await supabase.auth.admin.listUsers?.({});
        const usersArr = (listRes && (listRes.users || (listRes.data && listRes.data.users))) || [];
        const existingUser = usersArr.find((u) => u.email === email);
        
        if (!existingUser) {
          console.error('Could not find existing user');
          process.exit(1);
        }
        
        const userId = existingUser.id;
        console.log('Found existing user:', userId);
        
        // Continue with existing user
        await setupMessAndProfile(supabase, userId, email, messName);
        return;
      }
      
      console.error('Failed to create auth user:', createRes.error);
      process.exit(1);
    }
    
    if (!user) {
      console.error('Failed to create auth user (unexpected response)');
      process.exit(1);
    }

    console.log('✓ Auth user created:', user.id);
    await setupMessAndProfile(supabase, user.id, email, messName);

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

async function setupMessAndProfile(supabase, userId, email, messName) {
  try {
    console.log('\nStep 2: Creating user profile...');
    const { error: profileError } = await supabase.from('users').upsert([
      {
        id: userId,
        name: 'Mess Owner',
        mobile_number: `+91-${Date.now().toString().slice(-10)}`,
        parent_mobile: null,
        photo_url: null,
        role: 'admin',
        mess_id: null, // Will be updated after creating mess
        is_active: true
      }
    ], { onConflict: 'id' });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      process.exit(1);
    }
    console.log('✓ User profile created');

    console.log('\nStep 3: Creating mess...');
    const { data: messData, error: messError } = await supabase
      .from('messes')
      .insert([
        {
          name: messName,
          description: 'Mess managed by ' + email,
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
      // Check if mess already exists for this admin
      const { data: existingMess } = await supabase
        .from('messes')
        .select('id, name')
        .eq('admin_id', userId)
        .maybeSingle();

      if (existingMess) {
        console.log('✓ Mess already exists:', existingMess.name, '(ID:', existingMess.id + ')');
        
        // Update user profile with mess_id
        console.log('\nStep 4: Linking admin to mess...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ mess_id: existingMess.id })
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to link admin to mess:', updateError);
          process.exit(1);
        }
        
        console.log('✓ Admin linked to mess');
        printSuccess(email, messName, existingMess.id);
        return;
      }
      
      console.error('Failed to create mess:', messError);
      process.exit(1);
    }

    const messId = messData.id;
    console.log('✓ Mess created:', messName, '(ID:', messId + ')');

    console.log('\nStep 4: Linking admin to mess...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ mess_id: messId })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to link admin to mess:', updateError);
      process.exit(1);
    }

    console.log('✓ Admin linked to mess');
    printSuccess(email, messName, messId);

  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
}

function printSuccess(email, messName, messId) {
  console.log('\n' + '='.repeat(60));
  console.log('✅ SETUP COMPLETE!');
  console.log('='.repeat(60));
  console.log('Email:', email);
  console.log('Mess:', messName);
  console.log('Mess ID:', messId);
  console.log('\nYou can now:');
  console.log('1. Sign in at /login?role=admin');
  console.log('2. Add members through the Members Management page');
  console.log('3. All members will be associated with this mess');
  console.log('='.repeat(60));
}

main();
