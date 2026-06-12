import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  roomsTable, roomMembersTable, teamsTable, teamOwnersTable,
  franchisesTable, auctionPoolTable, playersTable, playerSeasonsTable
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getSocketServer } from "../lib/socket";
import { nanoid } from "nanoid";

const router = Router();

type RoomRow = typeof roomsTable.$inferSelect;

function generateRoomCode(): string {
  return "IPL" + nanoid(6).toUpperCase();
}

function formatRoom(room: RoomRow) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    hostUserId: room.hostUserId,
    seasonYear: room.seasonYear,
    auctionType: room.auctionType,
    status: room.status,
    budgetCrore: parseFloat(room.budgetCrore as string),
    maxSquadSize: room.maxSquadSize,
    maxOverseas: room.maxOverseas,
    maxOwnersPerTeam: room.maxOwnersPerTeam,
    auctionSpeed: room.auctionSpeed,
    currentPlayerIndex: room.currentPlayerIndex,
    createdAt: room.createdAt.toISOString(),
  };
}

// POST /api/rooms
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, seasonYear, auctionType, budgetCrore, maxSquadSize, maxOverseas, maxOwnersPerTeam, auctionSpeed, hostUserId, displayName } = req.body;
  if (!name || !seasonYear || !auctionType || !budgetCrore || !hostUserId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const code = generateRoomCode();
  const [room] = await db.insert(roomsTable).values({
    code,
    name,
    hostUserId,
    seasonYear: parseInt(seasonYear),
    auctionType,
    status: "lobby",
    budgetCrore: budgetCrore.toString(),
    maxSquadSize: parseInt(maxSquadSize) || 25,
    maxOverseas: parseInt(maxOverseas) || 8,
    maxOwnersPerTeam: parseInt(maxOwnersPerTeam) || 2,
    auctionSpeed: auctionSpeed || "normal",
    currentPlayerIndex: 0,
  }).returning();

  await db.insert(roomMembersTable).values({
    roomId: room.id,
    userId: hostUserId,
    displayName: displayName || "Host",
    isOnline: true,
  });

  res.status(201).json(formatRoom(room));
});

// GET /api/rooms/my
router.get("/my", async (req: Request, res: Response): Promise<void> => {
  const userId = req.query.userId as string;
  if (!userId) { res.json([]); return; }

  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.userId, userId));
  if (members.length === 0) { res.json([]); return; }

  const roomIds = members.map((m) => m.roomId);
  const rooms = await db.select().from(roomsTable).orderBy(desc(roomsTable.createdAt));
  const myRooms = rooms.filter((r) => roomIds.includes(r.id));
  res.json(myRooms.map(formatRoom));
});

// GET /api/rooms/:code
router.get("/:code", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }
  res.json(formatRoom(room[0]));
});

// POST /api/rooms/:code/join
router.post("/:code/join", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const { userId, displayName } = req.body;
  if (!userId || !displayName) { res.status(400).json({ error: "userId and displayName required" }); return; }

  const existing = await db.select().from(roomMembersTable)
    .where(and(eq(roomMembersTable.roomId, room[0].id), eq(roomMembersTable.userId, userId)))
    .limit(1);

  if (existing.length) {
    await db.update(roomMembersTable).set({ isOnline: true }).where(eq(roomMembersTable.id, existing[0].id));
    res.json({ ...existing[0], isOnline: true });
    return;
  }

  const [member] = await db.insert(roomMembersTable).values({
    roomId: room[0].id,
    userId,
    displayName,
    isOnline: true,
  }).returning();

  const io = getSocketServer();
  if (io) io.to(req.params.code).emit("room:member_joined", { userId, displayName });

  res.json(member);
});

// GET /api/rooms/:code/members
router.get("/:code/members", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.roomId, room[0].id));
  const teams = await db.select({
    id: teamsTable.id,
    franchiseId: teamsTable.franchiseId,
  }).from(teamsTable).where(eq(teamsTable.roomId, room[0].id));

  const owners = await db.select().from(teamOwnersTable);
  const franchises = await db.select().from(franchisesTable);
  const franchiseMap = Object.fromEntries(franchises.map(f => [f.id, f]));

  res.json(members.map((m) => {
    const ownerEntry = owners.find((o) => o.userId === m.userId);
    const team = ownerEntry ? teams.find((t) => t.id === ownerEntry.teamId) : null;
    const franchise = team ? franchiseMap[team.franchiseId] : null;
    return {
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      displayName: m.displayName,
      teamId: team?.id ?? null,
      teamName: franchise?.name ?? null,
      isOnline: m.isOnline,
      joinedAt: m.joinedAt.toISOString(),
    };
  }));
});

