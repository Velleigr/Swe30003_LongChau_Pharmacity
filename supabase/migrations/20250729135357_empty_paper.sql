/*
  # Update pharmacist branch assignments

  1. Changes
    - Update existing pharmacist users with correct branch values
    - Ensure branch values match frontend dropdown options
    - Add more pharmacists for better distribution

  2. Security
    - Uses existing RLS policies
    - No changes to security model
*/

-- Update existing pharmacist users with correct branch assignments
UPDATE users SET branch = 'hcm-district1' WHERE username = 'pharmacist';
UPDATE users SET branch = 'hcm-district3' WHERE username = 'pharmacistPhat';
UPDATE users SET branch = 'hcm-district5' WHERE username = 'pharmacistKhang';

-- Update other pharmacists if they exist
UPDATE users SET branch = 'hcm-district1' WHERE username = 'pharmacist2';
UPDATE users SET branch = 'hcm-district3' WHERE username = 'pharmacist3';
UPDATE users SET branch = 'hcm-district5' WHERE username = 'pharmacist4';
UPDATE users SET branch = 'hcm-district7' WHERE username = 'pharmacist5';
UPDATE users SET branch = 'hcm-tanbinh' WHERE username = 'pharmacist6';
UPDATE users SET branch = 'hcm-binhthanh' WHERE username = 'pharmacist7';

-- Insert additional pharmacists to ensure each branch has at least one
INSERT INTO users (id, email, username, password_hash, role, full_name, phone, address, branch) VALUES
('550e8400-e29b-41d4-a716-446655440022', 'pharmacist_d1_1@longchau.com', 'pharmacist_d1_1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Nguyễn Thị Lan Anh', '0901234592', '100 Nguyễn Huệ, Q.1, TP.HCM', 'hcm-district1'),
('550e8400-e29b-41d4-a716-446655440023', 'pharmacist_d3_1@longchau.com', 'pharmacist_d3_1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Trần Văn Minh Tuấn', '0901234593', '200 Hai Bà Trưng, Q.3, TP.HCM', 'hcm-district3'),
('550e8400-e29b-41d4-a716-446655440024', 'pharmacist_d5_1@longchau.com', 'pharmacist_d5_1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Lê Thị Hương Giang', '0901234594', '300 Nguyễn Trãi, Q.5, TP.HCM', 'hcm-district5'),
('550e8400-e29b-41d4-a716-446655440025', 'pharmacist_d7_1@longchau.com', 'pharmacist_d7_1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Phạm Văn Đức', '0901234595', '400 Nguyễn Thị Minh Khai, Q.7, TP.HCM', 'hcm-district7'),
('550e8400-e29b-41d4-a716-446655440026', 'pharmacist_tb_1@longchau.com', 'pharmacist_tb_1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Võ Thị Mai Linh', '0901234596', '500 Cộng Hòa, Q.Tân Bình, TP.HCM', 'hcm-tanbinh'),
('550e8400-e29b-41d4-a716-446655440027', 'pharmacist_bt_1@longchau.com', 'pharmacist_bt_1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Đặng Minh Quân', '0901234597', '600 Xô Viết Nghệ Tĩnh, Q.Bình Thạnh, TP.HCM', 'hcm-binhthanh')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  branch = EXCLUDED.branch;