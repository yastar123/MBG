import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supplierTable = pgTable("supplier", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kontak: text("kontak").notNull(),
  email: text("email"),
  alamat: text("alamat"),
  kategori_bahan: text("kategori_bahan"),
  rating: numeric("rating"),
  status: text("status").notNull().default("aktif"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(supplierTable).omit({ id: true, created_at: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof supplierTable.$inferSelect;
