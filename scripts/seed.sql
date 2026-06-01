-- MBG Dapur seed data
-- Clear all tables (except admin user)

DELETE FROM absensi;
DELETE FROM realisasi;
DELETE FROM anggaran;
DELETE FROM pengiriman;
DELETE FROM produksi;
DELETE FROM menu;
DELETE FROM stok;
DELETE FROM penerimaan_bahan;
DELETE FROM bahan_baku;
DELETE FROM penerima_manfaat;
DELETE FROM supplier;
DELETE FROM users WHERE email != 'admin@test.com';
DELETE FROM dapur;

-- DAPUR
INSERT INTO dapur (nama, lokasi, alamat, kapasitas_porsi, status) VALUES
  ('Dapur Sentral Jakarta Timur', 'Jakarta Timur', 'Jl. Raya Bekasi No. 45, Cakung', 2000, 'aktif'),
  ('Dapur Depok Margonda', 'Depok', 'Jl. Margonda Raya No. 12, Depok', 1500, 'aktif'),
  ('Dapur Bogor Selatan', 'Bogor', 'Jl. Raya Pajajaran No. 88, Bogor', 1800, 'aktif'),
  ('Dapur Tangerang Barat', 'Tangerang', 'Jl. Daan Mogot Km. 15, Tangerang', 1200, 'nonaktif');

