import { pgTable, serial, integer, numeric, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const anggaranTable = pgTable("anggaran", {
  id: serial("id").primaryKey(),
  dapur_id: integer("dapur_id").notNull(),
  periode: text("periode").notNull(),
  total_anggaran: numeric("total_anggaran").notNull().default("0"),
  anggaran_per_porsi: numeric("anggaran_per_porsi"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const realisasiTable = pgTable("realisasi", {
  id: serial("id").primaryKey(),
  dapur_id: integer("dapur_id").notNull(),
  tanggal: date("tanggal").notNull(),
  kategori: text("kategori").notNull(),
  jumlah: numeric("jumlah").notNull().default("0"),
  deskripsi: text("deskripsi"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnggaranSchema = createInsertSchema(anggaranTable).omit({ id: true, created_at: true });
export type InsertAnggaran = z.infer<typeof insertAnggaranSchema>;
export type Anggaran = typeof anggaranTable.$inferSelect;

export const insertRealisasiSchema = createInsertSchema(realisasiTable).omit({ id: true, created_at: true });
export type InsertRealisasi = z.infer<typeof insertRealisasiSchema>;
export type Realisasi = typeof realisasiTable.$inferSelect;
