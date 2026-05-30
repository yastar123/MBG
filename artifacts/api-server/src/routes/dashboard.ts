import { Router } from "express";
import { db, produksiTable, dapurTable, pengirimanTable, penerimaManfaatTable, stokTable, bahanBakuTable, notifikasiTable } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/summary", authMiddleware, async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const produksiList = await db.select().from(produksiTable);
  const todayProduksi = produksiList.filter((p) => p.tanggal === today);
  const total_porsi_hari_ini = todayProduksi.reduce((s, p) => s + (p.realisasi_porsi ?? 0), 0);
  const target_porsi_hari_ini = todayProduksi.reduce((s, p) => s + p.target_porsi, 0);

  const dapur = await db.select().from(dapurTable);
  const total_dapur_aktif = dapur.filter((d) => d.status === "aktif").length;

  const pengirimanList = await db.select().from(pengirimanTable);
  const todayPengiriman = pengirimanList.filter((p) => p.tanggal === today);

  const penerima = await db.select().from(penerimaManfaatTable);
  const total_penerima_manfaat = penerima.filter((p) => p.is_aktif).length;

  const stok = await db.select().from(stokTable);
  const bahan = await db.select().from(bahanBakuTable);
  const stok_alert_count = stok.filter((s) => {
    const b = bahan.find((x) => x.id === s.bahan_baku_id);
    return b && parseFloat(s.kuantitas) <= parseFloat(b.stok_minimum);
  }).length;

  res.json({
    total_porsi_hari_ini,
    target_porsi_hari_ini,
    total_dapur_aktif,
    total_pengiriman_hari_ini: todayPengiriman.length,
    total_penerima_manfaat,
    stok_alert_count,
    pengiriman_selesai: todayPengiriman.filter((p) => p.status === "selesai").length,
    pengiriman_dalam_proses: todayPengiriman.filter((p) => ["berangkat", "tiba"].includes(p.status)).length,
  });
});

router.get("/dashboard/trends", authMiddleware, async (_req, res) => {
  const produksiList = await db.select().from(produksiTable);
  const menuList = await db.select().from(produksiTable);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const trends = days.map((tanggal) => {
    const dayProd = produksiList.filter((p) => p.tanggal === tanggal);
    return {
      tanggal,
      total_porsi: dayProd.reduce((s, p) => s + (p.realisasi_porsi ?? 0), 0),
      target_porsi: dayProd.reduce((s, p) => s + p.target_porsi, 0),
    };
  });
  res.json(trends);
});

router.get("/dashboard/alerts", authMiddleware, async (_req, res) => {
  const stok = await db.select().from(stokTable);
  const bahan = await db.select().from(bahanBakuTable);
  const alerts = stok
    .filter((s) => {
      const b = bahan.find((x) => x.id === s.bahan_baku_id);
      return b && parseFloat(s.kuantitas) <= parseFloat(b.stok_minimum);
    })
    .map((s, i) => {
      const b = bahan.find((x) => x.id === s.bahan_baku_id)!;
      return {
        id: i + 1,
        tipe: "stok",
        pesan: `Stok ${b.nama} (${parseFloat(s.kuantitas)} ${b.satuan}) di bawah minimum (${parseFloat(b.stok_minimum)} ${b.satuan})`,
        tingkat: parseFloat(s.kuantitas) === 0 ? "critical" : "warning",
        created_at: new Date().toISOString(),
      };
    });
  res.json(alerts);
});

export default router;
