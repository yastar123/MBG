import { Router } from "express";
import { db, anggaranTable, realisasiTable, dapurTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/keuangan/anggaran", authMiddleware, async (req, res) => {
  const { dapur_id, periode } = req.query;
  let list = await db.select().from(anggaranTable).orderBy(anggaranTable.periode);
  if (dapur_id) list = list.filter((a) => a.dapur_id === parseInt(dapur_id as string));
  if (periode) list = list.filter((a) => a.periode === periode);
  const dapur = await db.select().from(dapurTable);
  res.json(list.map((a) => ({
    ...a,
    total_anggaran: parseFloat(a.total_anggaran),
    anggaran_per_porsi: a.anggaran_per_porsi ? parseFloat(a.anggaran_per_porsi) : null,
    dapur_nama: dapur.find((d) => d.id === a.dapur_id)?.nama ?? null,
  })));
});

router.post("/keuangan/anggaran", authMiddleware, async (req, res) => {
  const { dapur_id, periode, total_anggaran, anggaran_per_porsi } = req.body;
  if (!dapur_id || !periode || total_anggaran === undefined) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [a] = await db
    .insert(anggaranTable)
    .values({ dapur_id: parseInt(dapur_id), periode, total_anggaran: String(total_anggaran), anggaran_per_porsi: anggaran_per_porsi ? String(anggaran_per_porsi) : null })
    .returning();
  res.status(201).json({ ...a, total_anggaran: parseFloat(a.total_anggaran), anggaran_per_porsi: a.anggaran_per_porsi ? parseFloat(a.anggaran_per_porsi) : null, dapur_nama: null });
});

router.patch("/keuangan/anggaran/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { total_anggaran, anggaran_per_porsi } = req.body;
  const [a] = await db
    .update(anggaranTable)
    .set({ total_anggaran: total_anggaran ? String(total_anggaran) : undefined, anggaran_per_porsi: anggaran_per_porsi ? String(anggaran_per_porsi) : undefined })
    .where(eq(anggaranTable.id, id))
    .returning();
  if (!a) { res.status(404).json({ error: "Anggaran tidak ditemukan" }); return; }
  res.json({ ...a, total_anggaran: parseFloat(a.total_anggaran), anggaran_per_porsi: a.anggaran_per_porsi ? parseFloat(a.anggaran_per_porsi) : null, dapur_nama: null });
});

router.get("/keuangan/realisasi", authMiddleware, async (_req, res) => {
  const list = await db.select().from(realisasiTable).orderBy(realisasiTable.tanggal);
  const dapur = await db.select().from(dapurTable);
  res.json(list.map((r) => ({
    ...r,
    jumlah: parseFloat(r.jumlah),
    dapur_nama: dapur.find((d) => d.id === r.dapur_id)?.nama ?? null,
  })));
});

router.post("/keuangan/realisasi", authMiddleware, async (req, res) => {
  const { dapur_id, tanggal, kategori, jumlah, deskripsi } = req.body;
  if (!dapur_id || !tanggal || !kategori || jumlah === undefined) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [r] = await db
    .insert(realisasiTable)
    .values({ dapur_id: parseInt(dapur_id), tanggal, kategori, jumlah: String(jumlah), deskripsi })
    .returning();
  res.status(201).json({ ...r, jumlah: parseFloat(r.jumlah), dapur_nama: null });
});

router.get("/keuangan/summary", authMiddleware, async (_req, res) => {
  const anggaran = await db.select().from(anggaranTable);
  const realisasi = await db.select().from(realisasiTable);
  const total_anggaran = anggaran.reduce((sum, a) => sum + parseFloat(a.total_anggaran), 0);
  const total_realisasi = realisasi.reduce((sum, r) => sum + parseFloat(r.jumlah), 0);
  const katMap: Record<string, number> = {};
  for (const r of realisasi) {
    katMap[r.kategori] = (katMap[r.kategori] ?? 0) + parseFloat(r.jumlah);
  }
  res.json({
    total_anggaran,
    total_realisasi,
    sisa_anggaran: total_anggaran - total_realisasi,
    persen_terpakai: total_anggaran > 0 ? Math.round((total_realisasi / total_anggaran) * 100) : 0,
    breakdown_kategori: Object.entries(katMap).map(([kategori, jumlah]) => ({ kategori, jumlah })),
  });
});

export default router;
