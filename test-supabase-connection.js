// Test Supabase Connection
const SUPABASE_URL = 'https://kolxlgrgokgzphdwgdib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHhsZ3Jnb2tnenBoZHdnZGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjQ5ODIsImV4cCI6MjA3NTEwMDk4Mn0.3bsjAeeHTlhBd7Q9WbKJKACx1H466X3aao_ckQeS5ZQ';

console.log('🔍 Testing Supabase Connection...\n');

// Test 1: Basic connectivity
console.log('Test 1: Basic API endpoint check');
fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log(`✅ API Endpoint Status: ${response.status} ${response.statusText}`);
    return response.text();
  })
  .then(data => {
    console.log('Response:', data.substring(0, 200));
  })
  .catch(error => {
    console.error('❌ API Endpoint Error:', error.message);
  });

// Test 2: Auth endpoint
console.log('\nTest 2: Auth endpoint check');
setTimeout(() => {
  fetch(`${SUPABASE_URL}/auth/v1/health`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY
    }
  })
    .then(response => {
      console.log(`✅ Auth Endpoint Status: ${response.status} ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      console.log('Auth Health:', data);
    })
    .catch(error => {
      console.error('❌ Auth Endpoint Error:', error.message);
    });
}, 1000);

// Test 3: Test sign in
console.log('\nTest 3: Test authentication');
setTimeout(() => {
  fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123'
    })
  })
    .then(response => {
      console.log(`Auth Test Status: ${response.status} ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      if (data.error) {
        console.log('Expected auth error (invalid credentials):', data.error_description || data.error);
      } else {
        console.log('Auth response:', data);
      }
    })
    .catch(error => {
      console.error('❌ Auth Test Error:', error.message);
    });
}, 2000);

console.log('\n⏳ Running tests... (please wait 3 seconds)\n');
