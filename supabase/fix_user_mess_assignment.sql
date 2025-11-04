-- =====================================================
-- FIX USER MESS ASSIGNMENT
-- This assigns all users without mess_id to the first available mess
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Step 1: Check if there are any messes in the database
DO $$
DECLARE
    v_mess_count INTEGER;
    v_first_mess_id UUID;
BEGIN
    -- Count existing messes
    SELECT COUNT(*) INTO v_mess_count FROM public.messes WHERE is_active = true;
    
    IF v_mess_count = 0 THEN
        RAISE NOTICE '⚠️  No active mess found! You need to create a mess first.';
        RAISE NOTICE 'An admin user should create a mess, or run the create_default_mess script.';
    ELSE
        -- Get the first active mess
        SELECT id INTO v_first_mess_id FROM public.messes WHERE is_active = true LIMIT 1;
        
        -- Update all users without mess_id
        UPDATE public.users 
        SET mess_id = v_first_mess_id 
        WHERE mess_id IS NULL 
        AND role = 'user';
        
        RAISE NOTICE '✅ Updated users to assign them to mess: %', v_first_mess_id;
        RAISE NOTICE 'All users without mess_id now belong to the first active mess.';
    END IF;
END $$;

-- Step 2: Create a default mess if none exists (for testing)
-- Uncomment the code below if you want to create a default mess

/*
DO $$
DECLARE
    v_admin_id UUID;
    v_mess_id UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO v_admin_id FROM public.users WHERE role = 'admin' LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RAISE NOTICE '⚠️  No admin user found! Cannot create mess without an admin.';
    ELSE
        -- Check if mess already exists
        IF NOT EXISTS (SELECT 1 FROM public.messes WHERE admin_id = v_admin_id) THEN
            -- Create a default mess
            INSERT INTO public.messes (
                name, 
                description, 
                admin_id, 
                pricing,
                is_active
            ) VALUES (
                'ओम साई भोजनालय',
                'Default mess for testing',
                v_admin_id,
                '{"full_month": 2600, "half_month": 1300, "single_morning": 800, "single_evening": 800, "double_time": 2600}'::jsonb,
                true
            ) RETURNING id INTO v_mess_id;
            
            -- Update admin's mess_id
            UPDATE public.users SET mess_id = v_mess_id WHERE id = v_admin_id;
            
            -- Update all users without mess_id
            UPDATE public.users SET mess_id = v_mess_id WHERE mess_id IS NULL AND role = 'user';
            
            RAISE NOTICE '✅ Created default mess: %', v_mess_id;
            RAISE NOTICE '✅ Assigned all users to this mess.';
        ELSE
            RAISE NOTICE '✅ Mess already exists for admin.';
        END IF;
    END IF;
END $$;
*/

-- Display current status
SELECT 
    'User Status' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN mess_id IS NOT NULL THEN 1 END) as users_with_mess,
    COUNT(CASE WHEN mess_id IS NULL THEN 1 END) as users_without_mess
FROM public.users;

SELECT 
    'Mess Status' as info,
    COUNT(*) as total_messes,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_messes
FROM public.messes;