// POST /api/rooms/:code/start
router.post("/:code/start", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  if (room[0].status === "lobby") {
    const [updated] = await db.update(roomsTable)
      .set({ status: "preparation" })
      .where(eq(roomsTable.id, room[0].id))
      .returning();
    const io = getSocketServer();
    if (io) io.to(req.params.code).emit("room:status_changed", { status: "preparation" });
    res.json(formatRoom(updated));
    return;
  }

  if (room[0].status === "preparation") {
    await buildAuctionPool(room[0].id, room[0].seasonYear);
    const [updated] = await db.update(roomsTable)
      .set({ status: "auction" })
      .where(eq(roomsTable.id, room[0].id))
      .returning();
    const io = getSocketServer();
    if (io) io.to(req.params.code).emit("room:status_changed", { status: "auction" });
    res.json(formatRoom(updated));
    return;
  }

  res.status(400).json({ error: "Cannot start from current status" });
});

// GET /api/rooms/:code/summary
router.get("/:code/summary", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, req.params.code)).limit(1);
  if (!room.length) { res.status(404).json({ error: "Room not found" }); return; }

  const members = await db.select().from(roomMembersTable).where(eq(roomMembersTable.roomId, room[0].id));
  const teams = await db.select().from(teamsTable).where(eq(teamsTable.roomId, room[0].id));
  const franchises = await db.select().from(franchisesTable);
  const franchiseMap = Object.fromEntries(franchises.map(f => [f.id, f]));

  const pool = await db.select().from(auctionPoolTable).where(eq(auctionPoolTable.roomId, room[0].id));
  const auctioned = pool.filter((p) => p.status === "sold" || p.status === "unsold").length;
  const remaining = pool.filter((p) => p.status === "available").length;
  const totalMoneySpent = teams.reduce((acc, t) => acc + parseFloat(t.budgetSpentCrore as string), 0);

  const teamSummaries = await Promise.all(teams.map(async (t) => {
    const franchise = franchiseMap[t.franchiseId];
    const squadPlayers = pool.filter((p) => p.soldToTeamId === t.id);

    const playerIds = squadPlayers.map((e) => e.playerId);
    let overseasCount = 0;
    if (playerIds.length > 0) {
      const players = await db.select().from(playersTable);
      overseasCount = players.filter(p => playerIds.includes(p.id) && p.isOverseas).length;
    }

    return {
      teamId: t.id,
      franchiseName: franchise?.name ?? "",
      shortName: franchise?.shortName ?? "",
      primaryColor: franchise?.primaryColor ?? "#000",
      budgetRemaining: parseFloat(t.budgetRemainingCrore as string),
      budgetSpent: parseFloat(t.budgetSpentCrore as string),
      squadSize: squadPlayers.length,
      overseasCount,
    };
  }));

  res.json({
    room: formatRoom(room[0]),
    teamCount: teams.length,
    memberCount: members.length,
    playersAuctioned: auctioned,
    playersRemaining: remaining,
    totalMoneySpent,
    teams: teamSummaries,
  });
});

async function buildAuctionPool(roomId: number, seasonYear: number): Promise<void> {
  const existing = await db.select().from(auctionPoolTable).where(eq(auctionPoolTable.roomId, roomId)).limit(1);
  if (existing.length) return;

  const retained = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, roomId), eq(auctionPoolTable.isRetained, true)));
  const retainedPlayerIds = retained.map((r) => r.playerId);

  const seasonPlayers = await db.select({
    playerId: playersTable.id,
    basePriceCrore: playerSeasonsTable.basePriceCrore,
  })
    .from(playersTable)
    .innerJoin(playerSeasonsTable, and(
      eq(playerSeasonsTable.playerId, playersTable.id),
      eq(playerSeasonsTable.seasonYear, seasonYear)
    ));

  let order = 0;
  for (const sp of seasonPlayers) {
    if (retainedPlayerIds.includes(sp.playerId)) continue;
    await db.insert(auctionPoolTable).values({
      roomId,
      playerId: sp.playerId,
      basePriceCrore: sp.basePriceCrore,
      status: "available",
      isRetained: false,
      auctionOrder: order++,
    });
  }
}

export default router;
