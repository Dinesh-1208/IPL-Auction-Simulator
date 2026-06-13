import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  roomsTable, teamsTable, teamOwnersTable, franchisesTable,
  auctionPoolTable, playersTable, roomMembersTable, retentionsTable
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { getSocketServer } from "../lib/socket";

const router = Router({ mergeParams: true });

// GET /api/rooms/:code/teams
router.get("/", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const teams = await db.select().from(teamsTable).where(eq(teamsTable.roomId, room[0].id));
  const franchises = await db.select().from(franchisesTable);
  const teamIds = teams.map((t) => t.id);
  const owners = teamIds.length > 0
    ? await db.select().from(teamOwnersTable).where(inArray(teamOwnersTable.teamId, teamIds))
    : [];
  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.roomId, room[0].id));

  const franchiseMap = Object.fromEntries(franchises.map(f => [f.id, f]));
  const memberMap = Object.fromEntries(members.map(m => [m.userId, m]));

  res.json(teams.map((t) => {
    const franchise = franchiseMap[t.franchiseId];
    const teamOwners = owners.filter((o) => o.teamId === t.id);
    return {
      id: t.id,
      roomId: t.roomId,
      franchiseId: t.franchiseId,
      franchiseName: franchise?.name ?? "",
      shortName: franchise?.shortName ?? "",
      primaryColor: franchise?.primaryColor ?? "#000",
      secondaryColor: franchise?.secondaryColor ?? "#fff",
      budgetRemainingCrore: parseFloat(t.budgetRemainingCrore as string),
      budgetSpentCrore: parseFloat(t.budgetSpentCrore as string),
      retentionComplete: t.retentionComplete,
      owners: teamOwners.map((o) => ({
        userId: o.userId,
        displayName: o.displayName,
        isOnline: memberMap[o.userId]?.isOnline ?? false,
      })),
    };
  }));
});

// POST /api/rooms/:code/teams/:franchiseId/select
router.post("/:franchiseId/select", async (req: Request<{ code: string; franchiseId: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const franchiseId = parseInt(req.params.franchiseId);
  const { userId, displayName } = req.body;
  if (!userId || !displayName) { res.status(400).json({ error: "userId and displayName required" }); return; }

  const franchise = await db.select().from(franchisesTable).where(eq(franchisesTable.id, franchiseId)).limit(1);
  if (!franchise.length) { res.status(404).json({ error: "Franchise not found" }); return; }

  let team = await db.select().from(teamsTable)
    .where(and(eq(teamsTable.roomId, room[0].id), eq(teamsTable.franchiseId, franchiseId)))
    .limit(1);

  if (!team.length) {
    const [newTeam] = await db.insert(teamsTable).values({
      roomId: room[0].id,
      franchiseId,
      budgetRemainingCrore: room[0].budgetCrore,
      budgetSpentCrore: "0",
      retentionComplete: false,
    }).returning();
    team = [newTeam];
  }

  const owners = await db.select().from(teamOwnersTable).where(eq(teamOwnersTable.teamId, team[0].id));
  if (owners.length >= room[0].maxOwnersPerTeam) {
    res.status(400).json({ error: "Team is full" });
    return;
  }

  const alreadyOwner = owners.find((o) => o.userId === userId);
  if (!alreadyOwner) {
    await db.insert(teamOwnersTable).values({ teamId: team[0].id, userId, displayName });
    await db.update(roomMembersTable)
      .set({ teamId: team[0].id })
      .where(and(eq(roomMembersTable.roomId, room[0].id), eq(roomMembersTable.userId, userId)));
  }

  const allOwners = await db.select().from(teamOwnersTable).where(eq(teamOwnersTable.teamId, team[0].id));
  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.roomId, room[0].id));
  const memberMap = Object.fromEntries(members.map(m => [m.userId, m]));

  const io = getSocketServer();
  if (io) io.to(req.params.code).emit("room:franchise_selected", { franchiseId, userId, teamId: team[0].id });

  res.json({
    id: team[0].id,
    roomId: team[0].roomId,
    franchiseId,
    franchiseName: franchise[0].name,
    shortName: franchise[0].shortName,
    primaryColor: franchise[0].primaryColor,
    secondaryColor: franchise[0].secondaryColor,
    budgetRemainingCrore: parseFloat(team[0].budgetRemainingCrore as string),
    budgetSpentCrore: parseFloat(team[0].budgetSpentCrore as string),
    retentionComplete: team[0].retentionComplete,
    owners: allOwners.map((o) => ({
      userId: o.userId,
      displayName: o.displayName,
      isOnline: memberMap[o.userId]?.isOnline ?? false,
    })),
  });
});

