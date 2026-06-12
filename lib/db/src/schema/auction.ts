import { pgTable, serial, integer, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roomsTable } from "./rooms";
import { teamsTable } from "./teams";
import { playersTable } from "./players";

export const auctionPoolTable = pgTable("auction_pool", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  playerId: integer("player_id").notNull().references(() => playersTable.id),
  basePriceCrore: numeric("base_price_crore", { precision: 5, scale: 2 }).notNull(),
  status: text("status").notNull().default("available"), // available, sold, unsold, retained
  soldToTeamId: integer("sold_to_team_id").references(() => teamsTable.id),
  soldPriceCrore: numeric("sold_price_crore", { precision: 5, scale: 2 }),
  isRetained: boolean("is_retained").notNull().default(false),
  auctionOrder: integer("auction_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bidsTable = pgTable("bids", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  auctionPoolId: integer("auction_pool_id").notNull().references(() => auctionPoolTable.id),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  bidAmountCrore: numeric("bid_amount_crore", { precision: 5, scale: 2 }).notNull(),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuctionPoolSchema = createInsertSchema(auctionPoolTable).omit({ id: true, createdAt: true });
export type InsertAuctionPool = z.infer<typeof insertAuctionPoolSchema>;
export type AuctionPool = typeof auctionPoolTable.$inferSelect;

export const insertBidSchema = createInsertSchema(bidsTable).omit({ id: true, placedAt: true });
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;
