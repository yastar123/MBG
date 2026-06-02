import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dapurTable = pgTable("dapur", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  lokasi: text("lokasi").notNull(),
  alamat: text("alamat"),
  kapasitas_porsi: integer("kapasitas_porsi").notNull().default(0),
  kepala_dapur_id: integer("kepala_dapur_id"),
  status: text("status").notNull().default("aktif"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertDapurSchema = createInsertSchema(dapurTable).omit({ id: true, created_at: true });
export type InsertDapur = z.infer<typeof insertDapurSchema>;
export type Dapur = typeof dapurTable.$inferSelect;
