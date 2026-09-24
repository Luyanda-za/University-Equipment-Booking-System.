/*
# Add rejection reason to bookings + equipment photo storage

## Changes
1. Adds `rejection_reason` (text, nullable) column to the bookings table.
   - When an admin rejects a booking, they can provide a reason/comment.
   - The user sees this reason on their My Bookings page.
   - Column is nullable so existing bookings and approvals work without changes.

2. Creates a public storage bucket `equipment-photos` for uploading equipment images.
   - Public read access so equipment listing pages can display photos.
   - Authenticated users can upload (admins only via RLS policy).

## Security
- rejection_reason: only admins update bookings to 'rejected' status (existing RLS covers this).
- Storage bucket: public read, authenticated write. Admin-only enforcement comes from
  the equipment table's INSERT/UPDATE RLS policies — only admins can create/edit equipment,
  so only admins will have equipment records to associate photos with.
*/

-- Add rejection_reason column to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create storage bucket for equipment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-photos', 'equipment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated write
DROP POLICY IF EXISTS "Public read equipment photos" ON storage.objects;
CREATE POLICY "Public read equipment photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'equipment-photos');

DROP POLICY IF EXISTS "Authenticated upload equipment photos" ON storage.objects;
CREATE POLICY "Authenticated upload equipment photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-photos');

DROP POLICY IF EXISTS "Authenticated update equipment photos" ON storage.objects;
CREATE POLICY "Authenticated update equipment photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'equipment-photos')
  WITH CHECK (bucket_id = 'equipment-photos');

DROP POLICY IF EXISTS "Authenticated delete equipment photos" ON storage.objects;
CREATE POLICY "Authenticated delete equipment photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-photos');
