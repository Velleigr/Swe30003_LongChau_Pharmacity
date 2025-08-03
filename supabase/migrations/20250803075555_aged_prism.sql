/*
  # Create Inventory table with branch support

  1. New Tables
    - `inventory`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `branch` (text, branch identifier like hcm-district1, hcm-district3)
      - `quantity` (integer, stock quantity for this branch)
      - `min_threshold` (integer, minimum stock threshold)
      - `max_threshold` (integer, maximum stock threshold)
      - `last_updated` (timestamp)
      - `updated_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `inventory` table
    - Add policy for managers to access all inventory
    - Add policy for pharmacists to access their branch inventory

  3. Sample Data
    - Populate inventory for all branches and existing products
*/

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  min_threshold integer DEFAULT 10,
  max_threshold integer DEFAULT 1000,
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique product per branch
  UNIQUE(product_id, branch),
  
  -- Check constraints
  CONSTRAINT inventory_quantity_check CHECK (quantity >= 0),
  CONSTRAINT inventory_min_threshold_check CHECK (min_threshold >= 0),
  CONSTRAINT inventory_max_threshold_check CHECK (max_threshold >= min_threshold),
  CONSTRAINT inventory_branch_check CHECK (branch IN (
    'hcm-district1', 'hcm-district2', 'hcm-district3', 'hcm-district4', 
    'hcm-district5', 'hcm-district6', 'hcm-district7', 'hcm-tanbinh', 
    'hcm-binhthanh', 'hcm-govap', 'hcm-thuduc'
  ))
);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_branch ON inventory(product_id, branch);
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory(branch);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_last_updated ON inventory(last_updated DESC);

-- RLS Policies
CREATE POLICY "Managers can access all inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Pharmacists can access their branch inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'pharmacist'
      AND users.branch = inventory.branch
    )
  );

CREATE POLICY "Pharmacists can update their branch inventory"
  ON inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'pharmacist'
      AND users.branch = inventory.branch
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'pharmacist'
      AND users.branch = inventory.branch
    )
  );

-- Insert sample inventory data for all branches and products
INSERT INTO inventory (product_id, branch, quantity, min_threshold, max_threshold, updated_by)
SELECT 
  p.id as product_id,
  b.branch,
  CASE 
    WHEN b.branch = 'hcm-district1' THEN GREATEST(0, (p.stock_quantity * 0.8)::integer)
    WHEN b.branch = 'hcm-district2' THEN GREATEST(0, (p.stock_quantity * 0.6)::integer)
    WHEN b.branch = 'hcm-district3' THEN GREATEST(0, (p.stock_quantity * 0.7)::integer)
    WHEN b.branch = 'hcm-district4' THEN GREATEST(0, (p.stock_quantity * 0.5)::integer)
    WHEN b.branch = 'hcm-district5' THEN GREATEST(0, (p.stock_quantity * 0.9)::integer)
    WHEN b.branch = 'hcm-district6' THEN GREATEST(0, (p.stock_quantity * 0.4)::integer)
    WHEN b.branch = 'hcm-district7' THEN GREATEST(0, (p.stock_quantity * 0.3)::integer)
    WHEN b.branch = 'hcm-tanbinh' THEN GREATEST(0, (p.stock_quantity * 0.8)::integer)
    WHEN b.branch = 'hcm-binhthanh' THEN GREATEST(0, (p.stock_quantity * 0.6)::integer)
    WHEN b.branch = 'hcm-govap' THEN GREATEST(0, (p.stock_quantity * 0.5)::integer)
    WHEN b.branch = 'hcm-thuduc' THEN GREATEST(0, (p.stock_quantity * 0.7)::integer)
    ELSE p.stock_quantity
  END as quantity,
  CASE 
    WHEN p.is_prescription_required THEN 5
    ELSE 10
  END as min_threshold,
  CASE 
    WHEN p.price > 200000 THEN 100
    WHEN p.price > 100000 THEN 200
    ELSE 500
  END as max_threshold,
  (SELECT id FROM users WHERE role = 'manager' LIMIT 1) as updated_by
FROM products p
CROSS JOIN (
  VALUES 
    ('hcm-district1'),
    ('hcm-district2'),
    ('hcm-district3'),
    ('hcm-district4'),
    ('hcm-district5'),
    ('hcm-district6'),
    ('hcm-district7'),
    ('hcm-tanbinh'),
    ('hcm-binhthanh'),
    ('hcm-govap'),
    ('hcm-thuduc')
) AS b(branch)
ON CONFLICT (product_id, branch) DO NOTHING;