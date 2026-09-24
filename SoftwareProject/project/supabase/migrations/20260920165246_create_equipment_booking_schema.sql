/*
# University Equipment Booking System - Core Schema

## Overview
Creates the relational database structure for a university equipment booking system.
Users (students/staff) can browse equipment, check availability, and make bookings.
Administrators can manage equipment and approve/reject booking requests.

## Tables

### profiles
- Extends Supabase auth.users with role information.
- `id` (uuid, PK, references auth.users) - links to the auth account.
- `full_name` (text) - user's display name.
- `role` (text) - either 'user' or 'admin'. Defaults to 'user'.
- `created_at` (timestamptz) - account creation timestamp.

### equipment
- Stores all bookable university equipment.
- `id` (uuid, PK) - unique equipment identifier.
- `name` (text) - equipment name, required.
- `description` (text) - equipment description, required.
- `category` (text) - e.g. 'Projector', 'Laptop', 'Camera', 'Microphone', 'Tripod'.
- `location` (text) - where the equipment is stored/used.
- `status` (text) - 'available' or 'unavailable'. Defaults to 'available'.
- `image_url` (text, nullable) - optional equipment photo URL.
- `created_at` (timestamptz) - when the equipment record was created.

### bookings
- Stores booking requests linking users to equipment.
- `id` (uuid, PK) - unique booking identifier.
- `user_id` (uuid, FK -> profiles) - who made the booking. Defaults to auth.uid().
- `equipment_id` (uuid, FK -> equipment) - which equipment is booked.
- `start_time` (timestamptz) - booking start.
- `end_time` (timestamptz) - booking end.
- `status` (text) - 'pending', 'approved', 'rejected', or 'cancelled'. Defaults to 'pending'.
- `created_at` (timestamptz) - when the booking request was submitted.

## Security (RLS)

### profiles
- Users can read their own profile.
- Users can update their own profile.
- Admins can read all profiles (needed to view booking owner names).

### equipment
- All authenticated users can read equipment (public catalog).
- Only admins can insert, update, or delete equipment.
- Admin check uses raw_app_meta_data.role = 'admin'.

### bookings
- Users can read their own bookings (SELECT with auth.uid() = user_id).
- Users can insert bookings for themselves (WITH CHECK auth.uid() = user_id).
- Users can update their own bookings (e.g. cancel).
- Admins can read, update, and delete all bookings (to approve/reject).
- Admin check uses raw_app_meta_data.role = 'admin'.

## Conflict Prevention
A trigger function `prevent_booking_conflicts` runs BEFORE INSERT and BEFORE UPDATE
on the bookings table. It rejects any booking whose time range overlaps an existing
'approved' booking for the same equipment. Pending bookings are allowed to coexist
(multiple people can request the same slot; admin resolves by approving one and
rejecting the rest). Once a booking is approved, no other booking (pending or approved)
can overlap it for that equipment.

## Notes
1. Owner columns default to auth.uid() so frontend inserts work without passing user_id.
2. Admin role is stored in raw_app_meta_data (user-immutable), not raw_user_meta_data.
3. The conflict check excludes cancelled/rejected bookings from overlap detection.
*/

-- ===================== PROFILES =====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR auth.jwt() ->> 'raw_app_meta_data' IS NOT NULL AND (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===================== EQUIPMENT =====================
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable')),
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_equipment" ON equipment;
CREATE POLICY "select_equipment"
  ON equipment FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_equipment_admin" ON equipment;
CREATE POLICY "insert_equipment_admin"
  ON equipment FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "update_equipment_admin" ON equipment;
CREATE POLICY "update_equipment_admin"
  ON equipment FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "delete_equipment_admin" ON equipment;
CREATE POLICY "delete_equipment_admin"
  ON equipment FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

-- ===================== BOOKINGS =====================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings"
  ON bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin')
  WITH CHECK (auth.uid() = user_id OR (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "delete_bookings_admin" ON bookings;
CREATE POLICY "delete_bookings_admin"
  ON bookings FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin');

-- ===================== CONFLICT PREVENTION TRIGGER =====================
CREATE OR REPLACE FUNCTION prevent_booking_conflicts()
RETURNS trigger AS $$
BEGIN
  -- Only check against approved bookings (pending bookings can coexist)
  IF EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.equipment_id = NEW.equipment_id
      AND b.id <> NEW.id
      AND b.status = 'approved'
      AND b.start_time < NEW.end_time
      AND b.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'This equipment is already booked for the requested time period. Please choose a different time.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_booking_conflict ON bookings;
CREATE TRIGGER check_booking_conflict
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION prevent_booking_conflicts();

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_bookings_equipment_id ON bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);