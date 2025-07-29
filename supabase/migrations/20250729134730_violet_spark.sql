/*
  # Add branch field to users table

  1. Changes
    - Add branch column to users table
    - Update existing pharmacist users with branch assignments
    - Add index for better query performance

  2. Security
    - Uses existing RLS policies
    - No changes to security model
*/

-- Add branch column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch text;

-- Update existing pharmacist users with branch assignments
UPDATE users SET branch = 'hcm-district1' WHERE username = 'pharmacist';
UPDATE users SET branch = 'hcm-district3' WHERE username = 'pharmacistPhat';
UPDATE users SET branch = 'hcm-district5' WHERE username = 'pharmacistKhang';

-- Add more pharmacists for different branches if needed
INSERT INTO users (id, email, username, password_hash, role, full_name, phone, address, branch) VALUES
('550e8400-e29b-41d4-a716-446655440016', 'pharmacist2@longchau.com', 'pharmacist2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Nguyễn Thị Lan', '0901234586', '100 Nguyễn Trãi, Q.1, TP.HCM', 'hcm-district1'),
('550e8400-e29b-41d4-a716-446655440017', 'pharmacist3@longchau.com', 'pharmacist3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Trần Văn Minh', '0901234587', '200 Lý Thường Kiệt, Q.3, TP.HCM', 'hcm-district3'),
('550e8400-e29b-41d4-a716-446655440018', 'pharmacist4@longchau.com', 'pharmacist4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Lê Thị Hoa', '0901234588', '300 Cộng Hòa, Q.5, TP.HCM', 'hcm-district5'),
('550e8400-e29b-41d4-a716-446655440019', 'pharmacist5@longchau.com', 'pharmacist5', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Phạm Văn Tùng', '0901234589', '400 Hoàng Văn Thụ, Q.7, TP.HCM', 'hcm-district7'),
('550e8400-e29b-41d4-a716-446655440020', 'pharmacist6@longchau.com', 'pharmacist6', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Võ Thị Mai', '0901234590', '500 Điện Biên Phủ, Q.Tân Bình, TP.HCM', 'hcm-tanbinh'),
('550e8400-e29b-41d4-a716-446655440021', 'pharmacist7@longchau.com', 'pharmacist7', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'Đặng Minh Quân', '0901234591', '600 Xô Viết Nghệ Tĩnh, Q.Bình Thạnh, TP.HCM', 'hcm-binhthanh')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  branch = EXCLUDED.branch;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role_branch ON users(role, branch);