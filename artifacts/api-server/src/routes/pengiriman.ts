import { Router } from "express";
import { db, pengirimanTable, dapurTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const VALID_STATUS = ["dijadwalkan", "berangkat", "tiba", "selesai", "gagal"];
// Terminal statuses — cannot be changed once reached
const TERMINAL_STATUS = ["selesai", "gagal"];

const router = Router();

router.get("/pengiriman/status-summary", authMiddleware, async (_req, res) => {
  const list = await db.select().from(pengirimanTable);
  const summary = {
    dijadwalkan: list.filter((p) => p.status === "dijadwalkan").length,
    berangkat: list.filter((p) => p.status === "berangkat").length,
    tiba: list.filter((p) => p.status === "tiba").length,
    selesai: list.filter((p) => p.status === "selesai").length,
    gagal: list.filter((p) => p.status === "gagal").length,
    total: list.length,
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
  const porsiNum = parseInt(jumlah_porsi);
  if (isNaN(porsiNum) || porsiNum <= 0) {
    res.status(400).json({ error: "jumlah_porsi harus berupa angka positif" });
    return;
  }
  // Validate dapur exists
  const [dapurExist] = await db.select().from(dapurTable).where(eq(dapurTable.id, parseInt(dapur_id))).limit(1);
  if (!dapurExist) {
    res.status(404).json({ error: "Dapur tidak ditemukan" });
    return;
  }
  const [p] = await db
    .insert(pengirimanTable)
    .values({ dapur_id: parseInt(dapur_id), driver_id: driver_id ? parseInt(driver_id) : null, tanggal, jumlah_porsi: porsiNum, tujuan, catatan })
    .returning();
  res.status(201).json({ ...p, dapur_nama: null, driver_nama: null });
});

router.get("/pengiriman/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const [p] = await db.select().from(pengirimanTable).where(eq(pengirimanTable.id, id)).limit(1);
  if (!p) { res.status(404).json({ error: "Pengiriman tidak ditemukan" }); return; }
  const dapur = p.dapur_id ? await db.select().from(dapurTable).where(eq(dapurTable.id, p.dapur_id)).limit(1) : [];
  const driver = p.driver_id ? await db.select().from(usersTable).where(eq(usersTable.id, p.driver_id)).limit(1) : [];
  res.json({ ...p, dapur_nama: dapur[0]?.nama ?? null, driver_nama: driver[0]?.nama ?? null });
});

router.patch("/pengiriman/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { dapur_id, driver_id, status, catatan, jumlah_porsi, tujuan, tanggal } = req.body;

  // Validate status value
  if (status !== undefined && !VALID_STATUS.includes(status)) {
    res.status(400).json({ error: `Status tidak valid. Pilihan: ${VALID_STATUS.join(", ")}` });
    return;
  }

  // Check status machine: fetch current record
  if (status !== undefined) {
    const [current] = await db.select().from(pengirimanTable).where(eq(pengirimanTable.id, id)).limit(1);
    if (!current) { res.status(404).json({ error: "Pengiriman tidak ditemukan" }); return; }
    if (TERMINAL_STATUS.includes(current.status)) {
      res.status(400).json({ error: `Pengiriman sudah ${current.status}, status tidak dapat diubah lagi` });
      return;
    }
  }

  if (jumlah_porsi !== undefined) {
    const porsiNum = parseInt(jumlah_porsi);
    if (isNaN(porsiNum) || porsiNum <= 0) {
      res.status(400).json({ error: "jumlah_porsi harus berupa angka positif" });
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (dapur_id !== undefined) updateData.dapur_id = parseInt(dapur_id);
  if (driver_id !== undefined) updateData.driver_id = driver_id ? parseInt(driver_id) : null;
  if (status !== undefined) updateData.status = status;
  if (catatan !== undefined) updateData.catatan = catatan;
  if (jumlah_porsi !== undefined) updateData.jumlah_porsi = parseInt(jumlah_porsi);
  if (tujuan !== undefined) updateData.tujuan = tujuan;
  if (tanggal !== undefined) updateData.tanggal = tanggal;
  const [p] = await db
    .update(pengirimanTable)
    .set(updateData)
    .where(eq(pengirimanTable.id, id))
    .returning();
  if (!p) { res.status(404).json({ error: "Pengiriman tidak ditemukan" }); return; }
  const dapurList = await db.select().from(dapurTable);
  const users = await db.select().from(usersTable);
  res.json({ ...p, dapur_nama: dapurList.find(d => d.id === p.dapur_id)?.nama ?? null, driver_nama: users.find(u => u.id === p.driver_id)?.nama ?? null });
});

router.delete("/pengiriman/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  await db.delete(pengirimanTable).where(eq(pengirimanTable.id, id));
  res.status(204).end();
});

export default router;
