import { Router } from "express";
import { db, supplierTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/supplier", authMiddleware, async (_req, res) => {
  const list = await db.select().from(supplierTable).orderBy(supplierTable.nama);
  res.json(list.map((s) => ({ ...s, rating: s.rating ? parseFloat(s.rating) : null })));
});

router.post("/supplier", authMiddleware, async (req, res) => {
  const { nama, kontak, email, alamat, kategori_bahan, status } = req.body;
  if (!nama || !kontak) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [s] = await db
    .insert(supplierTable)
    .values({ nama, kontak, email, alamat, kategori_bahan, status: status ?? "aktif" })
    .returning();
  res.status(201).json({ ...s, rating: null });
});

router.get("/supplier/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const [s] = await db.select().from(supplierTable).where(eq(supplierTable.id, id)).limit(1);
  if (!s) { res.status(404).json({ error: "Supplier tidak ditemukan" }); return; }
  res.json({ ...s, rating: s.rating ? parseFloat(s.rating) : null });
});

router.patch("/supplier/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { nama, kontak, email, alamat, kategori_bahan, rating, status } = req.body;
  const [s] = await db
    .update(supplierTable)
    .set({ nama, kontak, email, alamat, kategori_bahan, rating: rating ? String(rating) : undefined, status })
    .where(eq(supplierTable.id, id))
    .returning();
  if (!s) { res.status(404).json({ error: "Supplier tidak ditemukan" }); return; }
  res.json({ ...s, rating: s.rating ? parseFloat(s.rating) : null });
});

router.delete("/supplier/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  await db.delete(supplierTable).where(eq(supplierTable.id, id));
  res.status(204).end();
});

export default router;
