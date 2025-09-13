/*
  # Fix RLS Policies for Mock Authentication

  1. Security Updates
    - Update RLS policies to work with both real auth and mock auth
    - Use COALESCE to handle both auth.uid() and mock user scenarios
    - Maintain security while allowing development with mock users

  2. Policy Updates
    - Update all table policies to handle mock authentication
    - Ensure policies work for both authenticated and mock users
    - Keep the same security model but make it compatible with development
*/

-- Drop existing policies and recreate them to work with mock auth
DROP POLICY IF EXISTS "Users can manage their own pets" ON pets;
DROP POLICY IF EXISTS "Users can manage their own foods" ON foods;
DROP POLICY IF EXISTS "Users can manage their own feeding entries" ON feeding_entries;
DROP POLICY IF EXISTS "Users can manage their own weight entries" ON weight_entries;

-- Create new policies that work with both real auth and mock auth
CREATE POLICY "Users can manage their own pets"
  ON pets
  FOR ALL
  TO authenticated
  USING (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text)
  WITH CHECK (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text);

CREATE POLICY "Users can manage their own foods"
  ON foods
  FOR ALL
  TO authenticated
  USING (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text)
  WITH CHECK (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text);

CREATE POLICY "Users can manage their own feeding entries"
  ON feeding_entries
  FOR ALL
  TO authenticated
  USING (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text)
  WITH CHECK (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text);

CREATE POLICY "Users can manage their own weight entries"
  ON weight_entries
  FOR ALL
  TO authenticated
  USING (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text)
  WITH CHECK (COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub') = user_id::text);

-- Alternative approach: Create a function to get the current user ID that works with mock auth
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.uid(),
    CASE 
      WHEN current_setting('request.jwt.claims', true)::json->>'sub' IS NOT NULL 
      THEN (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      ELSE NULL
    END
  );
$$;

-- Drop the complex policies and create simpler ones using the function
DROP POLICY IF EXISTS "Users can manage their own pets" ON pets;
DROP POLICY IF EXISTS "Users can manage their own foods" ON foods;
DROP POLICY IF EXISTS "Users can manage their own feeding entries" ON feeding_entries;
DROP POLICY IF EXISTS "Users can manage their own weight entries" ON weight_entries;

-- Recreate policies using the helper function
CREATE POLICY "Users can manage their own pets"
  ON pets
  FOR ALL
  USING (get_current_user_id() = user_id)
  WITH CHECK (get_current_user_id() = user_id);

CREATE POLICY "Users can manage their own foods"
  ON foods
  FOR ALL
  USING (get_current_user_id() = user_id)
  WITH CHECK (get_current_user_id() = user_id);

CREATE POLICY "Users can manage their own feeding entries"
  ON feeding_entries
  FOR ALL
  USING (get_current_user_id() = user_id)
  WITH CHECK (get_current_user_id() = user_id);

CREATE POLICY "Users can manage their own weight entries"
  ON weight_entries
  FOR ALL
  USING (get_current_user_id() = user_id)
  WITH CHECK (get_current_user_id() = user_id);