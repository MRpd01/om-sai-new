-- =====================================================
-- FIX EMAIL STORAGE AND SUBSCRIPTION REQUESTS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add email column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT UNIQUE;
        RAISE NOTICE '✅ Added email column to users table';
    ELSE
        RAISE NOTICE 'ℹ️ Email column already exists in users table';
    END IF;
END $$;

-- 2. Add INSERT policy for users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can create their own profile'
    ) THEN
        CREATE POLICY "Users can create their own profile" ON public.users
            FOR INSERT 
            WITH CHECK (auth.uid() = id);
        RAISE NOTICE '✅ Added INSERT policy for users table';
    ELSE
        RAISE NOTICE 'ℹ️ INSERT policy already exists for users table';
    END IF;
END $$;

-- 3. Create subscription_requests table
CREATE TABLE IF NOT EXISTS public.subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    requested_plan subscription_type NOT NULL,
    requested_join_date DATE NOT NULL,
    request_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON public.subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_mess ON public.subscription_requests(mess_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_requests
DROP POLICY IF EXISTS "Users can view their own subscription requests" ON public.subscription_requests;
CREATE POLICY "Users can view their own subscription requests" ON public.subscription_requests
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create subscription requests" ON public.subscription_requests;
CREATE POLICY "Users can create subscription requests" ON public.subscription_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view subscription requests" ON public.subscription_requests;
CREATE POLICY "Admins can view subscription requests" ON public.subscription_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.mess_id = subscription_requests.mess_id
        )
    );

DROP POLICY IF EXISTS "Admins can update subscription requests" ON public.subscription_requests;
CREATE POLICY "Admins can update subscription requests" ON public.subscription_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.mess_id = subscription_requests.mess_id
        )
    );

-- Trigger function
CREATE OR REPLACE FUNCTION update_subscription_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_request_timestamp ON public.subscription_requests;
CREATE TRIGGER trigger_update_subscription_request_timestamp
    BEFORE UPDATE ON public.subscription_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_request_timestamp();

-- 4. Create/update notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'subscription_request')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ DATABASE UPDATE COMPLETE!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✓ Email column added to users table';
    RAISE NOTICE '✓ INSERT policy added for user profiles';
    RAISE NOTICE '✓ Subscription requests table created';
    RAISE NOTICE '✓ Notifications table created';
    RAISE NOTICE '✓ All RLS policies configured';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test adding a new member with email';
    RAISE NOTICE '2. Test subscription request flow';
    RAISE NOTICE '3. Verify email appears in member profile';
    RAISE NOTICE '================================================';
END $$;
