-- =====================================================
-- SUBSCRIPTION REQUESTS TABLE
-- Users can request subscription approval from admin
-- Admin approves with ₹0 payment
-- =====================================================

-- Create subscription_requests table
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON public.subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_mess ON public.subscription_requests(mess_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view their own subscription requests" ON public.subscription_requests;
CREATE POLICY "Users can view their own subscription requests" ON public.subscription_requests
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own requests
DROP POLICY IF EXISTS "Users can create subscription requests" ON public.subscription_requests;
CREATE POLICY "Users can create subscription requests" ON public.subscription_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all requests for their mess
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

-- Admins can update requests (approve/reject)
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_subscription_request_timestamp ON public.subscription_requests;
CREATE TRIGGER trigger_update_subscription_request_timestamp
    BEFORE UPDATE ON public.subscription_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_request_timestamp();

-- Notifications table (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'subscription_request')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_id UUID, -- Can reference subscription_request.id
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Anyone can insert notifications (for system notifications)
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ SUBSCRIPTION REQUESTS TABLE CREATED!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Users can now:';
    RAISE NOTICE '- Request subscription approval from admin';
    RAISE NOTICE '- Track their request status';
    RAISE NOTICE '';
    RAISE NOTICE 'Admins can:';
    RAISE NOTICE '- View pending subscription requests';
    RAISE NOTICE '- Approve requests with ₹0 payment';
    RAISE NOTICE '- Reject requests with notes';
    RAISE NOTICE '================================================';
END $$;
