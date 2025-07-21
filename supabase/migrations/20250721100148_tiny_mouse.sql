/*
  # Fix sample data insertion

  1. New Tables Data
    - Insert sample users with different roles (using UPSERT to avoid duplicates)
    - Insert sample products for Heart and Skin categories
    - Insert sample reviews from customers
    - Insert sample sales analytics data

  2. Security
    - All tables already have RLS enabled
    - Policies are already in place for proper access control
*/

-- Insert sample users (using UPSERT to avoid duplicates)
INSERT INTO users (id, email, username, password_hash, role, full_name, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'manager@longchau.com', 'manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Nguyễn Văn Quản Lý', '0901234567', '123 Nguyễn Huệ, Q.1, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440001', 'pharmacist@longchau.com', 'pharmacist', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Trần Thị Dược Sĩ', '0901234568', '456 Lê Lợi, Q.1, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440002', 'customer1@gmail.com', 'customer1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Lê Văn Khách', '0901234569', '789 Hai Bà Trưng, Q.3, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440003', 'customer2@gmail.com', 'customer2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Phạm Thị Hoa', '0901234570', '321 Võ Văn Tần, Q.3, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440004', 'customer3@gmail.com', 'customer3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Hoàng Minh Tuấn', '0901234571', '654 Cách Mạng Tháng 8, Q.10, TP.HCM')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Insert sample products (using UPSERT to avoid duplicates)
INSERT INTO products (id, name, description, price, category, image_url, stock_quantity, is_prescription_required) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Thuốc Tim Mạch Cardio Plus', 'Hỗ trợ tim mạch, giảm cholesterol xấu, tăng cường sức khỏe tim mạch. Thành phần thiên nhiên an toàn.', 250000, 'Heart', 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg', 50, false),
('660e8400-e29b-41d4-a716-446655440001', 'Viên Uống Hỗ Trợ Tim Mạch CoQ10', 'Bổ sung CoQ10 tự nhiên, hỗ trợ chức năng tim, tăng cường năng lượng cho cơ thể.', 180000, 'Heart', 'https://images.pexels.com/photos/3683077/pexels-photo-3683077.jpeg', 75, false),
('660e8400-e29b-41d4-a716-446655440002', 'Thuốc Huyết Áp Amlodipine', 'Điều trị tăng huyết áp, giảm nguy cơ đột quỵ và nhồi máu cơ tim. Cần đơn thuốc.', 120000, 'Heart', 'https://images.pexels.com/photos/3683073/pexels-photo-3683073.jpeg', 30, true),
('660e8400-e29b-41d4-a716-446655440003', 'Kem Dưỡng Da Sensitive Care', 'Kem dưỡng da nhạy cảm, không gây kích ứng, phù hợp cho mọi loại da.', 85000, 'Skin', 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg', 100, false),
('660e8400-e29b-41d4-a716-446655440004', 'Serum Vitamin C Brightening', 'Serum vitamin C tự nhiên, làm sáng da, chống lão hóa, giảm thâm nám hiệu quả.', 320000, 'Skin', 'https://images.pexels.com/photos/3762882/pexels-photo-3762882.jpeg', 60, false),
('660e8400-e29b-41d4-a716-446655440005', 'Thuốc Trị Mụn Tretinoin', 'Điều trị mụn trứng cá nặng, làm mịn da, giảm sẹo mụn. Cần đơn thuốc bác sĩ.', 150000, 'Skin', 'https://images.pexels.com/photos/3762885/pexels-photo-3762885.jpeg', 25, true),
('660e8400-e29b-41d4-a716-446655440006', 'Viên Uống Omega-3 Fish Oil', 'Bổ sung Omega-3 từ dầu cá tự nhiên, hỗ trợ não bộ và tim mạch.', 280000, 'Heart', 'https://images.pexels.com/photos/3683078/pexels-photo-3683078.jpeg', 80, false),
('660e8400-e29b-41d4-a716-446655440007', 'Sữa Rửa Mặt Gentle Cleanser', 'Sữa rửa mặt dịu nhẹ, phù hợp cho da nhạy cảm, không làm khô da.', 65000, 'Skin', 'https://images.pexels.com/photos/3762888/pexels-photo-3762888.jpeg', 120, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity;

-- Insert sample reviews (using UPSERT to avoid duplicates)
INSERT INTO reviews (id, user_id, product_id, rating, comment) VALUES
('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 5, 'Sản phẩm rất tốt, dùng được 2 tháng thấy tim mạch ổn định hơn nhiều. Sẽ tiếp tục sử dụng.'),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 4, 'Kem dưỡng da rất dịu nhẹ, không gây kích ứng. Da mình nhạy cảm mà dùng rất ổn.'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 5, 'Serum vitamin C này hiệu quả thật sự! Da sáng lên rõ rệt sau 3 tuần sử dụng.'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 4, 'CoQ10 chất lượng tốt, cảm thấy có năng lượng hơn sau khi dùng. Giá cả hợp lý.'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 5, 'Sữa rửa mặt rất nhẹ nhàng, không làm khô da. Phù hợp với da nhạy cảm như mình.')
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment;

-- Insert sample sales analytics (using UPSERT to avoid duplicates)
INSERT INTO sales_analytics (id, date, total_sales, total_orders, total_customers, popular_category) VALUES
('880e8400-e29b-41d4-a716-446655440000', '2024-01-15', 2500000, 45, 38, 'Heart'),
('880e8400-e29b-41d4-a716-446655440001', '2024-01-16', 1800000, 32, 28, 'Skin'),
('880e8400-e29b-41d4-a716-446655440002', '2024-01-17', 3200000, 58, 47, 'Heart'),
('880e8400-e29b-41d4-a716-446655440003', '2024-01-18', 2100000, 38, 33, 'Skin'),
('880e8400-e29b-41d4-a716-446655440004', '2024-01-19', 2800000, 51, 42, 'Heart'),
('880e8400-e29b-41d4-a716-446655440005', '2024-01-20', 1950000, 35, 30, 'Skin'),
('880e8400-e29b-41d4-a716-446655440006', '2024-01-21', 3500000, 63, 52, 'Heart'),
('880e8400-e29b-41d4-a716-446655440007', '2024-01-22', 2300000, 41, 36, 'Skin'),
('880e8400-e29b-41d4-a716-446655440008', '2024-01-23', 2700000, 48, 40, 'Heart'),
('880e8400-e29b-41d4-a716-446655440009', '2024-01-24', 2200000, 39, 34, 'Skin')
ON CONFLICT (id) DO UPDATE SET
  total_sales = EXCLUDED.total_sales,
  total_orders = EXCLUDED.total_orders,
  total_customers = EXCLUDED.total_customers,
  popular_category = EXCLUDED.popular_category;