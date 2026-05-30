import { Router } from "express";
import { db, pengirimanTable, dapurTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/pengiriman/status-summary", authMiddleware, async (_req, res) => {
  const list = await db.select().from(pengirimanTable);
  const today = new Date().toISOString().slice(0, 10);
  const todayList = list.filter((p) => p.tanggal === today);
  const summary = {
    dijadwalkan: todayList.filter((p) => p.status === "dijadwalkan").length,
    berangkat: todayList.filter((p) => p.status === "berangkat").length,
    tiba: todayList.filter((p) => p.status === "tiba").length,
    selesai: todayList.filter((p) => p.status === "selesai").length,
    gagal: todayList.filter((p) => p.status === "gagal").length,
    total: todayList.length,
  };
  res.json(summary);
});

router.get("/pengiriman", authMiddleware, async (req, res) => {
  const { tanggal, status, driver_id } = req.query;
  let list = await db.select().from(pengirimanTable).orderBy(pengirimanTable.tanggal);
  if (tanggal) list = list.filter((p) => p.tanggal === tanggal);
  if (status) list = list.filter((p) => p.status === status);
  if (driver_id) list = list.filter((p) => p.driver_id === parseInt(driver_id as string));
  const dapur = await db.select().from(dapurTable);
  const users = await db.select().from(usersTable);
  res.json(list.map((p) => ({
    ...p,
    dapur_nama: dapur.find((d) => d.id === p.dapur_id)?.nama ?? null,
    driver_nama: users.find((u) => u.id === p.driver_id)?.nama ?? null,
  })));
});

router.post("/pengiriman", authMiddleware, async (req, res) => {
  const { dapur_id, driver_id, tanggal, jumlah_porsi, tujuan, catatan } = req.body;
  if (!dapur_id || !tanggal || jumlah_porsi === undefined || !tujuan) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [p] = await db
    .insert(pengirimanTable)
    .values({ dapur_id: parseInt(dapur_id), driver_id: driver_id ? parseInt(driver_id) : null, tanggal, jumlah_porsi: parseInt(jumlah_porsi), tujuan, catatan })
    .returning();
  res.status(201).json({ ...p, dapur_nama: null, driver_nama: null });
});

router.get("/pengiriman/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [p] = await db.select().from(pengirimanTable).where(eq(pengirimanTable.id, id)).limit(1);
  if (!p) { res.status(404).json({ error: "Pengiriman tidak ditemukan" }); return; }
  const dapur = p.dapur_id ? await db.select().from(dapurTable).where(eq(dapurTable.id, p.dapur_id)).limit(1) : [];
  const driver = p.driver_id ? await db.select().from(usersTable).where(eq(usersTable.id, p.driver_id)).limit(1) : [];
  res.json({ ...p, dapur_nama: dapur[0]?.nama ?? null, driver_nama: driver[0]?.nama ?? null });
});

router.patch("/pengiriman/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { driver_id, status, catatan, jumlah_porsi } = req.body;
  const [p] = await db
    .update(pengirimanTable)
    .set({ driver_id: driver_id ? parseInt(driver_id) : undefined, status, catatan, jumlah_porsi: jumlah_porsi ? parseInt(jumlah_porsi) : undefined })
    .where(eq(pengirimanTable.id, id))
    .returning();
  if (!p) { res.status(404).json({ error: "Pengiriman tidak ditemukan" }); return; }
  res.json({ ...p, dapur_nama: null, driver_nama: null });
});

export default router;
