import { Router } from "express";
import { db, dapurTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/dapur", authMiddleware, async (_req, res) => {
  const list = await db.select().from(dapurTable).orderBy(dapurTable.id);
  const users = await db.select().from(usersTable);
  const result = list.map((d) => ({
    ...d,
    kepala_dapur_nama: users.find((u) => u.id === d.kepala_dapur_id)?.nama ?? null,
  }));
  res.json(result);
});

router.post("/dapur", authMiddleware, async (req, res) => {
  const { nama, lokasi, alamat, kapasitas_porsi, kepala_dapur_id, status } = req.body;
  if (!nama || !lokasi || kapasitas_porsi === undefined) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const kapasitas = parseInt(kapasitas_porsi);
  if (isNaN(kapasitas) || kapasitas < 0) {
    res.status(400).json({ error: "kapasitas_porsi harus berupa angka positif" });
    return;
  }
  const [dapur] = await db
    .insert(dapurTable)
    .values({ nama, lokasi, alamat, kapasitas_porsi: kapasitas, kepala_dapur_id: kepala_dapur_id ?? null, status: status ?? "aktif" })
    .returning();
  res.status(201).json({ ...dapur, kepala_dapur_nama: null });
});

router.get("/dapur/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const [dapur] = await db.select().from(dapurTable).where(eq(dapurTable.id, id)).limit(1);
  if (!dapur) { res.status(404).json({ error: "Dapur tidak ditemukan" }); return; }
  const users = await db.select().from(usersTable);
  res.json({ ...dapur, kepala_dapur_nama: users.find((u) => u.id === dapur.kepala_dapur_id)?.nama ?? null });
});

router.patch("/dapur/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { nama, lokasi, alamat, kapasitas_porsi, kepala_dapur_id, status } = req.body;
  if (kapasitas_porsi !== undefined) {
    const kapasitas = parseInt(kapasitas_porsi);
    if (isNaN(kapasitas) || kapasitas < 0) {
      res.status(400).json({ error: "kapasitas_porsi harus berupa angka positif" });
      return;
    }
  }
  const [dapur] = await db
    .update(dapurTable)
    .set({
      nama,
      lokasi,
      alamat,
      kapasitas_porsi: kapasitas_porsi !== undefined ? parseInt(kapasitas_porsi) : undefined,
      kepala_dapur_id,
      status,
    })
    .where(eq(dapurTable.id, id))
    .returning();
  if (!dapur) { res.status(404).json({ error: "Dapur tidak ditemukan" }); return; }
  res.json({ ...dapur, kepala_dapur_nama: null });
});

router.delete("/dapur/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  await db.delete(dapurTable).where(eq(dapurTable.id, id));
  res.status(204).end();
});

export default router;
