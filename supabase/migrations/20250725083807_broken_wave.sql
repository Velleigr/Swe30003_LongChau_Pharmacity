/*
  # Fix user signup RLS policy

  1. Security Changes
    - Add INSERT policy for anonymous users to allow public signup
    - Ensure anon role can create new user accounts
    - Maintain existing security for other operations

  This migration fixes the "new row violates row-level security policy" error
  by allowing anonymous users to insert new records during signup.
*/

-- Allow anonymous users to sign up (insert new users)
CREATE POLICY "Allow anonymous user signup"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);