/*
  # Create Complete Inventory System

  1. New Tables
    - `inventory`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `branch` (text, branch identifier)
      - `quantity` (integer, current stock)
      - `min_threshold` (integer, minimum stock level)
      - `max_threshold` (integer, maximum stock level)
      - `last_updated` (timestamp)
      - `updated_by` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Table Updates
    - Add `inventory_id` column to `products` table
    - Link products to their primary inventory records

  3. Security
    - Enable RLS on `inventory` table
    - Add policies for managers (full access) and pharmacists (branch-specific access)

  4. Sample Data
    - Create inventory records for all products across 11 branches
    - Populate with realistic stock levels and thresholds
    - Link products to their primary inventory records
*/

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  branch text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  min_threshold integer NOT NULL DEFAULT 10,
  max_threshold integer NOT NULL DEFAULT 100,
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory(branch);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_product ON inventory(branch, product_id);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Managers can manage all inventory"
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

CREATE POLICY "Pharmacists can manage branch inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'pharmacist'
      AND users.branch = inventory.branch
    )
  );

CREATE POLICY "Staff can view inventory"
  ON inventory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('cashier', 'warehouse')
    )
  );

-- Insert inventory data for all products across all branches
DO $$
DECLARE
  product_record RECORD;
  branch_name TEXT;
  stock_multiplier DECIMAL;
  base_quantity INTEGER;
  min_thresh INTEGER;
  max_thresh INTEGER;
  branches TEXT[] := ARRAY[
    'hcm-district1', 'hcm-district2', 'hcm-district3', 'hcm-district4',
    'hcm-district5', 'hcm-district6', 'hcm-district7', 'hcm-tanbinh',
    'hcm-binhthanh', 'hcm-govap', 'hcm-thuduc'
  ];
  multipliers DECIMAL[] := ARRAY[0.8, 0.6, 0.7, 0.5, 0.9, 0.4, 0.3, 0.8, 0.6, 0.5, 0.7];
BEGIN
  -- Loop through all products
  FOR product_record IN SELECT * FROM products LOOP
    -- Calculate base quantity based on product price (higher price = lower stock)
    IF product_record.price > 500000 THEN
      base_quantity := 20;
    ELSIF product_record.price > 100000 THEN
      base_quantity := 50;
    ELSE
      base_quantity := 100;
    END IF;
    
    -- Set thresholds based on prescription requirement
    IF product_record.is_prescription_required THEN
      min_thresh := 5;
      max_thresh := base_quantity * 2;
    ELSE
      min_thresh := 10;
      max_thresh := base_quantity * 3;
    END IF;
    
    -- Create inventory for each branch
    FOR i IN 1..array_length(branches, 1) LOOP
      branch_name := branches[i];
      stock_multiplier := multipliers[i];
      
      INSERT INTO inventory (
        product_id,
        branch,
        quantity,
        min_threshold,
        max_threshold,
        last_updated,
        created_at
      ) VALUES (
        product_record.id,
        branch_name,
        FLOOR(base_quantity * stock_multiplier)::INTEGER,
        min_thresh,
        max_thresh,
        now(),
        now()
      );
    END LOOP;
  END LOOP;
END $$;

-- Add inventory_id column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'inventory_id'
  ) THEN
    ALTER TABLE products ADD COLUMN inventory_id uuid REFERENCES inventory(id);
  END IF;
END $$;

-- Create index for inventory_id
CREATE INDEX IF NOT EXISTS idx_products_inventory_id ON products(inventory_id);

-- Update products with their primary inventory_id (using hcm-district1 as primary)
UPDATE products 
SET inventory_id = inventory.id
FROM inventory 
WHERE inventory.product_id = products.id 
AND inventory.branch = 'hcm-district1';

-- Add some low stock scenarios for demonstration
UPDATE inventory 
SET quantity = 3 
WHERE branch = 'hcm-district2' 
AND product_id IN (
  SELECT id FROM products WHERE category = 'Heart' LIMIT 2
);

UPDATE inventory 
SET quantity = 0 
WHERE branch = 'hcm-district6' 
AND product_id IN (
  SELECT id FROM products WHERE category = 'Skin' LIMIT 1
);

UPDATE inventory 
SET quantity = 1 
WHERE branch = 'hcm-district7' 
AND product_id IN (
  SELECT id FROM products WHERE is_prescription_required = true LIMIT 1
);