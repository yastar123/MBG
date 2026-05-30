import { Router } from "express";
import { db, menuTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/menu", authMiddleware, async (req, res) => {
  const { tanggal } = req.query;
  let list = await db.select().from(menuTable).orderBy(menuTable.tanggal);
  if (tanggal) list = list.filter((m) => m.tanggal === tanggal);
  res.json(list.map((m) => ({ ...m, kalori: m.kalori ? parseFloat(m.kalori) : null })));
});

router.post("/menu", authMiddleware, async (req, res) => {
  const { nama, deskripsi, tanggal, kategori, target_porsi, kalori } = req.body;
  if (!nama || !tanggal || !kategori || target_porsi === undefined) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const [menu] = await db
    .insert(menuTable)
    .values({ nama, deskripsi, tanggal, kategori, target_porsi: parseInt(target_porsi), kalori: kalori ? String(kalori) : null })
    .returning();
  res.status(201).json({ ...menu, kalori: menu.kalori ? parseFloat(menu.kalori) : null });
});

router.get("/menu/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [menu] = await db.select().from(menuTable).where(eq(menuTable.id, id)).limit(1);
  if (!menu) { res.status(404).json({ error: "Menu tidak ditemukan" }); return; }
  res.json({ ...menu, kalori: menu.kalori ? parseFloat(menu.kalori) : null });
});

router.patch("/menu/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { nama, deskripsi, tanggal, kategori, target_porsi, kalori } = req.body;
  const [menu] = await db
    .update(menuTable)
    .set({ nama, deskripsi, tanggal, kategori, target_porsi: target_porsi ? parseInt(target_porsi) : undefined, kalori: kalori ? String(kalori) : undefined })
    .where(eq(menuTable.id, id))
    .returning();
  if (!menu) { res.status(404).json({ error: "Menu tidak ditemukan" }); return; }
  res.json({ ...menu, kalori: menu.kalori ? parseFloat(menu.kalori) : null });
});

router.delete("/menu/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(menuTable).where(eq(menuTable.id, id));
  res.status(204).end();
});

export default router;
