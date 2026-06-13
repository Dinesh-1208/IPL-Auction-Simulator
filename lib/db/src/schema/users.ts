import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // matches Clerk ID
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  avatar: text("avatar"),
  email: text("email").notNull(),
  auctionHistory: jsonb("auction_history").default([]),
  statistics: jsonb("statistics").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type User = typeof usersTable.$inferSelect;

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true });
export type Profile = typeof profilesTable.$inferSelect;
