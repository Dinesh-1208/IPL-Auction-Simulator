import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { franchisesTable } from "./franchises";

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
  rtmEnabled: boolean("rtm_enabled").notNull().default(true),
  maxRetentions: integer("max_retentions").notNull().default(6),
  rtmPendingTeamId: integer("rtm_pending_team_id"),
  rtmBidAmountCrore: numeric("rtm_bid_amount_crore", { precision: 5, scale: 2 }),
  rtmBidderTeamId: integer("rtm_bidder_team_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => (roomsTable as any).id),
  franchiseId: integer("franchise_id").notNull().references(() => franchisesTable.id),
  budgetRemainingCrore: numeric("budget_remaining_crore", { precision: 6, scale: 2 }).notNull(),
  budgetSpentCrore: numeric("budget_spent_crore", { precision: 6, scale: 2 }).notNull().default("0"),
  retentionComplete: boolean("retention_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamOwnersTable = pgTable("team_owners", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => (teamsTable as any).id),
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

export const roomMembersTable = pgTable("room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => (roomsTable as any).id),
  userId: text("user_id").notNull(),
  displayName: text("display_name").notNull(),
  teamId: integer("team_id"),
  isOnline: boolean("is_online").notNull().default(true),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;

export const insertRoomMemberSchema = createInsertSchema(roomMembersTable).omit({ id: true, joinedAt: true });
export type InsertRoomMember = z.infer<typeof insertRoomMemberSchema>;
export type RoomMember = typeof roomMembersTable.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

