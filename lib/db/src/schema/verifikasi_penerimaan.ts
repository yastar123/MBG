import { pgTable, serial, integer, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verifikasiPenerimaanTable = pgTable("verifikasi_penerimaan", {
  id: serial("id").primaryKey(),
  penerima_manfaat_id: integer("penerima_manfaat_id").notNull(),
  tanggal: date("tanggal").notNull(),
  status: text("status").notNull().default("hadir"),
  catatan: text("catatan"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertVerifikasiPenerimaanSchema = createInsertSchema(verifikasiPenerimaanTable).omit({ id: true, created_at: true });
export type InsertVerifikasiPenerimaan = z.infer<typeof insertVerifikasiPenerimaanSchema>;
export type VerifikasiPenerimaan = typeof verifikasiPenerimaanTable.$inferSelect;
