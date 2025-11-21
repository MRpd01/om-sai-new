// Quick test to verify Supabase connection
// Run with: node scripts/test-connection.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('❌ Could not read .env.local file:', err.message);
  process.exit(1);
}

console.log('\n🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✓ Present' : '✗ Missing');
console.log('─'.repeat(50));

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing environment variables!');
  console.log('Please check your .env.local file\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function testConnection() {
  const tests = [
    {
      name: 'Fetch Messes Table',
      fn: () => supabase.from('messes').select('id, name').limit(1)
    },
    {
      name: 'Fetch Users Table',
      fn: () => supabase.from('users').select('count').limit(1)
    },
    {
      name: 'Check Auth Health',
      fn: () => fetch(`${supabaseUrl}/auth/v1/health`)
    }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📝 Test: ${test.name}`);
      const start = Date.now();
      const result = await test.fn();
      const duration = Date.now() - start;
      
      if (result.ok !== undefined) {
        // Fetch response
        if (result.ok) {
          console.log(`   ✅ PASSED (${duration}ms)`);
          passedTests++;
        } else {
          console.log(`   ❌ FAILED: ${result.status} ${result.statusText}`);
        }
      } else {
        // Supabase response
        if (result.error) {
          console.log(`   ❌ FAILED: ${result.error.message}`);
          console.log(`   Code: ${result.error.code}`);
          if (result.error.details) {
            console.log(`   Details: ${result.error.details}`);
          }
        } else {
          console.log(`   ✅ PASSED (${duration}ms)`);
          passedTests++;
        }
      }
    } catch (error) {
      console.log(`   ❌ EXCEPTION:`, error.message);
      if (error.cause) {
        console.log(`   Cause:`, error.cause.code || error.cause.message);
      }
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passedTests}/${tests.length} tests passed\n`);
  
  if (passedTests === tests.length) {
    console.log('✅ All tests passed! Supabase connection is healthy.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check your network and Supabase configuration.\n');
    console.log('Troubleshooting tips:');
    console.log('  1. Check internet connection');
    console.log('  2. Verify Supabase project is active');
    console.log('  3. Check firewall/antivirus settings');
    console.log('  4. Try different network (WiFi vs mobile hotspot)');
    console.log('  5. Visit https://status.supabase.com/');
    console.log('\nSee NETWORK_TROUBLESHOOTING.md for detailed help.\n');
    process.exit(1);
  }
}

testConnection().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
