# Network Connectivity Troubleshooting Guide

## Error Summary
You're experiencing **Connect Timeout Errors** when trying to connect to Supabase. This is a network connectivity issue, not a code bug.

## Root Cause
```
Error [ConnectTimeoutError]: Connect Timeout Error
code: 'UND_ERR_CONNECT_TIMEOUT'
```

This means your application cannot reach the Supabase servers within the timeout period (30 seconds).

## Improvements Made

### 1. Enhanced Retry Logic (`src/lib/supabase.ts`)
- ✅ Implemented exponential backoff retry mechanism
- ✅ Up to 3 retry attempts with increasing delays (1s, 2s, 4s)
- ✅ Better error logging with detailed information
- ✅ 30-second timeout per request

### 2. API Route Improvements (`src/pages/api/members.ts`)
- ✅ Added 25-second timeout for API calls
- ✅ Better error logging with error codes
- ✅ Proper error handling for auth failures

### 3. Dashboard Error Logging (`src/app/dashboard/page.tsx`)
- ✅ Detailed error messages showing:
  - Error message
  - Error code
  - Error details
  - Error hints

### 4. Auth Context Improvements (`src/contexts/AuthContext.tsx`)
- ✅ Better profile fetch error logging
- ✅ User ID included in error logs for debugging

## Troubleshooting Steps

### 1. Check Your Internet Connection
```bash
# Test if you can reach Supabase
ping supabase.co

# Test DNS resolution
nslookup [your-project].supabase.co
```

### 2. Check Supabase Status
Visit: https://status.supabase.com/
- Check if there are any ongoing incidents
- Verify your region is operational

### 3. Verify Environment Variables
Check your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 4. Check Firewall/Proxy Settings
- Corporate networks may block Supabase
- VPN might be interfering
- Antivirus/firewall might be blocking connections
- Try disabling temporarily to test

### 5. Test Supabase Connection
```bash
# In your project directory
npm run dev

# In browser console (http://localhost:3000)
fetch('https://[your-project].supabase.co/rest/v1/')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)
```

### 6. Check Network Logs
Open Chrome DevTools (F12):
1. Go to Network tab
2. Filter by "supabase"
3. Look for:
   - Failed requests (red)
   - Long pending times (gray)
   - Status codes (401, 403, 500, etc.)

## Common Solutions

### Solution 1: Restart Development Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Solution 2: Clear Browser Cache
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear site data in DevTools

### Solution 3: Check if Using Correct Supabase URL
```bash
# Should NOT include /auth/v1 or /rest/v1
# Correct:   https://abcdefgh.supabase.co
# Incorrect: https://abcdefgh.supabase.co/auth/v1
```

### Solution 4: Try Different Network
- Switch from WiFi to mobile hotspot
- Test on different network to rule out ISP issues

### Solution 5: Update Supabase Client
```bash
npm update @supabase/supabase-js
npm update @supabase/ssr
```

## Monitoring Improvements

### New Error Log Format
Errors now show detailed information:

```javascript
❌ Error fetching members: {
  message: "Failed to fetch",
  code: "PGRST301",
  details: "...",
  hint: "..."
}
```

### Retry Attempts Logged
```javascript
🔄 Supabase fetch failed (attempt 1/3), retrying in 1000ms...
🔄 Supabase fetch failed (attempt 2/3), retrying in 2000ms...
❌ All Supabase fetch attempts failed
```

## If Issue Persists

### 1. Check Supabase Dashboard
- Go to https://supabase.com/dashboard
- Check project status
- Verify billing/plan limits
- Check if project is paused

### 2. Contact Your Network Admin
If on corporate/school network:
- Request whitelisting for `*.supabase.co`
- Request whitelisting for `*.supabase.io`

### 3. Temporary Workaround
Use local development Supabase instance:
```bash
npx supabase start
# Update .env.local with local URLs
```

### 4. Check System Time
Incorrect system time can cause SSL/TLS errors:
- Verify your computer's date/time is correct
- Sync with internet time server

## Expected Behavior

### Successful Connection Logs:
```
✅ Supabase client configured
✅ Supabase connection healthy
```

### Failed Connection Logs:
```
❌ Supabase fetch failed
❌ Error fetching members
❌ Profile fetch error
```

## Additional Resources

- [Supabase Status](https://status.supabase.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
- [Network Error Debugging Guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful)

## Quick Test Script

Create `test-connection.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('messes')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful!', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testConnection();
```

Run with:
```bash
node test-connection.js
```
