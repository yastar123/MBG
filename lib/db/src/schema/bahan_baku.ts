import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bahanBakuTable = pgTable("bahan_baku", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  satuan: text("satuan").notNull(),
  stok_minimum: numeric("stok_minimum").notNull().default("0"),
  kategori: text("kategori"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertBahanBakuSchema = createInsertSchema(bahanBakuTable).omit({ id: true, created_at: true });
export type InsertBahanBaku = z.infer<typeof insertBahanBakuSchema>;
export type BahanBaku = typeof bahanBakuTable.$inferSelect;
