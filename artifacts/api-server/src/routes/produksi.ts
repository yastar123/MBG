import { Router } from "express";
import { db, produksiTable, dapurTable, menuTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/produksi/summary", authMiddleware, async (_req, res) => {
  const list = await db.select().from(produksiTable);
  const dapur = await db.select().from(dapurTable);
  const summaryMap: Record<number, { total_target: number; total_realisasi: number }> = {};
  for (const p of list) {
    if (!summaryMap[p.dapur_id]) summaryMap[p.dapur_id] = { total_target: 0, total_realisasi: 0 };
    summaryMap[p.dapur_id].total_target += p.target_porsi;
    summaryMap[p.dapur_id].total_realisasi += p.realisasi_porsi ?? 0;
  }
  const result = Object.entries(summaryMap).map(([dapur_id, s]) => ({
    dapur_id: parseInt(dapur_id),
    dapur_nama: dapur.find((d) => d.id === parseInt(dapur_id))?.nama ?? "Unknown",
    total_target: s.total_target,
    total_realisasi: s.total_realisasi,
    persen_tercapai: s.total_target > 0 ? Math.round((s.total_realisasi / s.total_target) * 100) : 0,
  }));
  res.json(result);
});

router.get("/produksi", authMiddleware, async (req, res) => {
  const { dapur_id, tanggal, status } = req.query;
  let list = await db.select().from(produksiTable).orderBy(produksiTable.tanggal);
  if (dapur_id) list = list.filter((p) => p.dapur_id === parseInt(dapur_id as string));
  if (tanggal) list = list.filter((p) => p.tanggal === tanggal);
  if (status) list = list.filter((p) => p.status === status);

  const dapur = await db.select().from(dapurTable);
  const menu = await db.select().from(menuTable);
  res.json(list.map((p) => ({
    ...p,
    dapur_nama: dapur.find((d) => d.id === p.dapur_id)?.nama ?? null,
    menu_nama: menu.find((m) => m.id === p.menu_id)?.nama ?? null,
  })));
});

router.post("/produksi", authMiddleware, async (req, res) => {
  const { dapur_id, menu_id, tanggal, target_porsi } = req.body;
  if (!dapur_id || !menu_id || !tanggal || target_porsi === undefined) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [p] = await db
    .insert(produksiTable)
    .values({ dapur_id: parseInt(dapur_id), menu_id: parseInt(menu_id), tanggal, target_porsi: parseInt(target_porsi) })
    .returning();
  res.status(201).json({ ...p, dapur_nama: null, menu_nama: null });
});

router.get("/produksi/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [p] = await db.select().from(produksiTable).where(eq(produksiTable.id, id)).limit(1);
  if (!p) { res.status(404).json({ error: "Produksi tidak ditemukan" }); return; }
  const [dapur] = p.dapur_id ? await db.select().from(dapurTable).where(eq(dapurTable.id, p.dapur_id)).limit(1) : [null];
  const [menu] = p.menu_id ? await db.select().from(menuTable).where(eq(menuTable.id, p.menu_id)).limit(1) : [null];
  res.json({ ...p, dapur_nama: dapur?.nama ?? null, menu_nama: menu?.nama ?? null });
});

router.patch("/produksi/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { realisasi_porsi, status, catatan_qc } = req.body;
  const [p] = await db
    .update(produksiTable)
    .set({ realisasi_porsi: realisasi_porsi ? parseInt(realisasi_porsi) : undefined, status, catatan_qc })
    .where(eq(produksiTable.id, id))
    .returning();
  if (!p) { res.status(404).json({ error: "Produksi tidak ditemukan" }); return; }
  res.json({ ...p, dapur_nama: null, menu_nama: null });
});

export default router;
