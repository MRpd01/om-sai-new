-- Add admin hierarchy support
-- Owner = Full admin created via script (can add/edit/delete)
-- Sub-admin = Read-only admin created by owner (can only view)

-- Add sub_role column to users table to distinguish owner from sub-admin
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sub_role VARCHAR(20) DEFAULT 'owner' CHECK (sub_role IN ('owner', 'sub_admin'));

-- Update existing admins to be owners
UPDATE public.users 
SET sub_role = 'owner' 
WHERE role = 'admin' AND sub_role IS NULL;

-- Add created_by column to track who created the admin
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_sub_role 
ON public.users(role, sub_role) 
WHERE role = 'admin';

-- Add comment
COMMENT ON COLUMN public.users.sub_role IS 'Admin hierarchy: owner (full access), sub_admin (read-only)';
COMMENT ON COLUMN public.users.created_by IS 'User ID of who created this account (for sub-admins)';

-- Analyze table
ANALYZE public.users;
