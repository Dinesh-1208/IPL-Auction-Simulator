import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  roomsTable, teamsTable, franchisesTable,
  auctionPoolTable, playersTable, aiReportsTable
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";

const router = Router({ mergeParams: true });

// GET /api/rooms/:code/ai-report
router.get("/", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const report = await db.select().from(aiReportsTable)
    .where(eq(aiReportsTable.roomId, room[0].id))
    .limit(1);

  if (!report.length) {
    res.json({
      id: 0,
      roomId: room[0].id,
      status: "pending",
      generatedAt: null,
      rankings: [],
      predictedChampion: null,
      overallAnalysis: null,
    });
    return;
  }

  const r = report[0];
  res.json({
    id: r.id,
    roomId: r.roomId,
    status: r.status,
    generatedAt: r.generatedAt?.toISOString() ?? null,
    rankings: (r.rankings as unknown[]) ?? [],
    predictedChampion: r.predictedChampion,
    overallAnalysis: r.overallAnalysis,
  });
});

// POST /api/rooms/:code/ai-report
router.post("/", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const teams = await db.select().from(teamsTable).where(eq(teamsTable.roomId, room[0].id));
  if (!teams.length) { res.status(400).json({ error: "No teams in room" }); return; }

  const franchises = await db.select().from(franchisesTable);
  const franchiseMap = Object.fromEntries(franchises.map(f => [f.id, f]));

  const squadData: Record<string, unknown> = {};
  for (const team of teams) {
    const franchise = franchiseMap[team.franchiseId];
    const poolEntries = await db.select().from(auctionPoolTable)
      .where(eq(auctionPoolTable.soldToTeamId, team.id));

    const playerIds = poolEntries.map((e) => e.playerId);
    const players = playerIds.length > 0
      ? (await db.select().from(playersTable)).filter(p => playerIds.includes(p.id))
      : [];
    const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

    squadData[franchise?.shortName ?? `Team${team.id}`] = {
      franchiseName: franchise?.name,
      budgetRemaining: parseFloat(team.budgetRemainingCrore as string),
      budgetSpent: parseFloat(team.budgetSpentCrore as string),
      players: poolEntries.map((e) => {
        const p = playerMap[e.playerId];
        return {
          name: p?.name,
          role: p?.role,
          nationality: p?.nationality,
          isOverseas: p?.isOverseas,
          priceCrore: parseFloat((e.soldPriceCrore ?? e.basePriceCrore) as string),
          isRetained: e.isRetained,
          battingStyle: p?.battingStyle,
          bowlingStyle: p?.bowlingStyle,
        };
      }),
    };
  }

  let reportRecord;
  const existing = await db.select().from(aiReportsTable).where(eq(aiReportsTable.roomId, room[0].id)).limit(1);
  if (existing.length) {
    const [updated] = await db.update(aiReportsTable)
      .set({ status: "generating" })
      .where(eq(aiReportsTable.id, existing[0].id))
      .returning();
    reportRecord = updated;
  } else {
    const [created] = await db.insert(aiReportsTable).values({
      roomId: room[0].id,
      status: "generating",
    }).returning();
    reportRecord = created;
  }

  res.json({
    id: reportRecord.id,
    roomId: reportRecord.roomId,
    status: "generating",
    generatedAt: null,
    rankings: [],
    predictedChampion: null,
    overallAnalysis: null,
  });

  generateAiAnalysis(reportRecord.id, squadData, teams, franchiseMap).catch((err) => {
    logger.error({ err }, "AI analysis generation failed");
  });
});

async function generateAiAnalysis(
  reportId: number,
  squadData: Record<string, unknown>,
  teams: typeof teamsTable.$inferSelect[],
  franchiseMap: Record<number, typeof franchisesTable.$inferSelect>
): Promise<void> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert cricket analyst. Analyze these IPL auction squads and rank them.

Squad Data:
${JSON.stringify(squadData, null, 2)}

For each team, evaluate and score (0-10) these dimensions:
- topOrder, middleOrder, finishers, spinAttack, paceAttack, deathBowling, powerpayBowling, benchStrength, captaincy, balance, squadDepth

Calculate an overall score (weighted average). List 2-3 strengths and 2-3 weaknesses for each team.

Respond ONLY with valid JSON in this exact format:
{
  "overallAnalysis": "One paragraph summary",
  "predictedChampion": "SHORT_NAME",
  "rankings": [
    {
      "rank": 1,
      "shortName": "CSK",
      "franchiseName": "Chennai Super Kings",
      "overallScore": 8.5,
      "topOrderScore": 9,
      "middleOrderScore": 8,
      "finishersScore": 8,
      "spinAttackScore": 9,
      "paceAttackScore": 7,
      "deathBowlingScore": 8,
      "powerpayBowlingScore": 7,
      "benchStrengthScore": 8,
      "captaincyScore": 9,
      "balanceScore": 8,
      "squadDepthScore": 8,
      "strengths": ["Deep spin attack"],
      "weaknesses": ["Pace bowling thin"],
      "reasoning": "Detailed reasoning",
      "budgetUtilization": 87.5
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const analysis = JSON.parse(jsonMatch[0]) as {
      overallAnalysis: string;
      predictedChampion: string;
      rankings: Array<{
        rank: number; shortName: string; franchiseName: string;
        overallScore: number; topOrderScore: number; middleOrderScore: number;
        finishersScore: number; spinAttackScore: number; paceAttackScore: number;
        deathBowlingScore: number; powerpayBowlingScore: number; benchStrengthScore: number;
        captaincyScore: number; balanceScore: number; squadDepthScore: number;
        strengths: string[]; weaknesses: string[]; reasoning: string; budgetUtilization: number;
      }>;
    };

    const enrichedRankings = analysis.rankings.map((r, idx) => {
      const teamEntry = teams.find((t) => {
        const f = franchiseMap[t.franchiseId];
        return f?.shortName === r.shortName || f?.name === r.franchiseName;
      });
      const franchise = teamEntry ? franchiseMap[teamEntry.franchiseId] : null;

      return {
        rank: r.rank ?? idx + 1,
        teamId: teamEntry?.id ?? 0,
        franchiseName: r.franchiseName ?? franchise?.name ?? r.shortName,
        shortName: r.shortName ?? franchise?.shortName ?? r.franchiseName,
        primaryColor: franchise?.primaryColor ?? "#1a1a2e",
        overallScore: r.overallScore,
        topOrderScore: r.topOrderScore,
        middleOrderScore: r.middleOrderScore,
        finishersScore: r.finishersScore,
        spinAttackScore: r.spinAttackScore,
        paceAttackScore: r.paceAttackScore,
        deathBowlingScore: r.deathBowlingScore,
        powerpayBowlingScore: r.powerpayBowlingScore,
        benchStrengthScore: r.benchStrengthScore,
        captaincyScore: r.captaincyScore,
        balanceScore: r.balanceScore,
        squadDepthScore: r.squadDepthScore,
        strengths: r.strengths ?? [],
        weaknesses: r.weaknesses ?? [],
        reasoning: r.reasoning ?? "",
        budgetUtilization: r.budgetUtilization ?? 0,
      };
    });

    await db.update(aiReportsTable).set({
      status: "completed",
      rankings: enrichedRankings,
      predictedChampion: analysis.predictedChampion,
      overallAnalysis: analysis.overallAnalysis,
      generatedAt: new Date(),
    }).where(eq(aiReportsTable.id, reportId));

  } catch (err) {
    logger.error({ err }, "Failed to generate AI analysis");
    await db.update(aiReportsTable).set({ status: "failed" }).where(eq(aiReportsTable.id, reportId));
  }
}

export default router;
