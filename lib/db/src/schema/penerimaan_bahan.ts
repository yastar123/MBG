import { pgTable, serial, integer, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const penerimaanBahanTable = pgTable("penerimaan_bahan", {
  id: serial("id").primaryKey(),
  supplier_id: integer("supplier_id").notNull(),
  tanggal: date("tanggal").notNull(),
  total_item: integer("total_item").notNull().default(0),
  status: text("status").notNull().default("pending"),
  catatan: text("catatan"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPenerimaanBahanSchema = createInsertSchema(penerimaanBahanTable).omit({ id: true, created_at: true });
export type InsertPenerimaanBahan = z.infer<typeof insertPenerimaanBahanSchema>;
export type PenerimaanBahan = typeof penerimaanBahanTable.$inferSelect;
