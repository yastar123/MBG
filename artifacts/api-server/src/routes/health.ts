import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as time, current_database() as db");
    res.json({
      status: "ok",
      database: result.rows[0],
      ssl: Boolean((pool as any).options?.ssl),
      env: {
        hasSupabaseUrl: Boolean(process.env.SUPABASE_DATABASE_URL),
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (err: any) {
    console.error("DB health check error:", err);
    res.status(500).json({
      status: "error",
      error: err?.message || String(err),
      code: err?.code,
      env: {
        hasSupabaseUrl: Boolean(process.env.SUPABASE_DATABASE_URL),
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        nodeEnv: process.env.NODE_ENV,
      },
    });
  }
});

export default router;
