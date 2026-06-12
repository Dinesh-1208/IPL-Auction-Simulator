import { pgTable, serial, integer, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roomsTable } from "./rooms";
import { franchisesTable } from "./franchises";

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  franchiseId: integer("franchise_id").notNull().references(() => franchisesTable.id),
  budgetRemainingCrore: numeric("budget_remaining_crore", { precision: 6, scale: 2 }).notNull(),
  budgetSpentCrore: numeric("budget_spent_crore", { precision: 6, scale: 2 }).notNull().default("0"),
  retentionComplete: boolean("retention_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamOwnersTable = pgTable("team_owners", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  userId: text("user_id").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teamsTable).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;

export const insertTeamOwnerSchema = createInsertSchema(teamOwnersTable).omit({ id: true, createdAt: true });
export type InsertTeamOwner = z.infer<typeof insertTeamOwnerSchema>;
export type TeamOwner = typeof teamOwnersTable.$inferSelect;
