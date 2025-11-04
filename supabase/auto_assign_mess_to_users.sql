-- =====================================================
-- AUTO-ASSIGN MESS ID TO NEW USERS
-- Automatically assigns all new users to ओम साई भोजनालय
-- =====================================================

-- Step 1: Create a function that auto-assigns mess_id
CREATE OR REPLACE FUNCTION public.auto_assign_mess_to_user()
RETURNS TRIGGER AS $$
DECLARE
    v_mess_id UUID;
BEGIN
    -- Get the ID of ओम साई भोजनालय (the only mess)
    SELECT id INTO v_mess_id 
    FROM public.messes 
    WHERE name = 'ओम साई भोजनालय' 
    LIMIT 1;
    
    -- If mess exists and user doesn't have a mess_id, assign it
    IF v_mess_id IS NOT NULL AND NEW.mess_id IS NULL THEN
        NEW.mess_id := v_mess_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger that runs BEFORE INSERT on users table
DROP TRIGGER IF EXISTS trigger_auto_assign_mess ON public.users;
CREATE TRIGGER trigger_auto_assign_mess
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_mess_to_user();

-- Step 3: Update existing users who don't have mess_id
DO $$
DECLARE
    v_mess_id UUID;
    v_updated_count INTEGER;
BEGIN
    -- Get the mess ID
    SELECT id INTO v_mess_id 
    FROM public.messes 
    WHERE name = 'ओम साई भोजनालय' 
    LIMIT 1;
    
    IF v_mess_id IS NOT NULL THEN
        -- Update all existing users without mess_id
        UPDATE public.users 
        SET mess_id = v_mess_id 
        WHERE mess_id IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Updated % existing users with mess_id', v_updated_count;
    ELSE
        RAISE NOTICE '⚠️  Mess "ओम साई भोजनालय" not found!';
    END IF;
END $$;

-- Step 4: Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can view their own membership" ON public.mess_members;
CREATE POLICY "Users can view their own membership" ON public.mess_members
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own membership" ON public.mess_members;
CREATE POLICY "Users can insert their own membership" ON public.mess_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Verify setup
SELECT 
    '=== VERIFICATION ===' as section,
    'Total Users' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN mess_id IS NOT NULL THEN 1 END) as assigned,
    COUNT(CASE WHEN mess_id IS NULL THEN 1 END) as unassigned
FROM public.users;

-- Test: Show recent users
SELECT 
    '=== RECENT USERS ===' as section,
    name,
    email,
    role,
    CASE WHEN mess_id IS NOT NULL THEN '✓ Assigned' ELSE '✗ Not Assigned' END as status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ AUTO-ASSIGNMENT SETUP COMPLETE!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'All new users will automatically be assigned to:';
    RAISE NOTICE 'ओम साई भोजनालय';
    RAISE NOTICE '';
    RAISE NOTICE 'No manual assignment needed anymore!';
    RAISE NOTICE '================================================';
END $$;
