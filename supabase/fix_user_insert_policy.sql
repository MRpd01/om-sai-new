-- Fix: Add INSERT policy for users table
-- This allows authenticated users to create their own profile after signup

-- Drop existing policies if needed (optional - only if recreating)
-- DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;

-- Add INSERT policy so users can create their profile
CREATE POLICY "Users can create their own profile" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Also ensure service role can insert users (for API routes)
-- Service role automatically bypasses RLS, so this is just for clarity
