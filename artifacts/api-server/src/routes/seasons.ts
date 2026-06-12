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
    totalTeams: year >= 2022 ? 10 : year >= 2011 ? 9 : 8,
    totalPlayers: 220,
  }));
  res.json(seasons);
});

// GET /api/seasons/:year/teams
router.get("/:year/teams", async (req: Request, res: Response): Promise<void> => {
  const year = parseInt(req.params["year"] as string);
  if (isNaN(year)) { res.status(400).json({ error: "Invalid year" }); return; }

  const franchises = await db.select().from(franchisesTable);
  res.json(
    franchises.map((f) => ({
      id: f.id,
      name: f.name,
      shortName: f.shortName,
      city: f.city,
      primaryColor: f.primaryColor,
      secondaryColor: f.secondaryColor,
      logoUrl: f.logoUrl,
    }))
  );
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
      basePricecrore: playerSeasonsTable.basePriceCrore,
      soldPricecrore: playerSeasonsTable.soldPriceCrore,
      age: playerSeasonsTable.age,
      franchiseId: playerSeasonsTable.franchiseId,
    })
    .from(playersTable)
    .innerJoin(playerSeasonsTable, and(
      eq(playerSeasonsTable.playerId, playersTable.id),
      eq(playerSeasonsTable.seasonYear, year)
    ));

  const filtered = rows.filter((p) => {
    if (role && p.role !== role) return false;
    if (nationality && p.nationality !== nationality) return false;
    return true;
  });

  const franchiseIds = [...new Set(filtered.map((p) => p.franchiseId).filter((id): id is number => id != null))];
  const franchiseMap: Record<number, string> = {};
  if (franchiseIds.length > 0) {
    const franchises = await db.select().from(franchisesTable);
    franchises.forEach((f) => { franchiseMap[f.id] = f.name; });
  }

  res.json(
    filtered.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      nationality: p.nationality,
      isOverseas: p.isOverseas,
      isCapped: p.isCapped,
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
      basePricecrore: parseFloat(p.basePricecrore as string),
      soldPricecrore: p.soldPricecrore ? parseFloat(p.soldPricecrore as string) : null,
      age: p.age,
      franchiseId: p.franchiseId,
      franchiseName: p.franchiseId ? (franchiseMap[p.franchiseId] ?? null) : null,
    }))
  );
});

export default router;
