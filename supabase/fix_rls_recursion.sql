-- =============================================
-- FIX: Infinite Recursion in profiles RLS Policy
-- =============================================
-- The error "infinite recursion detected in policy for relation 'profiles'" (42P17)
-- occurs when a RLS policy on the profiles table queries the profiles table itself.
-- 
-- Solution: Use auth.uid() directly (which doesn't trigger RLS) instead of
-- querying the profiles table from within its own policy.
--
-- Run this ENTIRE script in Supabase SQL Editor.
-- =============================================

-- Step 1: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "admin_read_all" ON profiles;
DROP POLICY IF EXISTS "admin_update_all" ON profiles;

-- Step 2: Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SIMPLE policies using auth.uid() only (NO subqueries on profiles!)

-- Allow users to read their own profile
CREATE POLICY "users_read_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to insert their own profile
CREATE POLICY "users_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 4: Admin access using service role key (bypasses RLS automatically)
-- Since the API routes use the service role key on the server, they bypass RLS.
-- No admin-specific RLS policy needed — the server handles admin checks in code.

-- Step 5: Grant the service_role full access (for API routes)
-- This is usually already set, but let's be explicit:
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO authenticated;

-- =============================================
-- VERIFY: Run this to check the policies
-- =============================================
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
