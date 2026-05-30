import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { makeToken, authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email dan password wajib diisi" });
    return;
  }
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user[0]) {
    res.status(401).json({ error: "Email atau password salah" });
    return;
  }
  if (!user[0].is_active) {
    res.status(401).json({ error: "Akun tidak aktif" });
    return;
  }
  if (user[0].password_hash !== password) {
    res.status(401).json({ error: "Email atau password salah" });
    return;
  }
  const token = makeToken(user[0].id, user[0].role);
  const { password_hash, ...safeUser } = user[0];
  res.json({ token, user: safeUser });
});

router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);
  if (!user[0]) {
    res.status(404).json({ error: "User tidak ditemukan" });
    return;
  }
  const { password_hash, ...safeUser } = user[0];
  res.json(safeUser);
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Berhasil logout" });
});

export default router;
