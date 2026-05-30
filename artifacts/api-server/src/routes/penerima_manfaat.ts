import { Router } from "express";
import { db, penerimaManfaatTable, verifikasiPenerimaanTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/penerima-manfaat", authMiddleware, async (req, res) => {
  const { sekolah, wilayah } = req.query;
  let list = await db.select().from(penerimaManfaatTable).orderBy(penerimaManfaatTable.nama);
  if (sekolah) list = list.filter((p) => p.sekolah.toLowerCase().includes((sekolah as string).toLowerCase()));
  if (wilayah) list = list.filter((p) => p.wilayah === wilayah);
  res.json(list);
});

router.post("/penerima-manfaat", authMiddleware, async (req, res) => {
  const { nama, sekolah, kelas, wilayah } = req.body;
  if (!nama || !sekolah || !kelas || !wilayah) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [p] = await db.insert(penerimaManfaatTable).values({ nama, sekolah, kelas, wilayah }).returning();
  res.status(201).json(p);
});

router.patch("/penerima-manfaat/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { nama, sekolah, kelas, wilayah, is_aktif } = req.body;
  const [p] = await db
    .update(penerimaManfaatTable)
    .set({ nama, sekolah, kelas, wilayah, is_aktif })
    .where(eq(penerimaManfaatTable.id, id))
    .returning();
  if (!p) { res.status(404).json({ error: "Penerima manfaat tidak ditemukan" }); return; }
  res.json(p);
});

router.delete("/penerima-manfaat/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(penerimaManfaatTable).where(eq(penerimaManfaatTable.id, id));
  res.status(204).end();
});

router.post("/verifikasi-penerimaan", authMiddleware, async (req, res) => {
  const { penerima_manfaat_id, tanggal, status, catatan } = req.body;
  if (!penerima_manfaat_id || !tanggal || !status) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [v] = await db
    .insert(verifikasiPenerimaanTable)
    .values({ penerima_manfaat_id: parseInt(penerima_manfaat_id), tanggal, status, catatan })
    .returning();
  const [pm] = await db.select().from(penerimaManfaatTable).where(eq(penerimaManfaatTable.id, parseInt(penerima_manfaat_id))).limit(1);
  res.status(201).json({ ...v, penerima_nama: pm?.nama ?? null });
});

router.get("/verifikasi-penerimaan/summary", authMiddleware, async (_req, res) => {
  const penerima = await db.select().from(penerimaManfaatTable);
  const today = new Date().toISOString().slice(0, 10);
  const verifikasi = await db.select().from(verifikasiPenerimaanTable);
  const todayVerifikasi = verifikasi.filter((v) => v.tanggal === today && v.status === "hadir");

  const wilayahMap: Record<string, { total: number; hadir: number }> = {};
  for (const p of penerima) {
    if (!wilayahMap[p.wilayah]) wilayahMap[p.wilayah] = { total: 0, hadir: 0 };
    wilayahMap[p.wilayah].total++;
    if (todayVerifikasi.some((v) => v.penerima_manfaat_id === p.id)) {
      wilayahMap[p.wilayah].hadir++;
    }
  }

  const result = Object.entries(wilayahMap).map(([wilayah, data]) => ({
    wilayah,
    total_penerima: data.total,
    hadir_hari_ini: data.hadir,
    persen_jangkauan: data.total > 0 ? Math.round((data.hadir / data.total) * 100) : 0,
  }));
  res.json(result);
});

export default router;
