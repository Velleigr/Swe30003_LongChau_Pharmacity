/*
  # Long Châu Pharmacy Management System Database Schema

  1. New Tables
    - `users` - User authentication and roles
    - `products` - Product catalog with categories
    - `orders` - Customer orders
    - `order_items` - Items within orders
    - `prescriptions` - Prescription records
    - `reviews` - Customer reviews
    - `sales_analytics` - Sales data for manager dashboard

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Manager role has full access to analytics
    - Customers can only access their own data
*/

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'pharmacist', 'manager', 'cashier', 'warehouse')),
  full_name text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  category text NOT NULL,
  image_url text,
  stock_quantity integer DEFAULT 0,
  is_prescription_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered', 'cancelled')),
  delivery_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  pharmacist_id uuid REFERENCES users(id),
  prescription_text text,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  order_id uuid REFERENCES orders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  product_id uuid REFERENCES products(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Sales analytics table
CREATE TABLE IF NOT EXISTS sales_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_sales decimal(10,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  total_customers integer DEFAULT 0,
  popular_category text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only managers can modify products" ON products FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
);

CREATE POLICY "Users can read own orders" ON orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Managers can read all orders" ON orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'pharmacist', 'cashier'))
);

CREATE POLICY "Users can read own order items" ON order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

CREATE POLICY "Users can read own prescriptions" ON prescriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create prescriptions" ON prescriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Pharmacists can read all prescriptions" ON prescriptions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pharmacist', 'manager'))
);

CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only managers can access sales analytics" ON sales_analytics FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
);

-- Insert sample data
INSERT INTO users (email, username, password_hash, role, full_name, phone, address) VALUES
('manager@longchau.com', 'manager', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Nguyễn Văn Manager', '+84901234567', 'Hồ Chí Minh, Vietnam'),
('pharmacist@longchau.com', 'pharmacist', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Trần Thị Pharmacist', '+84901234568', 'Hồ Chí Minh, Vietnam'),
('customer@longchau.com', 'customer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Lê Văn Customer', '+84901234569', 'Hồ Chí Minh, Vietnam');

INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_prescription_required) VALUES
('Paracetamol 500mg', 'Pain reliever and fever reducer', 25000, 'Heart', 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg', 100, false),
('Vitamin C 1000mg', 'Immune system booster', 45000, 'Skin', 'https://images.pexels.com/photos/3683077/pexels-photo-3683077.jpeg', 150, false),
('Aspirin 81mg', 'Heart health medication', 35000, 'Heart', 'https://images.pexels.com/photos/3683073/pexels-photo-3683073.jpeg', 200, false),
('Moisturizing Cream', 'Skin care product for dry skin', 65000, 'Skin', 'https://images.pexels.com/photos/3683081/pexels-photo-3683081.jpeg', 80, false),
('Blood Pressure Monitor', 'Digital blood pressure monitor', 850000, 'Heart', 'https://images.pexels.com/photos/3683076/pexels-photo-3683076.jpeg', 25, false),
('Antibiotics (Amoxicillin)', 'Prescription antibiotic', 120000, 'Heart', 'https://images.pexels.com/photos/3683075/pexels-photo-3683075.jpeg', 50, true);

INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
((SELECT id FROM users WHERE username = 'customer'), (SELECT id FROM products WHERE name = 'Paracetamol 500mg'), 5, 'Very effective for headaches and fever. Quick relief!'),
((SELECT id FROM users WHERE username = 'customer'), (SELECT id FROM products WHERE name = 'Vitamin C 1000mg'), 4, 'Good quality vitamin C. Helps boost immunity during flu season.'),
((SELECT id FROM users WHERE username = 'customer'), (SELECT id FROM products WHERE name = 'Moisturizing Cream'), 5, 'Excellent moisturizer! My skin feels so much better after using this.');

INSERT INTO sales_analytics (date, total_sales, total_orders, total_customers, popular_category) VALUES
('2024-01-15', 2500000, 45, 32, 'Heart'),
('2024-01-14', 1800000, 38, 28, 'Skin'),
('2024-01-13', 3200000, 52, 41, 'Heart'),
('2024-01-12', 2100000, 39, 29, 'Skin'),
('2024-01-11', 2800000, 48, 35, 'Heart');