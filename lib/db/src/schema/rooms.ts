import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  hostUserId: text("host_user_id").notNull(),
  seasonYear: integer("season_year").notNull(),
  auctionType: text("auction_type").notNull(), // mega, mini
  status: text("status").notNull().default("lobby"), // lobby, preparation, auction, completed
  budgetCrore: numeric("budget_crore", { precision: 6, scale: 2 }).notNull(),
  maxSquadSize: integer("max_squad_size").notNull(),
  maxOverseas: integer("max_overseas").notNull(),
  maxOwnersPerTeam: integer("max_owners_per_team").notNull(),
  auctionSpeed: text("auction_speed").notNull(), // fast, normal, slow
  currentPlayerIndex: integer("current_player_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const roomMembersTable = pgTable("room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  userId: text("user_id").notNull(),
  displayName: text("display_name").notNull(),
  teamId: integer("team_id"),
  isOnline: boolean("is_online").notNull().default(true),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;

export const insertRoomMemberSchema = createInsertSchema(roomMembersTable).omit({ id: true, joinedAt: true });
export type InsertRoomMember = z.infer<typeof insertRoomMemberSchema>;
export type RoomMember = typeof roomMembersTable.$inferSelect;
