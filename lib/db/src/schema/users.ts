import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff_dapur"),
  dapur_id: integer("dapur_id"),
  no_hp: text("no_hp"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
