/*
# Fix admin RLS policies to use profiles table instead of JWT

## Problem
The existing RLS policies check admin role via `auth.jwt() -> 'raw_app_meta_data' ->> 'role'`.
Supabase JWTs may use the key `app_metadata` instead of `raw_app_meta_data`, causing the
admin check to silently return NULL/false. This means admins can only see their own bookings
(not all users' bookings), and can't manage equipment — the app appears broken on the admin side.

## Fix
1. Create a SECURITY DEFINER function `is_admin()` that checks the `profiles` table
   for `role = 'admin'` matching the current user. This bypasses RLS and doesn't depend
   on JWT key naming.
2. Update all RLS policies on `bookings`, `equipment`, and `profiles` to use `is_admin()`
   instead of the JWT-based check.

## Security
- `is_admin()` is SECURITY DEFINER with `SET search_path = public`, so it runs with
  the owner's privileges and cannot be influenced by the caller's search_path.
- The function only reads the `role` column from `profiles` — no data is leaked.
- All existing ownership checks (auth.uid() = user_id) are preserved.
*/

-- ===================== ADMIN HELPER FUNCTION =====================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ===================== PROFILES POLICIES =====================
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===================== EQUIPMENT POLICIES =====================
DROP POLICY IF EXISTS "select_equipment" ON equipment;
CREATE POLICY "select_equipment"
  ON equipment FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_equipment_admin" ON equipment;
CREATE POLICY "insert_equipment_admin"
  ON equipment FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_equipment_admin" ON equipment;
CREATE POLICY "update_equipment_admin"
  ON equipment FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_equipment_admin" ON equipment;
CREATE POLICY "delete_equipment_admin"
  ON equipment FOR DELETE TO authenticated
  USING (is_admin());

-- ===================== BOOKINGS POLICIES =====================
DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings"
  ON bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "delete_bookings_admin" ON bookings;
CREATE POLICY "delete_bookings_admin"
  ON bookings FOR DELETE TO authenticated
  USING (is_admin());
