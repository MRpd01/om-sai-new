-- =====================================================
-- UPDATE SCHEMA FOR PAYMENT TRACKING
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Add missing columns to users table
DO $$ 
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT UNIQUE;
    END IF;
END $$;

-- Add missing columns to mess_members table
DO $$ 
BEGIN
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='email') THEN
        ALTER TABLE public.mess_members ADD COLUMN email TEXT;
    END IF;
    
    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='name') THEN
        ALTER TABLE public.mess_members ADD COLUMN name TEXT;
    END IF;
    
    -- Add phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='phone') THEN
        ALTER TABLE public.mess_members ADD COLUMN phone TEXT;
    END IF;
    
    -- Add photo_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='photo_url') THEN
        ALTER TABLE public.mess_members ADD COLUMN photo_url TEXT;
    END IF;
    
    -- Add advance_payment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='advance_payment') THEN
        ALTER TABLE public.mess_members ADD COLUMN advance_payment DECIMAL(10,2);
    END IF;
    
    -- Add total_amount_due column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='total_amount_due') THEN
        ALTER TABLE public.mess_members ADD COLUMN total_amount_due DECIMAL(10,2);
    END IF;
    
    -- Add payment_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='payment_type') THEN
        ALTER TABLE public.mess_members ADD COLUMN payment_type TEXT CHECK (payment_type IN ('full', 'advance'));
    END IF;
    
    -- Add status column (for active/inactive)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='mess_members' AND column_name='status') THEN
        ALTER TABLE public.mess_members ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Add missing columns to payments table
DO $$ 
BEGIN
    -- Add member_id column to link to mess_members
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='member_id') THEN
        ALTER TABLE public.payments ADD COLUMN member_id UUID REFERENCES public.mess_members(id) ON DELETE CASCADE;
    END IF;
    
    -- Add payment_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='payment_date') THEN
        ALTER TABLE public.payments ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='payment_method') THEN
        ALTER TABLE public.payments ADD COLUMN payment_method TEXT DEFAULT 'phonepe';
    END IF;
    
    -- Add transaction_id column (rename from phonepe_transaction_id for clarity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='transaction_id') THEN
        ALTER TABLE public.payments ADD COLUMN transaction_id TEXT;
    END IF;
    
    -- Add is_advance column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='is_advance') THEN
        ALTER TABLE public.payments ADD COLUMN is_advance BOOLEAN DEFAULT false;
    END IF;
    
    -- Add remaining_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payments' AND column_name='remaining_amount') THEN
        ALTER TABLE public.payments ADD COLUMN remaining_amount DECIMAL(10,2);
    END IF;
END $$;

-- Update RLS policies for mess_members to allow user inserts
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.mess_members;
CREATE POLICY "Users can insert their own membership" ON public.mess_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update RLS policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view payments in their mess" ON public.payments;
CREATE POLICY "Admins can view payments in their mess" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messes 
            WHERE admin_id = auth.uid() 
            AND id = payments.mess_id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.mess_admins 
            WHERE user_id = auth.uid() 
            AND mess_id = payments.mess_id
            AND is_active = true
        )
    );

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_mess_members_email ON public.mess_members(email);
CREATE INDEX IF NOT EXISTS idx_mess_members_phone ON public.mess_members(phone);
CREATE INDEX IF NOT EXISTS idx_mess_members_payment_status ON public.mess_members(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Grant necessary permissions
GRANT ALL ON public.mess_members TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.users TO authenticated;

COMMENT ON COLUMN public.mess_members.advance_payment IS 'Amount paid as advance (if payment_type is advance)';
COMMENT ON COLUMN public.mess_members.total_amount_due IS 'Total amount due for the subscription';
COMMENT ON COLUMN public.mess_members.payment_type IS 'Type of payment: full or advance';
COMMENT ON COLUMN public.payments.is_advance IS 'Whether this payment is an advance payment';
COMMENT ON COLUMN public.payments.remaining_amount IS 'Remaining amount after advance payment';

-- Display success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Schema updated successfully!';
    RAISE NOTICE 'Added columns for payment tracking to mess_members and payments tables.';
    RAISE NOTICE 'Updated RLS policies for user subscriptions.';
END $$;