-- USERS (password_hash = bcrypt of 'admin123')
-- Using pre-computed bcrypt hash for 'admin123'
INSERT INTO users (nama, email, password_hash, role, no_hp, is_active) VALUES
  ('Siti Rahayu', 'kepala1@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'kepala_dapur', '081234567001', true),
  ('Budi Santoso', 'kepala2@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'kepala_dapur', '081234567002', true),
  ('Dewi Lestari', 'staff1@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'staff_dapur', '081234567003', true),
  ('Ahmad Fauzi', 'staff2@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'staff_dapur', '081234567004', true),
  ('Rina Wati', 'staff3@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'staff_dapur', '081234567005', true),
  ('Hendra Gunawan', 'driver1@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'driver', '081234567006', true),
  ('Supardi', 'driver2@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'driver', '081234567007', true),
  ('Lina Marlina', 'gudang@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'admin_gudang', '081234567008', true),
  ('Drs. Bambang Irawan', 'yayasan@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'admin_yayasan', '081234567009', true),
  ('Farida Hanum', 'staff4@mbg.id', '$2b$10$8K1p/a0dR5PzQ6.eB5eNxOzNJPMnj3EgjlJm9r5IKkD5EzJi7JiuC', 'staff_dapur', '081234567010', false);

-- Update dapur with kepala_dapur_id
UPDATE dapur SET kepala_dapur_id = (SELECT id FROM users WHERE email = 'kepala1@mbg.id') WHERE nama = 'Dapur Sentral Jakarta Timur';
UPDATE dapur SET kepala_dapur_id = (SELECT id FROM users WHERE email = 'kepala2@mbg.id') WHERE nama = 'Dapur Depok Margonda';

-- Update users with dapur_id
UPDATE users SET dapur_id = (SELECT id FROM dapur WHERE nama = 'Dapur Sentral Jakarta Timur') WHERE email IN ('kepala1@mbg.id', 'staff1@mbg.id', 'staff2@mbg.id', 'driver1@mbg.id');
UPDATE users SET dapur_id = (SELECT id FROM dapur WHERE nama = 'Dapur Depok Margonda') WHERE email IN ('kepala2@mbg.id', 'staff3@mbg.id', 'driver2@mbg.id');
UPDATE users SET dapur_id = (SELECT id FROM dapur WHERE nama = 'Dapur Bogor Selatan') WHERE email = 'staff4@mbg.id';

-- SUPPLIER
INSERT INTO supplier (nama, kontak, email, alamat, kategori_bahan, rating, status) VALUES
  ('CV. Sumber Pangan Nusantara', '021-45678901', 'info@spnusantara.co.id', 'Jl. Pasar Kramat Jati No. 5, Jakarta Timur', 'Sayuran & Buah', 4.8, 'aktif'),
  ('PT. Beras Unggul Indonesia', '021-56789012', 'order@berasunggul.id', 'Jl. Penggilingan Cakung No. 20', 'Beras & Serealia', 4.5, 'aktif'),
  ('UD. Ayam Segar Jaya', '081298765001', 'ayamsegar@gmail.com', 'Pasar Induk Cipinang Block A-15', 'Daging & Protein', 4.2, 'aktif'),
  ('Toko Bumbu Mandiri', '081298765002', null, 'Jl. Raya Condet No. 88, Jakarta Timur', 'Bumbu & Rempah', 3.9, 'aktif'),
  ('PT. Minyak Goreng Prima', '021-34567890', 'sales@mgprima.co.id', 'Kawasan Industri Pulogadung', 'Minyak & Lemak', 4.6, 'nonaktif');

-- BAHAN BAKU
INSERT INTO bahan_baku (nama, satuan, stok_minimum, kategori) VALUES
  ('Beras Premium', 'kg', 100, 'Karbohidrat'),
  ('Ayam Potong', 'kg', 50, 'Protein'),
  ('Telur Ayam', 'butir', 500, 'Protein'),
  ('Tempe', 'potong', 200, 'Protein'),
  ('Tahu Putih', 'buah', 200, 'Protein'),
  ('Bayam', 'kg', 20, 'Sayuran'),
  ('Wortel', 'kg', 30, 'Sayuran'),
  ('Minyak Goreng', 'liter', 40, 'Minyak & Lemak'),
  ('Gula Pasir', 'kg', 20, 'Bumbu'),
  ('Garam', 'kg', 15, 'Bumbu'),
  ('Bawang Merah', 'kg', 10, 'Bumbu'),
  ('Bawang Putih', 'kg', 8, 'Bumbu'),
  ('Ikan Lele', 'kg', 30, 'Protein'),
  ('Kentang', 'kg', 25, 'Sayuran'),
  ('Tomat', 'kg', 15, 'Sayuran');

-- STOK (some below minimum to trigger alerts)
INSERT INTO stok (bahan_baku_id, kuantitas) 
SELECT id, CASE nama
  WHEN 'Beras Premium'  THEN 320
  WHEN 'Ayam Potong'    THEN 38    -- RENDAH (< 50)
  WHEN 'Telur Ayam'     THEN 1200
  WHEN 'Tempe'          THEN 380
  WHEN 'Tahu Putih'     THEN 210
  WHEN 'Bayam'          THEN 12    -- RENDAH (< 20)
  WHEN 'Wortel'         THEN 45    -- Hampir habis
  WHEN 'Minyak Goreng'  THEN 95
  WHEN 'Gula Pasir'     THEN 55
  WHEN 'Garam'          THEN 8     -- RENDAH (< 15)
  WHEN 'Bawang Merah'   THEN 22
  WHEN 'Bawang Putih'   THEN 18
  WHEN 'Ikan Lele'      THEN 25    -- Hampir habis
  WHEN 'Kentang'        THEN 60
  WHEN 'Tomat'          THEN 28
END
FROM bahan_baku ON CONFLICT (bahan_baku_id) DO NOTHING;

-- MENU (7 days back + today + tomorrow)
INSERT INTO menu (nama, deskripsi, tanggal, kategori, target_porsi, kalori) VALUES
  -- Today
  ('Nasi Ayam Goreng Bumbu Bali', 'Nasi putih dengan ayam goreng berbumbu rempah khas Bali', CURRENT_DATE, 'makan_siang', 2000, 520),
  ('Bubur Ayam Istimewa', 'Bubur ayam dengan topping kerupuk, cakwe, dan kecap', CURRENT_DATE, 'makan_pagi', 1800, 380),
  ('Pisang Kukus', 'Pisang kepok kukus sebagai snack sehat', CURRENT_DATE, 'snack', 1800, 120),
  -- Yesterday
  ('Nasi Ikan Lele Goreng', 'Nasi dengan ikan lele goreng dan sambal terasi', CURRENT_DATE - 1, 'makan_siang', 1900, 490),
  ('Nasi Tempe Orek', 'Nasi dengan tempe orek dan sayur asem', CURRENT_DATE - 1, 'makan_pagi', 1700, 420),
  -- 2 days ago
  ('Nasi Rendang Daging Sapi', 'Nasi dengan rendang daging sapi khas Minang', CURRENT_DATE - 2, 'makan_siang', 2100, 580),
  ('Onde-onde', 'Jajakan tradisional berbahan ketan dan isi kacang hijau', CURRENT_DATE - 2, 'snack', 1500, 200),
  -- 3 days ago
  ('Nasi Soto Ayam', 'Nasi dengan kuah soto ayam khas Lamongan', CURRENT_DATE - 3, 'makan_siang', 1800, 450),
  -- 4 days ago
  ('Nasi Capcay Sayuran', 'Nasi dengan capcay sayuran segar dan bakso', CURRENT_DATE - 4, 'makan_siang', 2000, 400),
  -- 5 days ago
  ('Nasi Gulai Ayam', 'Nasi dengan gulai ayam santan khas Padang', CURRENT_DATE - 5, 'makan_siang', 1900, 530),
  -- 6 days ago
  ('Nasi Telur Balado', 'Nasi dengan telur balado pedas manis', CURRENT_DATE - 6, 'makan_siang', 1700, 460),
  -- Tomorrow
  ('Nasi Opor Ayam', 'Nasi dengan opor ayam kuah santan', CURRENT_DATE + 1, 'makan_siang', 2200, 540);

-- PRODUKSI (last 7 days)
DO $$
DECLARE
  d1 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Sentral Jakarta Timur');
  d2 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Depok Margonda');
  d3 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Bogor Selatan');
  m_today_siang INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE AND kategori = 'makan_siang' LIMIT 1);
  m_today_pagi  INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE AND kategori = 'makan_pagi' LIMIT 1);
  m1s INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 1 AND kategori = 'makan_siang' LIMIT 1);
  m1p INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 1 AND kategori = 'makan_pagi' LIMIT 1);
  m2s INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 2 AND kategori = 'makan_siang' LIMIT 1);
  m3s INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 3 AND kategori = 'makan_siang' LIMIT 1);
  m4s INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 4 AND kategori = 'makan_siang' LIMIT 1);
  m5s INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 5 AND kategori = 'makan_siang' LIMIT 1);
  m6s INT := (SELECT id FROM menu WHERE tanggal = CURRENT_DATE - 6 AND kategori = 'makan_siang' LIMIT 1);
BEGIN
  INSERT INTO produksi (dapur_id, menu_id, tanggal, target_porsi, realisasi_porsi, status, catatan_qc) VALUES
    -- Today
    (d1, m_today_siang, CURRENT_DATE, 800, 720, 'selesai', 'QC lulus, porsi sesuai standar'),
    (d2, m_today_siang, CURRENT_DATE, 700, NULL, 'berlangsung', NULL),
    (d3, m_today_siang, CURRENT_DATE, 500, 490, 'selesai', 'Produksi selesai tepat waktu'),
    (d1, m_today_pagi, CURRENT_DATE, 700, 695, 'selesai', 'Bubur matang sempurna'),
    -- Yesterday
    (d1, m1s, CURRENT_DATE - 1, 800, 785, 'selesai', 'QC baik'),
    (d2, m1s, CURRENT_DATE - 1, 650, 638, 'selesai', 'Sedikit kurang dari target'),
    (d3, m1p, CURRENT_DATE - 1, 500, 500, 'selesai', 'Sempurna'),
    -- 2 days ago
    (d1, m2s, CURRENT_DATE - 2, 850, 830, 'selesai', 'QC lulus'),
    (d2, m2s, CURRENT_DATE - 2, 700, 680, 'selesai', NULL),
    -- 3 days ago
    (d1, m3s, CURRENT_DATE - 3, 900, 878, 'selesai', 'Standar terpenuhi'),
    (d2, m3s, CURRENT_DATE - 3, 600, 590, 'selesai', NULL),
    -- 4 days ago
    (d1, m4s, CURRENT_DATE - 4, 800, 795, 'selesai', 'QC baik'),
    (d2, m4s, CURRENT_DATE - 4, 650, 640, 'selesai', NULL),
    -- 5 days ago
    (d1, m5s, CURRENT_DATE - 5, 900, 855, 'selesai', 'QC lulus, rasa enak'),
    (d2, m5s, CURRENT_DATE - 5, 700, 698, 'selesai', NULL),
    -- 6 days ago
    (d1, m6s, CURRENT_DATE - 6, 750, 730, 'selesai', NULL),
    (d2, m6s, CURRENT_DATE - 6, 600, 588, 'selesai', NULL);
END $$;

-- PENGIRIMAN
DO $$
DECLARE
  d1 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Sentral Jakarta Timur');
  d2 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Depok Margonda');
  d3 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Bogor Selatan');
  drv1 INT := (SELECT id FROM users WHERE email = 'driver1@mbg.id');
  drv2 INT := (SELECT id FROM users WHERE email = 'driver2@mbg.id');
BEGIN
  INSERT INTO pengiriman (dapur_id, driver_id, tanggal, jumlah_porsi, tujuan, status, catatan) VALUES
    -- Today
    (d1, drv1, CURRENT_DATE, 250, 'SD Negeri 01 Cakung', 'selesai', NULL),
    (d1, drv1, CURRENT_DATE, 300, 'SD Negeri 05 Penggilingan', 'berangkat', NULL),
    (d2, drv2, CURRENT_DATE, 200, 'SD Negeri 12 Depok', 'dijadwalkan', 'Konfirmasi jam 10.00'),
    (d2, drv2, CURRENT_DATE, 180, 'SMP Negeri 3 Depok', 'tiba', NULL),
    (d3, NULL,  CURRENT_DATE, 490, 'SD Negeri 08 Bogor', 'selesai', NULL),
    -- Yesterday
    (d1, drv1, CURRENT_DATE - 1, 280, 'SD Negeri 01 Cakung', 'selesai', NULL),
    (d1, drv1, CURRENT_DATE - 1, 320, 'SD Negeri 05 Penggilingan', 'selesai', NULL),
    (d2, drv2, CURRENT_DATE - 1, 638, 'SD Negeri 12 Depok', 'selesai', NULL),
    -- 2 days ago
    (d1, drv1, CURRENT_DATE - 2, 415, 'SD Negeri 01 Cakung', 'selesai', NULL),
    (d2, drv2, CURRENT_DATE - 2, 340, 'SMP Negeri 3 Depok', 'selesai', NULL),
    -- 3 days ago
    (d1, drv1, CURRENT_DATE - 3, 440, 'SD Negeri 01 Cakung', 'selesai', NULL),
    (d2, drv2, CURRENT_DATE - 3, 295, 'SD Negeri 12 Depok', 'selesai', NULL),
    -- 4 days ago
    (d1, drv1, CURRENT_DATE - 4, 395, 'SD Negeri 22 Jatinegara', 'selesai', NULL),
    -- Failed delivery
    (d1, drv1, CURRENT_DATE - 5, 250, 'SD Negeri 22 Jatinegara', 'gagal', 'Kendaraan mogok di jalan');
END $$;

-- ABSENSI (last 5 days)
DO $$
DECLARE
  d1 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Sentral Jakarta Timur');
  d2 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Depok Margonda');
  u_k1 INT := (SELECT id FROM users WHERE email = 'kepala1@mbg.id');
  u_k2 INT := (SELECT id FROM users WHERE email = 'kepala2@mbg.id');
  u_d1 INT := (SELECT id FROM users WHERE email = 'staff1@mbg.id');
  u_d2 INT := (SELECT id FROM users WHERE email = 'staff2@mbg.id');
  u_r1 INT := (SELECT id FROM users WHERE email = 'staff3@mbg.id');
  i INT;
BEGIN
  FOR i IN 0..4 LOOP
    INSERT INTO absensi (dapur_id, user_id, tanggal, status, keterangan) VALUES
      (d1, u_k1, CURRENT_DATE - i, 'hadir', NULL),
      (d1, u_d1, CURRENT_DATE - i, CASE WHEN i = 2 THEN 'sakit' ELSE 'hadir' END, CASE WHEN i = 2 THEN 'Demam' ELSE NULL END),
      (d1, u_d2, CURRENT_DATE - i, CASE WHEN i = 1 THEN 'izin' ELSE 'hadir' END, CASE WHEN i = 1 THEN 'Acara keluarga' ELSE NULL END),
      (d2, u_k2, CURRENT_DATE - i, 'hadir', NULL),
      (d2, u_r1, CURRENT_DATE - i, CASE WHEN i = 3 THEN 'tidak_hadir' ELSE 'hadir' END, NULL);
  END LOOP;
END $$;

-- PENERIMAAN BAHAN
INSERT INTO penerimaan_bahan (supplier_id, tanggal, total_item, status, catatan) VALUES
  ((SELECT id FROM supplier WHERE nama = 'PT. Beras Unggul Indonesia'), CURRENT_DATE - 3, 500, 'diterima', 'Beras premium kualitas baik'),
  ((SELECT id FROM supplier WHERE nama = 'CV. Sumber Pangan Nusantara'), CURRENT_DATE - 2, 80, 'diterima', 'Sayuran segar kondisi prima'),
  ((SELECT id FROM supplier WHERE nama = 'UD. Ayam Segar Jaya'), CURRENT_DATE - 1, 120, 'diterima', 'Ayam segar bersertifikat halal'),
  ((SELECT id FROM supplier WHERE nama = 'Toko Bumbu Mandiri'), CURRENT_DATE, 50, 'pending', 'Menunggu QC gudang'),
  ((SELECT id FROM supplier WHERE nama = 'CV. Sumber Pangan Nusantara'), CURRENT_DATE - 5, 60, 'ditolak', 'Kualitas tidak memenuhi standar');

-- PENERIMA MANFAAT (sample data across regions)
INSERT INTO penerima_manfaat (nama, sekolah, kelas, wilayah, is_aktif) VALUES
  ('Andi Pratama', 'SD Negeri 01 Cakung', '3A', 'Jakarta Timur', true),
  ('Budi Santoso', 'SD Negeri 01 Cakung', '3B', 'Jakarta Timur', true),
  ('Citra Dewi', 'SD Negeri 01 Cakung', '4A', 'Jakarta Timur', true),
  ('Dian Rahayu', 'SD Negeri 01 Cakung', '4B', 'Jakarta Timur', true),
  ('Eko Putra', 'SD Negeri 01 Cakung', '5A', 'Jakarta Timur', true),
  ('Fitri Wati', 'SD Negeri 01 Cakung', '5B', 'Jakarta Timur', true),
  ('Gilang Kurniawan', 'SD Negeri 01 Cakung', '6A', 'Jakarta Timur', true),
  ('Hani Sari', 'SD Negeri 01 Cakung', '6B', 'Jakarta Timur', true),
  ('Indra Lena', 'SD Negeri 01 Cakung', '2A', 'Jakarta Timur', true),
  ('Joko Mira', 'SD Negeri 01 Cakung', '2B', 'Jakarta Timur', true),
  ('Kiki Nana', 'SD Negeri 05 Penggilingan', '3A', 'Jakarta Timur', true),
  ('Lena Oki', 'SD Negeri 05 Penggilingan', '3B', 'Jakarta Timur', true),
  ('Mira Pratama', 'SD Negeri 05 Penggilingan', '4A', 'Jakarta Timur', true),
  ('Nana Sari', 'SD Negeri 05 Penggilingan', '4B', 'Jakarta Timur', true),
  ('Oki Dewi', 'SD Negeri 05 Penggilingan', '5A', 'Jakarta Timur', true),
  ('Ahmad Pratama', 'SD Negeri 05 Penggilingan', '5B', 'Jakarta Timur', true),
  ('Budi Kurniawan', 'SD Negeri 05 Penggilingan', '6A', 'Jakarta Timur', false),
  ('Citra Rahayu', 'SD Negeri 05 Penggilingan', '6B', 'Jakarta Timur', true),
  ('Dian Putra', 'SD Negeri 05 Penggilingan', '2A', 'Jakarta Timur', true),
  ('Eko Wati', 'SD Negeri 05 Penggilingan', '2B', 'Jakarta Timur', true),
  -- Depok
  ('Fitri Sari', 'SD Negeri 12 Depok', '3A', 'Depok', true),
  ('Gilang Dewi', 'SD Negeri 12 Depok', '3B', 'Depok', true),
  ('Hani Putra', 'SD Negeri 12 Depok', '4A', 'Depok', true),
  ('Indra Lestari', 'SD Negeri 12 Depok', '4B', 'Depok', true),
  ('Joko Santoso', 'SD Negeri 12 Depok', '5A', 'Depok', true),
  ('Kiki Rahayu', 'SD Negeri 12 Depok', '5B', 'Depok', true),
  ('Lena Wati', 'SD Negeri 12 Depok', '6A', 'Depok', true),
  ('Mira Pratama', 'SMP Negeri 3 Depok', '7A', 'Depok', true),
  ('Nana Kurniawan', 'SMP Negeri 3 Depok', '7B', 'Depok', true),
  ('Oki Sari', 'SMP Negeri 3 Depok', '8A', 'Depok', true),
  ('Ahmad Dewi', 'SMP Negeri 3 Depok', '8B', 'Depok', true),
  ('Budi Putra', 'SMP Negeri 3 Depok', '9A', 'Depok', true),
  -- Bogor
  ('Citra Lena', 'SD Negeri 08 Bogor', '3A', 'Bogor', true),
  ('Dian Nana', 'SD Negeri 08 Bogor', '3B', 'Bogor', true),
  ('Eko Mira', 'SD Negeri 08 Bogor', '4A', 'Bogor', true),
  ('Fitri Oki', 'SD Negeri 08 Bogor', '4B', 'Bogor', true),
  ('Gilang Ahmad', 'SD Negeri 08 Bogor', '5A', 'Bogor', true),
  ('Hani Budi', 'SD Negeri 08 Bogor', '5B', 'Bogor', true),
  ('Indra Citra', 'SD Negeri 08 Bogor', '6A', 'Bogor', true),
  ('Joko Dian', 'SD Negeri 08 Bogor', '6B', 'Bogor', false),
  -- Tangerang
  ('Kiki Eko', 'SD Negeri 3 Tangerang', '3A', 'Tangerang', true),
  ('Lena Fitri', 'SD Negeri 3 Tangerang', '3B', 'Tangerang', true),
  ('Mira Gilang', 'SD Negeri 3 Tangerang', '4A', 'Tangerang', true),
  ('Nana Hani', 'SD Negeri 3 Tangerang', '4B', 'Tangerang', true),
  ('Oki Indra', 'SD Negeri 3 Tangerang', '5A', 'Tangerang', true),
  ('Ahmad Joko', 'SD Negeri 11 Cipondoh', '3A', 'Tangerang', true),
  ('Budi Kiki', 'SD Negeri 11 Cipondoh', '4A', 'Tangerang', true),
  ('Citra Lena', 'SD Negeri 11 Cipondoh', '5A', 'Tangerang', true),
  -- Jakarta Utara
  ('Dian Mira', 'SD Negeri 07 Koja', '3A', 'Jakarta Utara', true),
  ('Eko Nana', 'SD Negeri 07 Koja', '4A', 'Jakarta Utara', true),
  ('Fitri Oki', 'SD Negeri 07 Koja', '5A', 'Jakarta Utara', true),
  ('Gilang Ahmad', 'SMP Negeri 5 Tanjung Priok', '7A', 'Jakarta Utara', true),
  ('Hani Budi', 'SMP Negeri 5 Tanjung Priok', '8A', 'Jakarta Utara', true),
  ('Indra Citra', 'SMP Negeri 5 Tanjung Priok', '9A', 'Jakarta Utara', true);

-- ANGGARAN & REALISASI
DO $$
DECLARE
  d1 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Sentral Jakarta Timur');
  d2 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Depok Margonda');
  d3 INT := (SELECT id FROM dapur WHERE nama = 'Dapur Bogor Selatan');
  current_periode TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  last_periode TEXT := TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
BEGIN
  INSERT INTO anggaran (dapur_id, periode, total_anggaran, anggaran_per_porsi) VALUES
    (d1, current_periode, 85000000, 5500),
    (d2, current_periode, 72000000, 5500),
    (d3, current_periode, 68000000, 5500),
    (d1, last_periode, 82000000, 5500),
    (d2, last_periode, 70000000, 5500);

  INSERT INTO realisasi (dapur_id, tanggal, kategori, jumlah, deskripsi) VALUES
    (d1, CURRENT_DATE - 6, 'bahan_baku', 12500000, 'Pembelian bahan baku mingguan'),
    (d1, CURRENT_DATE - 5, 'operasional', 2800000, 'BBM kendaraan operasional'),
    (d1, CURRENT_DATE - 4, 'bahan_baku', 9800000, 'Pembelian ayam, telur, sayuran'),
    (d1, CURRENT_DATE - 3, 'sdm', 18500000, 'Gaji staff minggu pertama'),
    (d1, CURRENT_DATE - 2, 'bahan_baku', 11200000, 'Restok beras dan bumbu'),
    (d1, CURRENT_DATE - 1, 'lainnya', 1500000, 'Peralatan masak pengganti'),
    (d2, CURRENT_DATE - 6, 'bahan_baku', 10200000, 'Bahan baku mingguan Depok'),
    (d2, CURRENT_DATE - 4, 'operasional', 2200000, 'Listrik dan gas LPG'),
    (d2, CURRENT_DATE - 3, 'sdm', 16000000, 'Gaji staff'),
    (d2, CURRENT_DATE - 2, 'bahan_baku', 8800000, 'Restok protein hewani'),
    (d3, CURRENT_DATE - 5, 'bahan_baku', 9500000, 'Pembelian bahan baku'),
    (d3, CURRENT_DATE - 3, 'sdm', 15500000, 'Gaji staff Bogor'),
    (d3, CURRENT_DATE - 1, 'operasional', 1800000, 'Biaya distribusi');
END $$;

SELECT 'Seed complete!' AS status;