// POST /api/rooms/:code/teams/:teamId/retain
router.post("/:teamId/retain", async (req: Request<{ code: string; teamId: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const teamId = parseInt(req.params.teamId);
  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId)).limit(1);
  if (!team.length) { res.status(404).json({ error: "Team not found" }); return; }

  const franchise = await db.select().from(franchisesTable).where(eq(franchisesTable.id, team[0].franchiseId)).limit(1);

  const { playerIds, retentionPricesCrore } = req.body as { playerIds?: number[]; retentionPricesCrore?: number[] };

  // Validate custom limit of retentions
  const maxRetentions = room[0].maxRetentions ?? 6;
  if (playerIds && playerIds.length > maxRetentions) {
    res.status(400).json({ error: `Cannot retain more than ${maxRetentions} players under configured custom settings` });
    return;
  }

  // Calculate cost and validate budget
  let totalRetentionCost = 0;
  if (retentionPricesCrore) {
    totalRetentionCost = retentionPricesCrore.reduce((sum, p) => sum + p, 0);
  }
  const startingBudget = parseFloat(room[0].budgetCrore as string);
  if (totalRetentionCost > startingBudget) {
    res.status(400).json({ error: `Total retention cost (${totalRetentionCost} Cr) exceeds starting franchise budget (${startingBudget} Cr)` });
    return;
  }

  // Clear previous retentions
  await db.delete(auctionPoolTable)
    .where(and(
      eq(auctionPoolTable.roomId, room[0].id),
      eq(auctionPoolTable.isRetained, true),
      eq(auctionPoolTable.soldToTeamId, teamId)
    ));
  await db.delete(retentionsTable)
    .where(and(
      eq(retentionsTable.roomId, room[0].id),
      eq(retentionsTable.teamId, teamId)
    ));

  if (playerIds && playerIds.length > 0) {
    for (let i = 0; i < playerIds.length; i++) {
      const priceCrore = retentionPricesCrore?.[i] ?? 0;
      await db.insert(auctionPoolTable).values({
        roomId: room[0].id,
        playerId: playerIds[i],
        basePriceCrore: priceCrore.toString(),
        status: "retained",
        soldToTeamId: teamId,
        soldPriceCrore: priceCrore.toString(),
        isRetained: true,
        auctionOrder: -1,
      });

      // Insert retention log record
      await db.insert(retentionsTable).values({
        roomId: room[0].id,
        teamId,
        playerId: playerIds[i],
        priceCrore: priceCrore.toString(),
      });
    }
  }

  const newBudgetRemaining = startingBudget - totalRetentionCost;
  const [updatedTeam] = await db.update(teamsTable)
    .set({
      budgetRemainingCrore: newBudgetRemaining.toString(),
      budgetSpentCrore: totalRetentionCost.toString(),
      retentionComplete: true,
    })
    .where(eq(teamsTable.id, teamId))
    .returning();

  const owners = await db.select().from(teamOwnersTable).where(eq(teamOwnersTable.teamId, teamId));
  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.roomId, room[0].id));
  const memberMap = Object.fromEntries(members.map(m => [m.userId, m]));

  res.json({
    id: updatedTeam.id,
    roomId: updatedTeam.roomId,
    franchiseId: updatedTeam.franchiseId,
    franchiseName: franchise[0]?.name ?? "",
    shortName: franchise[0]?.shortName ?? "",
    primaryColor: franchise[0]?.primaryColor ?? "#000",
    secondaryColor: franchise[0]?.secondaryColor ?? "#fff",
    budgetRemainingCrore: parseFloat(updatedTeam.budgetRemainingCrore as string),
    budgetSpentCrore: parseFloat(updatedTeam.budgetSpentCrore as string),
    retentionComplete: updatedTeam.retentionComplete,
    owners: owners.map((o) => ({
      userId: o.userId,
      displayName: o.displayName,
      isOnline: memberMap[o.userId]?.isOnline ?? false,
    })),
  });
});

