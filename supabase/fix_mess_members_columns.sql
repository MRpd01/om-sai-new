-- Fix mess_members table - Remove columns that should not exist
-- These columns (email, name, phone) should only be in the users table
-- Email is stored in auth.users, name and phone are in public.users

-- Drop the incorrect columns from mess_members table
ALTER TABLE public.mess_members 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS phone;

-- Verify the correct structure
-- Expected columns in mess_members:
-- - id (uuid)
-- - user_id (uuid) - references users.id
-- - mess_id (uuid) - references messes.id
-- - subscription_type (enum)
-- - payment_status (enum)
-- - joining_date (date)
-- - expiry_date (date)
-- - is_active (boolean)
-- - created_at (timestamp)
-- - updated_at (timestamp)
-- - advance_payment (numeric) - if exists
-- - total_amount_due (numeric) - if exists
-- - payment_type (text) - if exists

-- Verify users table has correct columns
-- Expected columns in users:
-- - id (uuid)
-- - name (text) - NOT NULL
-- - mobile_number (text) - NOT NULL UNIQUE
-- - parent_mobile (text)
-- - photo_url (text)
-- - role (user_role enum)
-- - mess_id (uuid)
-- - is_active (boolean)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- Note: Email is stored in auth.users table, not in public.users
