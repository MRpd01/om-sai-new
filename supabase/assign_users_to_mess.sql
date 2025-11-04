-- =====================================================
-- ASSIGN ALL USERS TO MESS & FIX POLICIES
-- Quick fix to assign all users to ओम साई भोजनालय
-- and ensure RLS policies allow user subscriptions
-- =====================================================

-- Step 1: Assign all users to the mess
DO $$
DECLARE
    v_mess_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get the mess ID
    SELECT id INTO v_mess_id FROM public.messes WHERE name = 'ओम साई भोजनालय' LIMIT 1;
    
    IF v_mess_id IS NULL THEN
        RAISE EXCEPTION 'Mess "ओम साई भोजनालय" not found! Please create it first.';
    END IF;
    
    -- Update ALL users to have this mess_id
    UPDATE public.users 
    SET mess_id = v_mess_id 
    WHERE mess_id IS NULL OR mess_id != v_mess_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Updated % users to mess: %', v_updated_count, v_mess_id;
    RAISE NOTICE 'All users now belong to: ओम साई भोजनालय';
END $$;

-- Step 2: Ensure RLS policies allow users to view their own subscription
DROP POLICY IF EXISTS "Users can view their own membership" ON public.mess_members;
CREATE POLICY "Users can view their own membership" ON public.mess_members
    FOR SELECT USING (user_id = auth.uid());

-- Ensure users can insert their own subscription
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.mess_members;
CREATE POLICY "Users can insert their own membership" ON public.mess_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Verify the update
SELECT 
    'Total Users' as info,
    COUNT(*) as count,
    COUNT(CASE WHEN mess_id IS NOT NULL THEN 1 END) as users_with_mess
FROM public.users;

-- Show user details
SELECT 
    id,
    name,
    email,
    role,
    CASE WHEN mess_id IS NOT NULL THEN '✓ Assigned' ELSE '✗ Not Assigned' END as mess_status
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Show existing subscriptions
SELECT 
    'Subscriptions' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as paid,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as advance,
    COUNT(CASE WHEN payment_status = 'due' THEN 1 END) as unpaid
FROM public.mess_members;

RAISE NOTICE '✅ Setup complete! Users can now subscribe to mess plans.';

