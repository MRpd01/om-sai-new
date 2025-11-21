-- Database Performance Optimization Indexes
-- Run this in Supabase SQL Editor to improve dashboard performance

-- 1. Optimize mess_members queries (most frequent)
CREATE INDEX IF NOT EXISTS idx_mess_members_active_status 
ON public.mess_members(is_active, payment_status, expiry_date)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_mess_members_expiry 
ON public.mess_members(expiry_date DESC)
WHERE expiry_date IS NOT NULL;

-- 2. Optimize payments queries
CREATE INDEX IF NOT EXISTS idx_payments_status_created 
ON public.payments(status, created_at DESC)
WHERE status = 'success';

CREATE INDEX IF NOT EXISTS idx_payments_created_month
ON public.payments(date_trunc('month', created_at), status)
WHERE status = 'success';

-- 3. Optimize subscription_requests queries
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status 
ON public.subscription_requests(status, created_at DESC)
WHERE status IN ('pending', 'approved', 'rejected');

-- 4. Optimize users table queries
CREATE INDEX IF NOT EXISTS idx_users_role_active 
ON public.users(role, is_active)
WHERE is_active = true;

-- 5. Add composite index for member lookups
CREATE INDEX IF NOT EXISTS idx_mess_members_user_mess 
ON public.mess_members(user_id, mess_id, is_active);

-- Analyze tables to update statistics
ANALYZE public.mess_members;
ANALYZE public.payments;
ANALYZE public.users;
ANALYZE public.subscription_requests;

-- View index usage (for monitoring)
-- Run this query periodically to ensure indexes are being used:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/
