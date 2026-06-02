import { pgTable, serial, text, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const menuTable = pgTable("menu", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi"),
  tanggal: date("tanggal").notNull(),
  kategori: text("kategori").notNull().default("makan_siang"),
  target_porsi: integer("target_porsi").notNull().default(0),
  kalori: numeric("kalori"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertMenuSchema = createInsertSchema(menuTable).omit({ id: true, created_at: true });
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = typeof menuTable.$inferSelect;
