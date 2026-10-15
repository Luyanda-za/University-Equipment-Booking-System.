/*
# Create help messages table

## Overview
Creates a table to store help/support messages sent by users to admins.
Users can submit help requests from the Settings page, and admins can view them.

## New Tables
### help_messages
- `id` (uuid, PK) - unique message identifier
- `user_id` (uuid, FK -> profiles) - who sent the message, defaults to auth.uid()
- `subject` (text) - short subject line
- `message` (text) - the help request body
- `status` (text) - 'open' or 'resolved', defaults to 'open'
- `created_at` (timestamptz) - when the message was sent

## Security (RLS)
- Users can read their own help messages (SELECT with auth.uid() = user_id)
- Users can insert their own help messages (WITH CHECK auth.uid() = user_id)
- Users can update their own messages (e.g. mark resolved)
- Admins can read, update all help messages (via is_admin() function)
*/
CREATE TABLE IF NOT EXISTS help_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE help_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_help_messages" ON help_messages;
CREATE POLICY "select_own_help_messages"
  ON help_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_help_messages" ON help_messages;
CREATE POLICY "insert_own_help_messages"
  ON help_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_help_messages" ON help_messages;
CREATE POLICY "update_own_help_messages"
  ON help_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "delete_help_messages_admin" ON help_messages;
CREATE POLICY "delete_help_messages_admin"
  ON help_messages FOR DELETE TO authenticated
  USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_help_messages_user_id ON help_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_help_messages_status ON help_messages(status);
