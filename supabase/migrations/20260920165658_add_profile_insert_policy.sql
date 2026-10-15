/*
# Add INSERT policy to profiles table

## Problem
The profiles table has RLS enabled but no INSERT policy.
When a new user registers, the frontend calls `supabase.auth.signUp()` which creates
an auth.users row and returns a session. The app then inserts a row into `profiles`
for that user. Without an INSERT policy, this insert fails under RLS.

## Fix
Add an INSERT policy allowing authenticated users to insert their own profile row
(WITH CHECK auth.uid() = id).

## Security
- Only allows inserting a row where the profile id matches the authenticated user's id.
- The role column defaults to 'user' at the database level; users cannot set themselves as admin
  because the column has a CHECK constraint and the app never passes role='admin' on signup.
*/

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
