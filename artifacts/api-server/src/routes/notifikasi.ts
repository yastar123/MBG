import { Router } from "express";
import { db, notifikasiTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/notifikasi", authMiddleware, async (req: AuthRequest, res) => {
  const list = await db.select().from(notifikasiTable).orderBy(notifikasiTable.created_at);
  res.json(list);
});

router.patch("/notifikasi/:id/baca", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [n] = await db
    .update(notifikasiTable)
    .set({ is_dibaca: true })
    .where(eq(notifikasiTable.id, id))
    .returning();
  if (!n) { res.status(404).json({ error: "Notifikasi tidak ditemukan" }); return; }
  res.json(n);
});

export default router;
