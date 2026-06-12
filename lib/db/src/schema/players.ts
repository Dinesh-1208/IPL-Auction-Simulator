import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Batter, Bowler, All-Rounder, Wicket-Keeper
  nationality: text("nationality").notNull(),
  isOverseas: boolean("is_overseas").notNull().default(false),
  isCapped: boolean("is_capped").notNull().default(false),
  battingStyle: text("batting_style"),
  bowlingStyle: text("bowling_style"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerSeasonsTable = pgTable("player_seasons", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id),
  seasonYear: integer("season_year").notNull(),
  franchiseId: integer("franchise_id"),
  basePriceCrore: numeric("base_price_crore", { precision: 5, scale: 2 }).notNull(),
  soldPriceCrore: numeric("sold_price_crore", { precision: 5, scale: 2 }),
  age: integer("age"),
  isCaptain: boolean("is_captain").notNull().default(false),
  isRetained: boolean("is_retained").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;

export const insertPlayerSeasonSchema = createInsertSchema(playerSeasonsTable).omit({ id: true, createdAt: true });
export type InsertPlayerSeason = z.infer<typeof insertPlayerSeasonSchema>;
export type PlayerSeason = typeof playerSeasonsTable.$inferSelect;
