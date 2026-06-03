import { Router } from "express";
import { db, absensiTable, dapurTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const VALID_STATUS = ["hadir", "tidak_hadir", "sakit", "izin"];

const router = Router();

router.get("/absensi", authMiddleware, async (req, res) => {
  const { dapur_id, tanggal } = req.query;
  let list = await db.select().from(absensiTable).orderBy(absensiTable.tanggal);
  if (dapur_id) list = list.filter((a) => a.dapur_id === parseInt(dapur_id as string));
  if (tanggal) list = list.filter((a) => a.tanggal === tanggal);
  const dapur = await db.select().from(dapurTable);
  const users = await db.select().from(usersTable);
  res.json(list.map((a) => ({
    ...a,
    dapur_nama: dapur.find((d) => d.id === a.dapur_id)?.nama ?? null,
    user_nama: users.find((u) => u.id === a.user_id)?.nama ?? null,
  })));
});

router.post("/absensi", authMiddleware, async (req, res) => {
  const { dapur_id, user_id, tanggal, status, keterangan } = req.body;
  if (!dapur_id || !user_id || !tanggal || !status) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  if (!VALID_STATUS.includes(status)) {
    res.status(400).json({ error: `Status tidak valid. Pilihan: ${VALID_STATUS.join(", ")}` });
    return;
  }
  // Validate user exists
  const [userExist] = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(user_id))).limit(1);
  if (!userExist) {
    res.status(404).json({ error: "User tidak ditemukan" });
    return;
  }
  // Prevent duplicate attendance for same user on same day
  const existing = await db.select().from(absensiTable)
    .where(and(
      eq(absensiTable.user_id, parseInt(user_id)),
      eq(absensiTable.tanggal, tanggal)
    )).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Absensi untuk staff ini sudah dicatat pada tanggal tersebut" });
    return;
  }
  const [a] = await db
    .insert(absensiTable)
    .values({ dapur_id: parseInt(dapur_id), user_id: parseInt(user_id), tanggal, status, keterangan })
    .returning();
  res.status(201).json({ ...a, dapur_nama: null, user_nama: null });
});

router.patch("/absensi/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { status, keterangan } = req.body;
  if (status !== undefined && !VALID_STATUS.includes(status)) {
    res.status(400).json({ error: `Status tidak valid. Pilihan: ${VALID_STATUS.join(", ")}` });
    return;
  }
  const [a] = await db
    .update(absensiTable)
    .set({ status, keterangan })
    .where(eq(absensiTable.id, id))
    .returning();
  if (!a) { res.status(404).json({ error: "Absensi tidak ditemukan" }); return; }
  res.json({ ...a, dapur_nama: null, user_nama: null });
});

router.delete("/absensi/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  await db.delete(absensiTable).where(eq(absensiTable.id, id));
  res.status(204).end();
});

export default router;
