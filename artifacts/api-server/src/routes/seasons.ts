import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { franchisesTable, playersTable, playerSeasonsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// GET /api/seasons
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const seasons = years.map((year) => ({
    year,
    name: `IPL ${year}`,
    label: `IPL ${year} Squads → ${year + 1} Auction`,
    totalTeams: year >= 2022 ? 10 : year >= 2011 ? 9 : 8,
  }));
  res.json(seasons);
});

// GET /api/seasons/:year/teams
router.get("/:year/teams", async (req: Request, res: Response): Promise<void> => {
  const year = parseInt(req.params["year"] as string);
  if (isNaN(year)) { res.status(400).json({ error: "Invalid year" }); return; }
  const franchises = await db.select().from(franchisesTable);
  res.json(franchises.map((f) => ({
    id: f.id,
    name: f.name,
    shortName: f.shortName,
    city: f.city,
    primaryColor: f.primaryColor,
    secondaryColor: f.secondaryColor,
    logoUrl: f.logoUrl,
  })));
});

// GET /api/seasons/:year/players
router.get("/:year/players", async (req: Request, res: Response): Promise<void> => {
  const year = parseInt(req.params["year"] as string);
  if (isNaN(year)) { res.status(400).json({ error: "Invalid year" }); return; }

  const { teamId, role, nationality } = req.query;

  const conditions = [eq(playerSeasonsTable.seasonYear, year)];
  if (teamId) conditions.push(eq(playerSeasonsTable.franchiseId, parseInt(teamId as string)));

  const rows = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      role: playersTable.role,
      nationality: playersTable.nationality,
      isOverseas: playersTable.isOverseas,
      isCapped: playersTable.isCapped,
      battingStyle: playersTable.battingStyle,
      bowlingStyle: playersTable.bowlingStyle,
      playerAge: playersTable.age,
      basePriceCrore: playerSeasonsTable.basePriceCrore,
      soldPriceCrore: playerSeasonsTable.soldPriceCrore,
      seasonAge: playerSeasonsTable.age,
      franchiseId: playerSeasonsTable.franchiseId,
      isCaptain: playerSeasonsTable.isCaptain,
      matchesPlayed: playerSeasonsTable.matchesPlayed,
      runs: playerSeasonsTable.runs,
      wickets: playerSeasonsTable.wickets,
      strikeRate: playerSeasonsTable.strikeRate,
      economy: playerSeasonsTable.economy,
      highScore: playerSeasonsTable.highScore,
      bestBowling: playerSeasonsTable.bestBowling,
    })
    .from(playersTable)
    .innerJoin(playerSeasonsTable, and(
      eq(playerSeasonsTable.playerId, playersTable.id),
      eq(playerSeasonsTable.seasonYear, year)
    ));

  let filtered = rows.filter((p) => {
    if (role && p.role !== role) return false;
    if (nationality && p.nationality !== nationality) return false;
    return true;
  });

  const franchiseIds = [...new Set(filtered.map((p) => p.franchiseId).filter((id): id is number => id != null))];
  const franchiseMap: Record<number, { name: string; shortName: string; primaryColor: string }> = {};
  if (franchiseIds.length > 0) {
    const franchises = await db.select().from(franchisesTable);
    franchises.forEach((f) => { franchiseMap[f.id] = { name: f.name, shortName: f.shortName, primaryColor: f.primaryColor }; });
  }

  res.json(filtered.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    nationality: p.nationality,
    isOverseas: p.isOverseas,
    isCapped: p.isCapped,
    battingStyle: p.battingStyle,
    bowlingStyle: p.bowlingStyle,
    basePriceCrore: parseFloat(p.basePriceCrore as string),
    soldPriceCrore: p.soldPriceCrore ? parseFloat(p.soldPriceCrore as string) : null,
    age: p.seasonAge ?? p.playerAge,
    franchiseId: p.franchiseId,
    franchiseName: p.franchiseId ? (franchiseMap[p.franchiseId]?.name ?? null) : null,
    franchiseShortName: p.franchiseId ? (franchiseMap[p.franchiseId]?.shortName ?? null) : null,
    isCaptain: p.isCaptain,
    // Season stats
    matchesPlayed: p.matchesPlayed,
    runs: p.runs,
    wickets: p.wickets,
    strikeRate: p.strikeRate ? parseFloat(p.strikeRate as string) : null,
    economy: p.economy ? parseFloat(p.economy as string) : null,
    highScore: p.highScore,
    bestBowling: p.bestBowling,
  })));
});

export default router;