// GET /api/rooms/:code/teams/:teamId/squad
router.get("/:teamId/squad", async (req: Request<{ code: string; teamId: string }>, res: Response): Promise<void> => {
  const teamId = parseInt(req.params.teamId);
  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId)).limit(1);
  if (!team.length) { res.status(404).json({ error: "Team not found" }); return; }

  const franchise = await db.select().from(franchisesTable).where(eq(franchisesTable.id, team[0].franchiseId)).limit(1);
  const owners = await db.select().from(teamOwnersTable).where(eq(teamOwnersTable.teamId, teamId));
  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.roomId, team[0].roomId));
  const memberMap = Object.fromEntries(members.map(m => [m.userId, m]));

  const poolEntries = await db.select().from(auctionPoolTable)
    .where(eq(auctionPoolTable.soldToTeamId, teamId));

  const playerIds = poolEntries.map((e) => e.playerId);
  let players: typeof playersTable.$inferSelect[] = [];
  if (playerIds.length > 0) {
    const allPlayers = await db.select().from(playersTable);
    players = allPlayers.filter((p) => playerIds.includes(p.id));
  }
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  const squadPlayers = poolEntries.map((e) => {
    const p = playerMap[e.playerId];
    return {
      id: e.playerId,
      name: p?.name ?? "Unknown",
      role: p?.role ?? "Unknown",
      nationality: p?.nationality ?? "India",
      isOverseas: p?.isOverseas ?? false,
      priceCrore: parseFloat((e.soldPriceCrore ?? e.basePriceCrore) as string),
      isRetained: e.isRetained,
      battingStyle: p?.battingStyle ?? null,
      bowlingStyle: p?.bowlingStyle ?? null,
    };
  });

  const retained = squadPlayers.filter((p) => p.isRetained);
  const auctioned = squadPlayers.filter((p) => !p.isRetained);

  const batters = squadPlayers.filter((p) => p.role === "Batter").length;
  const bowlers = squadPlayers.filter((p) => p.role === "Bowler").length;
  const allRounders = squadPlayers.filter((p) => p.role === "All-Rounder").length;
  const wicketKeepers = squadPlayers.filter((p) => p.role === "Wicket-Keeper").length;
  const overseas = squadPlayers.filter((p) => p.isOverseas).length;
  const indian = squadPlayers.filter((p) => !p.isOverseas).length;

  res.json({
    team: {
      id: team[0].id,
      roomId: team[0].roomId,
      franchiseId: team[0].franchiseId,
      franchiseName: franchise[0]?.name ?? "",
      shortName: franchise[0]?.shortName ?? "",
      primaryColor: franchise[0]?.primaryColor ?? "#000",
      secondaryColor: franchise[0]?.secondaryColor ?? "#fff",
      budgetRemainingCrore: parseFloat(team[0].budgetRemainingCrore as string),
      budgetSpentCrore: parseFloat(team[0].budgetSpentCrore as string),
      retentionComplete: team[0].retentionComplete,
      owners: owners.map((o) => ({
        userId: o.userId,
        displayName: o.displayName,
        isOnline: memberMap[o.userId]?.isOnline ?? false,
      })),
    },
    retainedPlayers: retained,
    auctionedPlayers: auctioned,
    batters, bowlers, allRounders, wicketKeepers, overseas, indian,
    averageAge: null,
  });
});

export default router;
