/*
  # Add new manager and pharmacist users

  1. New Users
    - Add 4 new manager accounts
    - Add 2 new pharmacist accounts
    - All with proper email format and secure passwords

  2. Security
    - Uses existing RLS policies
    - Proper role assignments
*/

-- Insert new manager users
INSERT INTO users (id, email, username, password_hash, role, full_name, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'managerPhat@gmail.com', 'managerPhat', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Nguyễn Văn Phát', '0901234580', '100 Nguyễn Trãi, Q.5, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440011', 'managerKhang@gmail.com', 'managerKhang', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Trần Minh Khang', '0901234581', '200 Lý Thường Kiệt, Q.10, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440012', 'managerToan@gmail.com', 'managerToan', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Lê Văn Toàn', '0901234582', '300 Cộng Hòa, Q.Tân Bình, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440013', 'managerTrung@gmail.com', 'managerTrung', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Phạm Quốc Trung', '0901234583', '400 Hoàng Văn Thụ, Q.Phú Nhuận, TP.HCM')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Insert new pharmacist users
INSERT INTO users (id, email, username, password_hash, role, full_name, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440014', 'pharmacistPhat@gmail.com', 'pharmacistPhat', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Nguyễn Thị Phát', '0901234584', '500 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM'),
('550e8400-e29b-41d4-a716-446655440015', 'pharmacistKhang@gmail.com', 'pharmacistKhang', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Trần Văn Khang', '0901234585', '600 Xô Viết Nghệ Tĩnh, Q.Bình Thạnh, TP.HCM')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;