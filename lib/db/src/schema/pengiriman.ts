import { pgTable, serial, integer, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pengirimanTable = pgTable("pengiriman", {
  id: serial("id").primaryKey(),
  dapur_id: integer("dapur_id").notNull(),
  driver_id: integer("driver_id"),
  tanggal: date("tanggal").notNull(),
  jumlah_porsi: integer("jumlah_porsi").notNull().default(0),
  tujuan: text("tujuan").notNull(),
  status: text("status").notNull().default("dijadwalkan"),
  catatan: text("catatan"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertPengirimanSchema = createInsertSchema(pengirimanTable).omit({ id: true, created_at: true });
export type InsertPengiriman = z.infer<typeof insertPengirimanSchema>;
export type Pengiriman = typeof pengirimanTable.$inferSelect;
