import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../lib/db/src/schema/index.js";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const today = new Date().toISOString().slice(0, 10);
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (except admin user)
  await db.delete(schema.absensiTable);
  await db.delete(schema.realisasiTable);
  await db.delete(schema.anggaranTable);
  await db.delete(schema.pengirimanTable);
  await db.delete(schema.produksiTable);
  await db.delete(schema.menuTable);
  await db.delete(schema.stokTable);
  await db.delete(schema.penerimaanBahanTable);
  await db.delete(schema.bahanBakuTable);
  await db.delete(schema.penerimaManfaatTable);
  await db.delete(schema.supplierTable);
  // Delete non-admin users
  await pool.query(`DELETE FROM users WHERE email != 'admin@test.com'`);
  await db.delete(schema.dapurTable);

  console.log("  ✓ Cleared old data");

  // DAPUR
  const [dapur1, dapur2, dapur3, dapur4] = await db.insert(schema.dapurTable).values([
    { nama: "Dapur Sentral Jakarta Timur", lokasi: "Jakarta Timur", alamat: "Jl. Raya Bekasi No. 45, Cakung", kapasitas_porsi: 2000, status: "aktif" },
    { nama: "Dapur Depok Margonda", lokasi: "Depok", alamat: "Jl. Margonda Raya No. 12, Depok", kapasitas_porsi: 1500, status: "aktif" },
    { nama: "Dapur Bogor Selatan", lokasi: "Bogor", alamat: "Jl. Raya Pajajaran No. 88, Bogor", kapasitas_porsi: 1800, status: "aktif" },
    { nama: "Dapur Tangerang Barat", lokasi: "Tangerang", alamat: "Jl. Daan Mogot Km. 15, Tangerang", kapasitas_porsi: 1200, status: "nonaktif" },
  ]).returning();

  console.log("  ✓ Dapur seeded");

  // USERS
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("admin123", 10);

  const [admin] = await pool.query(`SELECT id FROM users WHERE email = 'admin@test.com'`);
  const adminId = admin.rows[0]?.id;

  const insertedUsers = await db.insert(schema.usersTable).values([
    { nama: "Siti Rahayu", email: "kepala1@mbg.id", password_hash: hash, role: "kepala_dapur", dapur_id: dapur1.id, no_hp: "081234567001", is_active: true },
    { nama: "Budi Santoso", email: "kepala2@mbg.id", password_hash: hash, role: "kepala_dapur", dapur_id: dapur2.id, no_hp: "081234567002", is_active: true },
    { nama: "Dewi Lestari", email: "staff1@mbg.id", password_hash: hash, role: "staff_dapur", dapur_id: dapur1.id, no_hp: "081234567003", is_active: true },
    { nama: "Ahmad Fauzi", email: "staff2@mbg.id", password_hash: hash, role: "staff_dapur", dapur_id: dapur1.id, no_hp: "081234567004", is_active: true },
    { nama: "Rina Wati", email: "staff3@mbg.id", password_hash: hash, role: "staff_dapur", dapur_id: dapur2.id, no_hp: "081234567005", is_active: true },
    { nama: "Hendra Gunawan", email: "driver1@mbg.id", password_hash: hash, role: "driver", dapur_id: dapur1.id, no_hp: "081234567006", is_active: true },
    { nama: "Supardi", email: "driver2@mbg.id", password_hash: hash, role: "driver", dapur_id: dapur2.id, no_hp: "081234567007", is_active: true },
    { nama: "Lina Marlina", email: "gudang@mbg.id", password_hash: hash, role: "admin_gudang", no_hp: "081234567008", is_active: true },
    { nama: "Drs. Bambang Irawan", email: "yayasan@mbg.id", password_hash: hash, role: "admin_yayasan", no_hp: "081234567009", is_active: true },
    { nama: "Farida Hanum", email: "staff4@mbg.id", password_hash: hash, role: "staff_dapur", dapur_id: dapur3.id, no_hp: "081234567010", is_active: false },
  ]).returning();

  const [kepala1, kepala2, dewi, ahmad, rina, hendra, supardi] = insertedUsers;

  // Update dapur with kepala_dapur_id
  await db.update(schema.dapurTable).set({ kepala_dapur_id: kepala1.id }).where(schema.dapurTable.id.equals ? undefined : undefined);
  await pool.query(`UPDATE dapur SET kepala_dapur_id = $1 WHERE id = $2`, [kepala1.id, dapur1.id]);
  await pool.query(`UPDATE dapur SET kepala_dapur_id = $1 WHERE id = $2`, [kepala2.id, dapur2.id]);

  console.log("  ✓ Users seeded");

  // SUPPLIER
  const suppliers = await db.insert(schema.supplierTable).values([
    { nama: "CV. Sumber Pangan Nusantara", kontak: "021-45678901", email: "info@spnusantara.co.id", alamat: "Jl. Pasar Kramat Jati No. 5, Jakarta Timur", kategori_bahan: "Sayuran & Buah", rating: "4.8", status: "aktif" },
    { nama: "PT. Beras Unggul Indonesia", kontak: "021-56789012", email: "order@berasunggul.id", alamat: "Jl. Penggilingan Cakung No. 20", kategori_bahan: "Beras & Serealia", rating: "4.5", status: "aktif" },
    { nama: "UD. Ayam Segar Jaya", kontak: "081298765001", email: "ayamsegar@gmail.com", alamat: "Pasar Induk Cipinang Block A-15", kategori_bahan: "Daging & Protein", rating: "4.2", status: "aktif" },
    { nama: "Toko Bumbu Mandiri", kontak: "081298765002", email: null, alamat: "Jl. Raya Condet No. 88, Jakarta Timur", kategori_bahan: "Bumbu & Rempah", rating: "3.9", status: "aktif" },
    { nama: "PT. Minyak Goreng Prima", kontak: "021-34567890", email: "sales@mgprima.co.id", alamat: "Kawasan Industri Pulogadung", kategori_bahan: "Minyak & Lemak", rating: "4.6", status: "nonaktif" },
  ]).returning();

  console.log("  ✓ Suppliers seeded");

  // BAHAN BAKU + STOK
  const bahans = await db.insert(schema.bahanBakuTable).values([
    { nama: "Beras Premium", satuan: "kg", stok_minimum: "100", kategori: "Karbohidrat" },
    { nama: "Ayam Potong", satuan: "kg", stok_minimum: "50", kategori: "Protein" },
    { nama: "Telur Ayam", satuan: "butir", stok_minimum: "500", kategori: "Protein" },
    { nama: "Tempe", satuan: "potong", stok_minimum: "200", kategori: "Protein" },
    { nama: "Tahu Putih", satuan: "buah", stok_minimum: "200", kategori: "Protein" },
    { nama: "Bayam", satuan: "kg", stok_minimum: "20", kategori: "Sayuran" },
    { nama: "Wortel", satuan: "kg", stok_minimum: "30", kategori: "Sayuran" },
    { nama: "Minyak Goreng", satuan: "liter", stok_minimum: "40", kategori: "Minyak & Lemak" },
    { nama: "Gula Pasir", satuan: "kg", stok_minimum: "20", kategori: "Bumbu" },
    { nama: "Garam", satuan: "kg", stok_minimum: "15", kategori: "Bumbu" },
    { nama: "Bawang Merah", satuan: "kg", stok_minimum: "10", kategori: "Bumbu" },
    { nama: "Bawang Putih", satuan: "kg", stok_minimum: "8", kategori: "Bumbu" },
    { nama: "Ikan Lele", satuan: "kg", stok_minimum: "30", kategori: "Protein" },
    { nama: "Kentang", satuan: "kg", stok_minimum: "25", kategori: "Sayuran" },
    { nama: "Tomat", satuan: "kg", stok_minimum: "15", kategori: "Sayuran" },
  ]).returning();

  // Stok levels — some below minimum
  const stokValues = [
    { bahan_baku_id: bahans[0].id, kuantitas: "320" },  // Beras - aman
    { bahan_baku_id: bahans[1].id, kuantitas: "38" },   // Ayam - RENDAH
    { bahan_baku_id: bahans[2].id, kuantitas: "1200" }, // Telur - aman
    { bahan_baku_id: bahans[3].id, kuantitas: "380" },  // Tempe - aman
    { bahan_baku_id: bahans[4].id, kuantitas: "210" },  // Tahu - aman
    { bahan_baku_id: bahans[5].id, kuantitas: "12" },   // Bayam - RENDAH
    { bahan_baku_id: bahans[6].id, kuantitas: "45" },   // Wortel - hampir habis
    { bahan_baku_id: bahans[7].id, kuantitas: "95" },   // Minyak - aman
    { bahan_baku_id: bahans[8].id, kuantitas: "55" },   // Gula - aman
    { bahan_baku_id: bahans[9].id, kuantitas: "8" },    // Garam - RENDAH
    { bahan_baku_id: bahans[10].id, kuantitas: "22" },  // Bawang merah - aman
    { bahan_baku_id: bahans[11].id, kuantitas: "18" },  // Bawang putih - aman
    { bahan_baku_id: bahans[12].id, kuantitas: "25" },  // Ikan lele - hampir habis
    { bahan_baku_id: bahans[13].id, kuantitas: "60" },  // Kentang - aman
    { bahan_baku_id: bahans[14].id, kuantitas: "28" },  // Tomat - aman
  ];

  await db.insert(schema.stokTable).values(stokValues).onConflictDoNothing();
  console.log("  ✓ Bahan baku & stok seeded");

  // MENU (last 7 days + today + tomorrow)
  const menuItems = await db.insert(schema.menuTable).values([
    // Today
    { nama: "Nasi Ayam Goreng Bumbu Bali", deskripsi: "Nasi putih dengan ayam goreng berbumbu rempah khas Bali", tanggal: today, kategori: "makan_siang", target_porsi: 2000, kalori: "520" },
    { nama: "Bubur Ayam Istimewa", deskripsi: "Bubur ayam dengan topping kerupuk, cakwe, dan kecap", tanggal: today, kategori: "makan_pagi", target_porsi: 1800, kalori: "380" },
    { nama: "Pisang Kukus", deskripsi: "Pisang kepok kukus sebagai snack sehat", tanggal: today, kategori: "snack", target_porsi: 1800, kalori: "120" },
    // Yesterday
    { nama: "Nasi Ikan Lele Goreng", deskripsi: "Nasi dengan ikan lele goreng dan sambal terasi", tanggal: daysAgo(1), kategori: "makan_siang", target_porsi: 1900, kalori: "490" },
    { nama: "Nasi Tempe Orek", deskripsi: "Nasi dengan tempe orek dan sayur asem", tanggal: daysAgo(1), kategori: "makan_pagi", target_porsi: 1700, kalori: "420" },
    // 2 days ago
    { nama: "Nasi Rendang Daging Sapi", deskripsi: "Nasi dengan rendang daging sapi khas Minang", tanggal: daysAgo(2), kategori: "makan_siang", target_porsi: 2100, kalori: "580" },
    { nama: "Onde-onde", deskripsi: "Jajanan tradisional berbahan ketan dan isi kacang hijau", tanggal: daysAgo(2), kategori: "snack", target_porsi: 1500, kalori: "200" },
    // 3 days ago
    { nama: "Nasi Soto Ayam", deskripsi: "Nasi dengan kuah soto ayam khas Lamongan", tanggal: daysAgo(3), kategori: "makan_siang", target_porsi: 1800, kalori: "450" },
    // 4 days ago
    { nama: "Nasi Capcay Sayuran", deskripsi: "Nasi dengan capcay sayuran segar dan bakso", tanggal: daysAgo(4), kategori: "makan_siang", target_porsi: 2000, kalori: "400" },
    // 5 days ago
    { nama: "Nasi Gulai Ayam", deskripsi: "Nasi dengan gulai ayam santan khas Padang", tanggal: daysAgo(5), kategori: "makan_siang", target_porsi: 1900, kalori: "530" },
    // 6 days ago
    { nama: "Nasi Telur Balado", deskripsi: "Nasi dengan telur balado pedas manis", tanggal: daysAgo(6), kategori: "makan_siang", target_porsi: 1700, kalori: "460" },
    // Tomorrow
    { nama: "Nasi Opor Ayam", deskripsi: "Nasi dengan opor ayam kuah santan", tanggal: daysAgo(-1), kategori: "makan_siang", target_porsi: 2200, kalori: "540" },
  ]).returning();

  console.log("  ✓ Menu seeded");

  // PRODUKSI (last 7 days)
  const produksiData = [
    // Today - in progress
    { dapur_id: dapur1.id, menu_id: menuItems[0].id, tanggal: today, target_porsi: 800, realisasi_porsi: 720, status: "selesai", catatan_qc: "QC lulus, porsi sesuai standar" },
    { dapur_id: dapur2.id, menu_id: menuItems[0].id, tanggal: today, target_porsi: 700, realisasi_porsi: null, status: "berlangsung", catatan_qc: null },
    { dapur_id: dapur3.id, menu_id: menuItems[0].id, tanggal: today, target_porsi: 500, realisasi_porsi: 490, status: "selesai", catatan_qc: "Produksi selesai tepat waktu" },
    // Yesterday
    { dapur_id: dapur1.id, menu_id: menuItems[3].id, tanggal: daysAgo(1), target_porsi: 800, realisasi_porsi: 785, status: "selesai", catatan_qc: "QC baik" },
    { dapur_id: dapur2.id, menu_id: menuItems[3].id, tanggal: daysAgo(1), target_porsi: 650, realisasi_porsi: 638, status: "selesai", catatan_qc: "Sedikit kurang dari target" },
    { dapur_id: dapur3.id, menu_id: menuItems[4].id, tanggal: daysAgo(1), target_porsi: 500, realisasi_porsi: 500, status: "selesai", catatan_qc: "Sempurna" },
    // 2 days ago
    { dapur_id: dapur1.id, menu_id: menuItems[5].id, tanggal: daysAgo(2), target_porsi: 850, realisasi_porsi: 830, status: "selesai", catatan_qc: "QC lulus" },
    { dapur_id: dapur2.id, menu_id: menuItems[5].id, tanggal: daysAgo(2), target_porsi: 700, realisasi_porsi: 680, status: "selesai", catatan_qc: null },
    // 3 days ago
    { dapur_id: dapur1.id, menu_id: menuItems[7].id, tanggal: daysAgo(3), target_porsi: 900, realisasi_porsi: 878, status: "selesai", catatan_qc: "Standar terpenuhi" },
    { dapur_id: dapur2.id, menu_id: menuItems[7].id, tanggal: daysAgo(3), target_porsi: 600, realisasi_porsi: 590, status: "selesai", catatan_qc: null },
    // 4 days ago
    { dapur_id: dapur1.id, menu_id: menuItems[8].id, tanggal: daysAgo(4), target_porsi: 800, realisasi_porsi: 795, status: "selesai", catatan_qc: "QC baik" },
    { dapur_id: dapur2.id, menu_id: menuItems[8].id, tanggal: daysAgo(4), target_porsi: 650, realisasi_porsi: 640, status: "selesai", catatan_qc: null },
    // 5 days ago
    { dapur_id: dapur1.id, menu_id: menuItems[9].id, tanggal: daysAgo(5), target_porsi: 900, realisasi_porsi: 855, status: "selesai", catatan_qc: "QC lulus, rasa enak" },
    { dapur_id: dapur2.id, menu_id: menuItems[9].id, tanggal: daysAgo(5), target_porsi: 700, realisasi_porsi: 698, status: "selesai", catatan_qc: null },
    // 6 days ago
    { dapur_id: dapur1.id, menu_id: menuItems[10].id, tanggal: daysAgo(6), target_porsi: 750, realisasi_porsi: 730, status: "selesai", catatan_qc: null },
    { dapur_id: dapur2.id, menu_id: menuItems[10].id, tanggal: daysAgo(6), target_porsi: 600, realisasi_porsi: 588, status: "selesai", catatan_qc: null },
  ];

  await db.insert(schema.produksiTable).values(produksiData);
  console.log("  ✓ Produksi seeded");

  // PENGIRIMAN
  const pengirimanData = [
    // Today
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: today, jumlah_porsi: 250, tujuan: "SD Negeri 01 Cakung", status: "selesai", catatan: null },
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: today, jumlah_porsi: 300, tujuan: "SD Negeri 05 Penggilingan", status: "berangkat", catatan: null },
    { dapur_id: dapur2.id, driver_id: supardi.id, tanggal: today, jumlah_porsi: 200, tujuan: "SD Negeri 12 Depok", status: "dijadwalkan", catatan: "Konfirmasi jam 10.00" },
    { dapur_id: dapur2.id, driver_id: supardi.id, tanggal: today, jumlah_porsi: 180, tujuan: "SMP Negeri 3 Depok", status: "tiba", catatan: null },
    { dapur_id: dapur3.id, driver_id: null, tanggal: today, jumlah_porsi: 490, tujuan: "SD Negeri 08 Bogor", status: "selesai", catatan: null },
    // Yesterday
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: daysAgo(1), jumlah_porsi: 280, tujuan: "SD Negeri 01 Cakung", status: "selesai", catatan: null },
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: daysAgo(1), jumlah_porsi: 320, tujuan: "SD Negeri 05 Penggilingan", status: "selesai", catatan: null },
    { dapur_id: dapur2.id, driver_id: supardi.id, tanggal: daysAgo(1), jumlah_porsi: 638, tujuan: "SD Negeri 12 Depok", status: "selesai", catatan: null },
    // 2 days ago
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: daysAgo(2), jumlah_porsi: 415, tujuan: "SD Negeri 01 Cakung", status: "selesai", catatan: null },
    { dapur_id: dapur2.id, driver_id: supardi.id, tanggal: daysAgo(2), jumlah_porsi: 340, tujuan: "SMP Negeri 3 Depok", status: "selesai", catatan: null },
    // 3 days ago
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: daysAgo(3), jumlah_porsi: 440, tujuan: "SD Negeri 01 Cakung", status: "selesai", catatan: null },
    { dapur_id: dapur2.id, driver_id: supardi.id, tanggal: daysAgo(3), jumlah_porsi: 295, tujuan: "SD Negeri 12 Depok", status: "selesai", catatan: null },
    // 1 week ago - gagal
    { dapur_id: dapur1.id, driver_id: hendra.id, tanggal: daysAgo(5), jumlah_porsi: 250, tujuan: "SD Negeri 22 Jatinegara", status: "gagal", catatan: "Kendaraan mogok" },
  ];

  await db.insert(schema.pengirimanTable).values(pengirimanData);
  console.log("  ✓ Pengiriman seeded");

  // ABSENSI (last 5 days, today included)
  const staffIds = [kepala1.id, kepala2.id, dewi.id, ahmad.id, rina.id];
  const absensiData = [];
  for (let day = 0; day <= 4; day++) {
    const tanggal = daysAgo(day);
    absensiData.push(
      { dapur_id: dapur1.id, user_id: kepala1.id, tanggal, status: "hadir", keterangan: null },
      { dapur_id: dapur1.id, user_id: dewi.id, tanggal, status: day === 2 ? "sakit" : "hadir", keterangan: day === 2 ? "Demam" : null },
      { dapur_id: dapur1.id, user_id: ahmad.id, tanggal, status: day === 1 ? "izin" : "hadir", keterangan: day === 1 ? "Acara keluarga" : null },
      { dapur_id: dapur2.id, user_id: kepala2.id, tanggal, status: "hadir", keterangan: null },
      { dapur_id: dapur2.id, user_id: rina.id, tanggal, status: day === 3 ? "tidak_hadir" : "hadir", keterangan: null },
    );
  }
  await db.insert(schema.absensiTable).values(absensiData);
  console.log("  ✓ Absensi seeded");

  // PENERIMAAN BAHAN
  await db.insert(schema.penerimaanBahanTable).values([
    { supplier_id: suppliers[1].id, tanggal: daysAgo(3), total_item: 500, status: "diterima", catatan: "Beras premium kualitas baik" },
    { supplier_id: suppliers[0].id, tanggal: daysAgo(2), total_item: 80, status: "diterima", catatan: "Sayuran segar kondisi prima" },
    { supplier_id: suppliers[2].id, tanggal: daysAgo(1), total_item: 120, status: "diterima", catatan: "Ayam segar bersertifikat halal" },
    { supplier_id: suppliers[3].id, tanggal: today, total_item: 50, status: "pending", catatan: "Menunggu QC gudang" },
    { supplier_id: suppliers[0].id, tanggal: daysAgo(5), total_item: 60, status: "ditolak", catatan: "Kualitas tidak memenuhi standar" },
  ]);
  console.log("  ✓ Penerimaan bahan seeded");

  // PENERIMA MANFAAT
  const wilayahs = ["Jakarta Timur", "Depok", "Bogor", "Tangerang", "Jakarta Utara"];
  const sekolahs = [
    ["SD Negeri 01 Cakung", "SD Negeri 05 Penggilingan", "SD Negeri 15 Jatinegara"],
    ["SD Negeri 12 Depok", "SMP Negeri 3 Depok", "SD Negeri 22 Beji"],
    ["SD Negeri 08 Bogor", "SMP Negeri 1 Bogor Selatan"],
    ["SD Negeri 3 Tangerang", "SD Negeri 11 Cipondoh"],
    ["SD Negeri 07 Koja", "SMP Negeri 5 Tanjung Priok"],
  ];
  const kelas = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B"];
  const namaPrefixes = ["Andi", "Budi", "Citra", "Dian", "Eko", "Fitri", "Gilang", "Hani", "Indra", "Joko", "Kiki", "Lena", "Mira", "Nana", "Oki"];

  const penerimaData = [];
  let count = 0;
  for (let w = 0; w < wilayahs.length; w++) {
    const sekolahList = sekolahs[w];
    const perSekolah = w === 0 ? 60 : w === 1 ? 50 : w === 2 ? 45 : w === 3 ? 40 : 35;
    for (let s = 0; s < sekolahList.length; s++) {
      for (let k = 0; k < Math.ceil(perSekolah / sekolahList.length); k++) {
        const nama = `${namaPrefixes[(count++) % namaPrefixes.length]} ${["Pratama","Sari","Putra","Dewi","Kurniawan","Rahayu","Santoso","Wati"][k % 8]}`;
        penerimaData.push({
          nama,
          sekolah: sekolahList[s],
          kelas: kelas[k % kelas.length],
          wilayah: wilayahs[w],
          is_aktif: count % 10 !== 0,
        });
      }
    }
  }
  await db.insert(schema.penerimaManfaatTable).values(penerimaData.slice(0, 250));
  console.log("  ✓ Penerima manfaat seeded");

  // ANGGARAN & REALISASI
  const currentPeriode = monthsAgo(0);
  const lastPeriode = monthsAgo(1);

  await db.insert(schema.anggaranTable).values([
    { dapur_id: dapur1.id, periode: currentPeriode, total_anggaran: "85000000", anggaran_per_porsi: "5500" },
    { dapur_id: dapur2.id, periode: currentPeriode, total_anggaran: "72000000", anggaran_per_porsi: "5500" },
    { dapur_id: dapur3.id, periode: currentPeriode, total_anggaran: "68000000", anggaran_per_porsi: "5500" },
    { dapur_id: dapur1.id, periode: lastPeriode, total_anggaran: "82000000", anggaran_per_porsi: "5500" },
    { dapur_id: dapur2.id, periode: lastPeriode, total_anggaran: "70000000", anggaran_per_porsi: "5500" },
  ]);

  await db.insert(schema.realisasiTable).values([
    { dapur_id: dapur1.id, tanggal: daysAgo(6), kategori: "bahan_baku", jumlah: "12500000", deskripsi: "Pembelian bahan baku mingguan" },
    { dapur_id: dapur1.id, tanggal: daysAgo(5), kategori: "operasional", jumlah: "2800000", deskripsi: "BBM kendaraan operasional" },
    { dapur_id: dapur1.id, tanggal: daysAgo(4), kategori: "bahan_baku", jumlah: "9800000", deskripsi: "Pembelian ayam, telur, sayuran" },
    { dapur_id: dapur1.id, tanggal: daysAgo(3), kategori: "sdm", jumlah: "18500000", deskripsi: "Gaji staff minggu pertama" },
    { dapur_id: dapur1.id, tanggal: daysAgo(2), kategori: "bahan_baku", jumlah: "11200000", deskripsi: "Restok beras dan bumbu" },
    { dapur_id: dapur1.id, tanggal: daysAgo(1), kategori: "lainnya", jumlah: "1500000", deskripsi: "Peralatan masak pengganti" },
    { dapur_id: dapur2.id, tanggal: daysAgo(6), kategori: "bahan_baku", jumlah: "10200000", deskripsi: "Bahan baku mingguan Depok" },
    { dapur_id: dapur2.id, tanggal: daysAgo(4), kategori: "operasional", jumlah: "2200000", deskripsi: "Listrik dan gas LPG" },
    { dapur_id: dapur2.id, tanggal: daysAgo(3), kategori: "sdm", jumlah: "16000000", deskripsi: "Gaji staff" },
    { dapur_id: dapur2.id, tanggal: daysAgo(2), kategori: "bahan_baku", jumlah: "8800000", deskripsi: "Restok protein hewani" },
    { dapur_id: dapur3.id, tanggal: daysAgo(5), kategori: "bahan_baku", jumlah: "9500000", deskripsi: "Pembelian bahan baku" },
    { dapur_id: dapur3.id, tanggal: daysAgo(3), kategori: "sdm", jumlah: "15500000", deskripsi: "Gaji staff Bogor" },
    { dapur_id: dapur3.id, tanggal: daysAgo(1), kategori: "operasional", jumlah: "1800000", deskripsi: "Biaya distribusi" },
  ]);

  console.log("  ✓ Keuangan seeded");

  await pool.end();
  console.log("✅ Seeding complete!");
}

seed().catch(e => {
  console.error("❌ Seed failed:", e);
  pool.end();
  process.exit(1);
});
