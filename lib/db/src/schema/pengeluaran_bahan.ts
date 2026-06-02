import { pgTable, serial, integer, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pengeluaranBahanTable = pgTable("pengeluaran_bahan", {
  id: serial("id").primaryKey(),
  dapur_id: integer("dapur_id").notNull(),
  tanggal: date("tanggal").notNull(),
  total_item: integer("total_item").notNull().default(0),
  status: text("status").notNull().default("pending"),
  catatan: text("catatan"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPengeluaranBahanSchema = createInsertSchema(pengeluaranBahanTable).omit({ id: true, created_at: true });
export type InsertPengeluaranBahan = z.infer<typeof insertPengeluaranBahanSchema>;
export type PengeluaranBahan = typeof pengeluaranBahanTable.$inferSelect;
