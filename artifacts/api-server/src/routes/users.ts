import { Router } from "express";
import { db, usersTable, dapurTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/users", authMiddleware, async (req, res) => {
  const { role, dapur_id } = req.query;
  let users = await db
    .select({
      id: usersTable.id,
      nama: usersTable.nama,
      email: usersTable.email,
      role: usersTable.role,
      dapur_id: usersTable.dapur_id,
      no_hp: usersTable.no_hp,
      is_active: usersTable.is_active,
      created_at: usersTable.created_at,
    })
    .from(usersTable);

  if (role) users = users.filter((u) => u.role === role);
  if (dapur_id) users = users.filter((u) => u.dapur_id === parseInt(dapur_id as string));

  const dapurList = await db.select().from(dapurTable);
  const result = users.map((u) => ({
    ...u,
    dapur_nama: dapurList.find((d) => d.id === u.dapur_id)?.nama ?? null,
  }));
  res.json(result);
});

router.post("/users", authMiddleware, async (req, res) => {
  const { nama, email, password, role, dapur_id, no_hp } = req.body;
  if (!nama || !email || !password || !role) {
    res.status(400).json({ error: "Data tidak lengkap" });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ nama, email, password_hash: hashed, role, dapur_id: dapur_id ?? null, no_hp: no_hp ?? null })
    .returning();
  const { password_hash, ...safeUser } = user;
  res.status(201).json({ ...safeUser, dapur_nama: null });
});

router.get("/users/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  const dapurList = user.dapur_id ? await db.select().from(dapurTable).where(eq(dapurTable.id, user.dapur_id)).limit(1) : [];
  const { password_hash, ...safeUser } = user;
  res.json({ ...safeUser, dapur_nama: dapurList[0]?.nama ?? null });
});

router.patch("/users/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  const { nama, email, role, dapur_id, no_hp, is_active, password } = req.body;
  const updateData: Record<string, unknown> = {};
  if (nama !== undefined) updateData.nama = nama;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (dapur_id !== undefined) updateData.dapur_id = dapur_id;
  if (no_hp !== undefined) updateData.no_hp = no_hp;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (password) updateData.password_hash = await bcrypt.hash(password, 10);
  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  const { password_hash, ...safeUser } = user;
  res.json({ ...safeUser, dapur_nama: null });
});

router.delete("/users/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).end();
});

export default router;
