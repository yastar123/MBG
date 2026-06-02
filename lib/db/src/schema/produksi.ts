import { pgTable, serial, integer, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const produksiTable = pgTable("produksi", {
  id: serial("id").primaryKey(),
  dapur_id: integer("dapur_id").notNull(),
  menu_id: integer("menu_id").notNull(),
  tanggal: date("tanggal").notNull(),
  target_porsi: integer("target_porsi").notNull().default(0),
  realisasi_porsi: integer("realisasi_porsi"),
  status: text("status").notNull().default("dijadwalkan"),
  catatan_qc: text("catatan_qc"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertProduksiSchema = createInsertSchema(produksiTable).omit({ id: true, created_at: true });
export type InsertProduksi = z.infer<typeof insertProduksiSchema>;
export type Produksi = typeof produksiTable.$inferSelect;
