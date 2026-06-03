import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token tidak ditemukan" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 2) {
      res.status(401).json({ error: "Token tidak valid" });
      return;
    }
    const userId = parseInt(parts[0]);
    if (isNaN(userId) || userId <= 0) {
      res.status(401).json({ error: "Token tidak valid" });
      return;
    }
    req.userId = userId;
    req.userRole = parts[1];
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
}

export function makeToken(userId: number, role: string): string {
  return Buffer.from(`${userId}:${role}:${Date.now()}`).toString("base64");
}
