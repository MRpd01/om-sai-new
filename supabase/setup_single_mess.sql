-- =====================================================
-- SETUP SINGLE MESS: ओम साई भोजनालय
-- This creates one mess and assigns all users to it
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Step 1: Create the mess (if it doesn't exist)
DO $$
DECLARE
    v_admin_id UUID;
    v_mess_id UUID;
    v_mess_exists BOOLEAN;
BEGIN
    -- Check if mess already exists
    SELECT id INTO v_mess_id FROM public.messes WHERE name = 'ओम साई भोजनालय' LIMIT 1;
    
    IF v_mess_id IS NULL THEN
        -- Get the first admin user (or any user with role='admin')
        SELECT id INTO v_admin_id FROM public.users WHERE role = 'admin' LIMIT 1;
        
        -- If no admin exists, create a placeholder admin entry would be needed
        IF v_admin_id IS NULL THEN
            RAISE NOTICE '⚠️  No admin user found in users table!';
            RAISE NOTICE 'Please ensure at least one user has role=admin, then run this script again.';
            RAISE EXCEPTION 'Cannot create mess without an admin user';
        END IF;
        
        -- Create the single mess
        INSERT INTO public.messes (
            name, 
            description, 
            admin_id, 
            pricing,
            is_active
        ) VALUES (
            'ओम साई भोजनालय',
            'Your trusted mess for quality food',
            v_admin_id,
            jsonb_build_object(
                'full_month', 2600,
                'half_month', 1300,
                'single_time', 1500,
                'double_time', 2600
            ),
            true
        ) RETURNING id INTO v_mess_id;
        
        RAISE NOTICE '✅ Created mess: ओम साई भोजनालय (ID: %)', v_mess_id;
        
        -- Update the admin user's mess_id
        UPDATE public.users 
        SET mess_id = v_mess_id 
        WHERE id = v_admin_id;
        
        RAISE NOTICE '✅ Assigned admin to mess';
    ELSE
        RAISE NOTICE '✅ Mess already exists: % (ID: %)', 'ओम साई भोजनालय', v_mess_id;
    END IF;
    
    -- Step 2: Assign ALL users (both admin and regular users) to this mess
    UPDATE public.users 
    SET mess_id = v_mess_id 
    WHERE mess_id IS NULL OR mess_id != v_mess_id;
    
    RAISE NOTICE '✅ All users now assigned to: ओम साई भोजनालय';
    
END $$;

-- Step 3: Display current status
SELECT 
    '=== USER STATUS ===' as section,
    role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN mess_id IS NOT NULL THEN 1 END) as users_with_mess
FROM public.users
GROUP BY role;

SELECT 
    '=== MESS STATUS ===' as section,
    name,
    is_active,
    (SELECT COUNT(*) FROM public.users WHERE mess_id = messes.id) as total_members
FROM public.messes;

SELECT 
    '=== SUBSCRIPTIONS ===' as section,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as paid_subscriptions,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as advance_paid,
    COUNT(CASE WHEN payment_status = 'due' THEN 1 END) as unpaid_subscriptions
FROM public.mess_members;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ SINGLE MESS SETUP COMPLETE!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Mess Name: ओम साई भोजनालय';
    RAISE NOTICE 'All users are now assigned to this mess.';
    RAISE NOTICE 'Users can now subscribe to mess plans.';
    RAISE NOTICE '==============================================';
END $$;
