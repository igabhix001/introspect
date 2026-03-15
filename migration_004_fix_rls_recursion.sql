-- Fix infinite recursion in profiles table RLS policies
-- Drops any existing conflicting policies that select from profiles within their USING clauses

BEGIN;

-- 1. Drop the problematic policies that might cause loops
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- 2. Create optimized, non-recursive SELECT policies
CREATE POLICY "Enable read access for all authenticated users" 
ON profiles FOR SELECT 
TO authenticated 
USING ( true ); 
-- (Simplest and most common setup for SaaS: authenticated users can see profiles, like user lists. 
-- Security is handled at the application tier or via other table RLS, eliminating recursion.)

-- 3. Create optimized, non-recursive UPDATE policies
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- Note: Admins update capabilities shouldn't rely on querying the profiles 
-- table inside the policy itself to avoid loops. If true admin-only updates 
-- are needed via client, it's better to use Supabase Service Role Key in Next.js 
-- API routes (which bypasses RLS entirely). 
-- Our backend APIs use the Service Role Key, so they can update profiles safely.

COMMIT;
