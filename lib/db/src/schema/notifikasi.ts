import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notifikasiTable = pgTable("notifikasi", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  pesan: text("pesan").notNull(),
  tipe: text("tipe").notNull().default("info"),
  is_dibaca: boolean("is_dibaca").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotifikasiSchema = createInsertSchema(notifikasiTable).omit({ id: true, created_at: true });
export type InsertNotifikasi = z.infer<typeof insertNotifikasiSchema>;
export type Notifikasi = typeof notifikasiTable.$inferSelect;
