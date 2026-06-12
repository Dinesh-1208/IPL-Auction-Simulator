import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { roomsTable } from "./rooms";

export const aiReportsTable = pgTable("ai_reports", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  rankings: jsonb("rankings"),
  predictedChampion: text("predicted_champion"),
  overallAnalysis: text("overall_analysis"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiReportSchema = createInsertSchema(aiReportsTable).omit({ id: true, createdAt: true });
export type InsertAiReport = z.infer<typeof insertAiReportSchema>;
export type AiReport = typeof aiReportsTable.$inferSelect;
