-- Fix RLS policies to avoid infinite recursion

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create simpler, non-recursive policies

-- Allow users to view their own profile (simple ID comparison)
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile (simple ID comparison)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to view basic user info (for admin functionality)
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert for new user creation (service role only)
CREATE POLICY "users_insert_service" ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Allow delete for service role only
CREATE POLICY "users_delete_service" ON users
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;