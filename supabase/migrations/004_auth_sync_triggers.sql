-- Migration: Auth Sync Triggers and Functions
-- Description: Create triggers and functions to automatically sync Supabase Auth users with custom users table

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table when auth.users is created
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user',
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates (especially email confirmation)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user status when email is confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users 
    SET 
      is_active = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  -- Update email if changed
  IF OLD.email != NEW.email THEN
    UPDATE public.users 
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete user in public.users table
  UPDATE public.users 
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Function to manually sync existing auth users
CREATE OR REPLACE FUNCTION public.sync_auth_users()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Loop through all auth users and sync them
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data, email_confirmed_at, created_at
    FROM auth.users
  LOOP
    INSERT INTO public.users (id, email, name, role, is_active, created_at)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', auth_user.email),
      'user',
      CASE 
        WHEN auth_user.email_confirmed_at IS NOT NULL THEN true
        ELSE false
      END,
      auth_user.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync function to sync existing users
SELECT public.sync_auth_users();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_auth_users() TO authenticated;

-- Update RLS policies to allow access for confirmed users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id AND 
    is_active = true
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id AND 
    is_active = true
  );

-- Allow authenticated users to read active users (for admin purposes)
DROP POLICY IF EXISTS "Authenticated users can view active users" ON public.users;
CREATE POLICY "Authenticated users can view active users" ON public.users
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    is_active = true
  );

-- Allow service role to manage all users
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

COMMIT;