import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stokTable = pgTable("stok", {
  id: serial("id").primaryKey(),
  bahan_baku_id: integer("bahan_baku_id").notNull().unique(),
  kuantitas: numeric("kuantitas").notNull().default("0"),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStokSchema = createInsertSchema(stokTable).omit({ id: true });
export type InsertStok = z.infer<typeof insertStokSchema>;
export type Stok = typeof stokTable.$inferSelect;
