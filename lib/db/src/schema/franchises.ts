import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const franchisesTable = pgTable("franchises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  city: text("city").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  logoUrl: text("logo_url"),
  foundedYear: integer("founded_year"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFranchiseSchema = createInsertSchema(franchisesTable).omit({ id: true, createdAt: true });
export type InsertFranchise = z.infer<typeof insertFranchiseSchema>;
export type Franchise = typeof franchisesTable.$inferSelect;
