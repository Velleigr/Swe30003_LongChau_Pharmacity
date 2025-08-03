/*
  # Create prescription notifications table

  1. New Tables
    - `prescription_notifications`
      - `id` (uuid, primary key)
      - `prescription_id` (uuid, foreign key to prescriptions)
      - `pharmacist_id` (uuid, foreign key to users)
      - `patient_name` (text)
      - `notification_type` (text, default 'email')
      - `sent_at` (timestamp)
      - `status` (text, default 'sent')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `prescription_notifications` table
    - Add policy for pharmacists to read their own notifications
    - Add policy for managers to read all notifications

  3. Indexes
    - Add index on prescription_id for faster lookups
    - Add index on pharmacist_id for faster filtering
*/

CREATE TABLE IF NOT EXISTS prescription_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL,
  pharmacist_id uuid NOT NULL,
  patient_name text NOT NULL,
  notification_type text DEFAULT 'email',
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT prescription_notifications_prescription_id_fkey 
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  CONSTRAINT prescription_notifications_pharmacist_id_fkey 
    FOREIGN KEY (pharmacist_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT prescription_notifications_notification_type_check 
    CHECK (notification_type IN ('email', 'sms', 'push')),
  CONSTRAINT prescription_notifications_status_check 
    CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Enable Row Level Security
ALTER TABLE prescription_notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescription_notifications_prescription_id 
  ON prescription_notifications(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_notifications_pharmacist_id 
  ON prescription_notifications(pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_prescription_notifications_sent_at 
  ON prescription_notifications(sent_at DESC);

-- RLS Policies
CREATE POLICY "Pharmacists can read their own notifications"
  ON prescription_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'pharmacist'
      AND users.id = prescription_notifications.pharmacist_id
    )
  );

CREATE POLICY "Managers can read all notifications"
  ON prescription_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

CREATE POLICY "System can insert notifications"
  ON prescription_notifications
  FOR INSERT
  TO authenticated
  USING (true);