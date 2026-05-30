import { pgTable, serial, integer, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const absensiTable = pgTable("absensi", {
  id: serial("id").primaryKey(),
  dapur_id: integer("dapur_id").notNull(),
  user_id: integer("user_id").notNull(),
  tanggal: date("tanggal").notNull(),
  status: text("status").notNull().default("hadir"),
  keterangan: text("keterangan"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertAbsensiSchema = createInsertSchema(absensiTable).omit({ id: true, created_at: true });
export type InsertAbsensi = z.infer<typeof insertAbsensiSchema>;
export type Absensi = typeof absensiTable.$inferSelect;
