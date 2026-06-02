import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const penerimaManfaatTable = pgTable("penerima_manfaat", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  sekolah: text("sekolah").notNull(),
  kelas: text("kelas").notNull(),
  wilayah: text("wilayah").notNull(),
  is_aktif: boolean("is_aktif").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPenerimaManfaatSchema = createInsertSchema(penerimaManfaatTable).omit({ id: true, created_at: true });
export type InsertPenerimaManfaat = z.infer<typeof insertPenerimaManfaatSchema>;
export type PenerimaManfaat = typeof penerimaManfaatTable.$inferSelect;
