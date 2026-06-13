import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  roomsTable, teamsTable, franchisesTable,
  auctionPoolTable, bidsTable, playersTable, playerSeasonsTable, messagesTable,
  purchasesTable, retentionsTable, seasonSquadsTable
} from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { getSocketServer } from "../lib/socket";

const router = Router({ mergeParams: true });

type RoomRow = typeof roomsTable.$inferSelect;

async function getAuctionRoom(code: string): Promise<RoomRow | null> {
  const room = await db.select().from(roomsTable).where(eq(roomsTable.code, code)).limit(1);
  return room[0] ?? null;
}

async function buildPlayerCard(entry: typeof auctionPoolTable.$inferSelect) {
  const player = await db.select().from(playersTable).where(eq(playersTable.id, entry.playerId)).limit(1);

  // Get most recent season stats + previous team
  const seasonEntries = await db.select({
    franchiseName: franchisesTable.name,
    franchiseShortName: franchisesTable.shortName,
    franchisePrimaryColor: franchisesTable.primaryColor,
    age: playerSeasonsTable.age,
    matchesPlayed: playerSeasonsTable.matchesPlayed,
    runs: playerSeasonsTable.runs,
    wickets: playerSeasonsTable.wickets,
    strikeRate: playerSeasonsTable.strikeRate,
    economy: playerSeasonsTable.economy,
    highScore: playerSeasonsTable.highScore,
    bestBowling: playerSeasonsTable.bestBowling,
  }).from(playerSeasonsTable)
    .leftJoin(franchisesTable, eq(franchisesTable.id, playerSeasonsTable.franchiseId))
    .where(eq(playerSeasonsTable.playerId, entry.playerId))
    .orderBy(desc(playerSeasonsTable.seasonYear))
    .limit(1);

  const latestSeason = seasonEntries[0];
  const prevTeamName = latestSeason?.franchiseName ?? null;
  const prevTeamShortName = latestSeason?.franchiseShortName ?? null;
  const prevTeamColor = latestSeason?.franchisePrimaryColor ?? null;

  let soldToTeamName: string | null = null;
  if (entry.soldToTeamId) {
    const teamData = await db.select({ franchiseId: teamsTable.franchiseId })
      .from(teamsTable).where(eq(teamsTable.id, entry.soldToTeamId)).limit(1);
    if (teamData[0]) {
      const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, teamData[0].franchiseId)).limit(1);
      soldToTeamName = f[0]?.name ?? null;
    }
  }

  const p = player[0];
  return {
    id: entry.id,
    playerId: entry.playerId,
    name: p?.name ?? "Unknown",
    role: p?.role ?? "Unknown",
    nationality: p?.nationality ?? "India",
    isOverseas: p?.isOverseas ?? false,
    isCapped: p?.isCapped ?? false,
    battingStyle: p?.battingStyle ?? null,
    bowlingStyle: p?.bowlingStyle ?? null,
    age: latestSeason?.age ?? p?.age ?? null,
    basePriceCrore: parseFloat(entry.basePriceCrore as string),
    status: entry.status as "available" | "sold" | "unsold" | "retained",
    soldToCrore: entry.soldPriceCrore ? parseFloat(entry.soldPriceCrore as string) : null,
    soldToTeamId: entry.soldToTeamId,
    soldToTeamName,
    previousTeamName: prevTeamName,
    previousTeamShortName: prevTeamShortName,
    previousTeamColor: prevTeamColor,
    // Season stats
    matchesPlayed: latestSeason?.matchesPlayed ?? null,
    runs: latestSeason?.runs ?? null,
    wickets: latestSeason?.wickets ?? null,
    strikeRate: latestSeason?.strikeRate ? parseFloat(latestSeason.strikeRate as string) : null,
    economy: latestSeason?.economy ? parseFloat(latestSeason.economy as string) : null,
    highScore: latestSeason?.highScore ?? null,
    bestBowling: latestSeason?.bestBowling ?? null,
  };
}

// GET /api/rooms/:code/pool
router.get("/pool", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const { role, nationality, status, search } = req.query;

  let entries = await db.select().from(auctionPoolTable)
    .where(eq(auctionPoolTable.roomId, room.id))
    .orderBy(asc(auctionPoolTable.auctionOrder));

  const playerIds = entries.map((e) => e.playerId);
  const players = playerIds.length > 0
    ? await db.select().from(playersTable)
    : [];
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  let results = entries.map((e) => {
    const p = playerMap[e.playerId];
    return { entry: e, player: p };
  });

  if (role) results = results.filter((r) => r.player?.role === role);
  if (nationality) results = results.filter((r) => r.player?.nationality === nationality);
  if (status) results = results.filter((r) => r.entry.status === status);
  if (search) {
    const s = (search as string).toLowerCase();
    results = results.filter((r) => r.player?.name?.toLowerCase().includes(s));
  }

  const teams = await db.select().from(teamsTable).where(eq(teamsTable.roomId, room.id));
  const franchises = await db.select().from(franchisesTable);
  const franchiseMap = Object.fromEntries(franchises.map(f => [f.id, f]));
  const teamFranchiseMap = Object.fromEntries(teams.map(t => [t.id, franchiseMap[t.franchiseId]?.name ?? null]));

  res.json(results.map(({ entry, player }) => ({
    id: entry.id,
    playerId: entry.playerId,
    name: player?.name ?? "Unknown",
    role: player?.role ?? "Unknown",
    nationality: player?.nationality ?? "India",
    isOverseas: player?.isOverseas ?? false,
    basePriceCrore: parseFloat(entry.basePriceCrore as string),
    status: entry.status,
    soldToCrore: entry.soldPriceCrore ? parseFloat(entry.soldPriceCrore as string) : null,
    soldToTeamId: entry.soldToTeamId,
    soldToTeamName: entry.soldToTeamId ? teamFranchiseMap[entry.soldToTeamId] ?? null : null,
    previousTeamName: null,
  })));
});

// GET /api/rooms/:code/auction/current
router.get("/current", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  const total = await db.select().from(auctionPoolTable).where(eq(auctionPoolTable.roomId, room.id));
  const auctioned = total.filter((p) => p.status === "sold" || p.status === "unsold").length;
  const remaining = total.filter((p) => p.status === "available").length;

  if (!available.length) {
    res.json({
      currentPlayer: null,
      currentBidCrore: 0,
      currentBidderTeamId: null,
      currentBidderTeamName: null,
      timerSeconds: 0,
      status: "completed",
      totalPlayersAuctioned: auctioned,
      totalPlayersRemaining: remaining,
    });
    return;
  }

  const currentEntry = available[0];
  const playerCard = await buildPlayerCard(currentEntry);


  if (room.rtmPendingTeamId) {
    let currentBidderTeamName: string | null = null;
    if (room.rtmBidderTeamId) {
      const teamData = await db.select({ franchiseId: teamsTable.franchiseId })
        .from(teamsTable).where(eq(teamsTable.id, room.rtmBidderTeamId)).limit(1);
      if (teamData[0]) {
        const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, teamData[0].franchiseId)).limit(1);
        currentBidderTeamName = f[0]?.name ?? null;
      }
    }

    let rtmPendingTeamName: string | null = null;
    const rtmTeamData = await db.select({ franchiseId: teamsTable.franchiseId })
      .from(teamsTable).where(eq(teamsTable.id, room.rtmPendingTeamId)).limit(1);
    if (rtmTeamData[0]) {
      const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, rtmTeamData[0].franchiseId)).limit(1);
      rtmPendingTeamName = f[0]?.name ?? null;
    }

    res.json({
      currentPlayer: playerCard,
      currentBidCrore: room.rtmBidAmountCrore ? parseFloat(room.rtmBidAmountCrore as string) : playerCard.basePriceCrore,
      currentBidderTeamId: room.rtmBidderTeamId,
      currentBidderTeamName,
      rtmPendingTeamId: room.rtmPendingTeamId,
      rtmPendingTeamName,
      timerSeconds: 30,
      status: "rtm",
      totalPlayersAuctioned: auctioned,
      totalPlayersRemaining: remaining,
    });
    return;
  }

  const latestBid = await db.select({
    teamId: bidsTable.teamId,
    bidAmountCrore: bidsTable.bidAmountCrore,
  }).from(bidsTable)
    .where(eq(bidsTable.auctionPoolId, currentEntry.id))
    .orderBy(desc(bidsTable.placedAt))
    .limit(1);

  let currentBidderTeamName: string | null = null;
  if (latestBid[0]) {
    const teamData = await db.select({ franchiseId: teamsTable.franchiseId })
      .from(teamsTable).where(eq(teamsTable.id, latestBid[0].teamId)).limit(1);
    if (teamData[0]) {
      const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, teamData[0].franchiseId)).limit(1);
      currentBidderTeamName = f[0]?.name ?? null;
    }
  }

  const speedTimer: Record<string, number> = { fast: 15, normal: 30, slow: 45 };
  const timerSeconds = speedTimer[room.auctionSpeed] ?? 30;

  res.json({
    currentPlayer: playerCard,
    currentBidCrore: latestBid[0] ? parseFloat(latestBid[0].bidAmountCrore as string) : playerCard.basePriceCrore,
    currentBidderTeamId: latestBid[0]?.teamId ?? null,
    currentBidderTeamName,
    timerSeconds,
    status: "bidding",
    totalPlayersAuctioned: auctioned,
    totalPlayersRemaining: remaining,
  });
});

// POST /api/rooms/:code/auction/bid
router.post("/bid", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }
  if (room.status !== "auction") { res.status(400).json({ error: "Auction not active" }); return; }

  const { teamId, bidAmountCrore } = req.body;
  if (!teamId || !bidAmountCrore) { res.status(400).json({ error: "teamId and bidAmountCrore required" }); return; }

  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId)).limit(1);
  if (!team.length) { res.status(404).json({ error: "Team not found" }); return; }

  const budgetRemaining = parseFloat(team[0].budgetRemainingCrore as string);
  if (bidAmountCrore > budgetRemaining) {
    res.status(400).json({ error: "Insufficient budget" });
    return;
  }

  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  if (!available.length) { res.status(400).json({ error: "No player currently being auctioned" }); return; }

  const currentEntry = available[0];
  const basePriceCrore = parseFloat(currentEntry.basePriceCrore as string);

  if (bidAmountCrore < basePriceCrore) {
    res.status(400).json({ error: `Bid must be at least ${basePriceCrore} Cr` });
    return;
  }

  const latestBid = await db.select().from(bidsTable)
    .where(eq(bidsTable.auctionPoolId, currentEntry.id))
    .orderBy(desc(bidsTable.placedAt))
    .limit(1);
  if (latestBid.length && parseFloat(latestBid[0].bidAmountCrore as string) >= bidAmountCrore) {
    res.status(400).json({ error: "Bid must be higher than current bid" });
    return;
  }

  await db.insert(bidsTable).values({
    roomId: room.id,
    auctionPoolId: currentEntry.id,
    teamId,
    bidAmountCrore: bidAmountCrore.toString(),
  });

  const franchise = await db.select().from(franchisesTable).where(eq(franchisesTable.id, team[0].franchiseId)).limit(1);

  const io = getSocketServer();
  if (io) {
    io.to(req.params.code).emit("auction:bid", {
      teamId,
      teamName: franchise[0]?.name,
      bidAmountCrore,
      playerId: currentEntry.playerId,
    });
  }

  const playerCard = await buildPlayerCard(currentEntry);
  const total = await db.select().from(auctionPoolTable).where(eq(auctionPoolTable.roomId, room.id));
  const auctioned = total.filter((p) => p.status === "sold" || p.status === "unsold").length;
  const remaining = total.filter((p) => p.status === "available").length;
  const speedTimer: Record<string, number> = { fast: 15, normal: 30, slow: 45 };

  res.json({
    currentPlayer: playerCard,
    currentBidCrore: bidAmountCrore,
    currentBidderTeamId: teamId,
    currentBidderTeamName: franchise[0]?.name ?? null,
    timerSeconds: speedTimer[room.auctionSpeed] ?? 30,
    status: "bidding",
    totalPlayersAuctioned: auctioned,
    totalPlayersRemaining: remaining,
  });
});

// POST /api/rooms/:code/auction/sold
router.post("/sold", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  if (!available.length) { res.status(400).json({ error: "No player to sell" }); return; }

  const currentEntry = available[0];
  const latestBid = await db.select().from(bidsTable)
    .where(eq(bidsTable.auctionPoolId, currentEntry.id))
    .orderBy(desc(bidsTable.placedAt))
    .limit(1);

  if (!latestBid.length) {
    res.status(400).json({ error: "No bids placed" });
    return;
  }

  const winnerTeamId = latestBid[0].teamId;
  const soldPrice = parseFloat(latestBid[0].bidAmountCrore as string);

  // Check RTM eligibility
  if (room.rtmEnabled) {
    const prevSquadEntry = await db.select().from(seasonSquadsTable)
      .where(and(
        eq(seasonSquadsTable.season, room.seasonYear),
        eq(seasonSquadsTable.playerId, currentEntry.playerId)
      ))
      .limit(1);

    if (prevSquadEntry.length) {
      const prevTeam = await db.select().from(teamsTable)
        .where(and(
          eq(teamsTable.roomId, room.id),
          eq(teamsTable.franchiseId, prevSquadEntry[0].franchiseId)
        ))
        .limit(1);

      if (prevTeam.length) {
        const prevTeamId = prevTeam[0].id;
        const budgetRemaining = parseFloat(prevTeam[0].budgetRemainingCrore as string);

        const purchasesCount = await db.select().from(purchasesTable).where(and(eq(purchasesTable.roomId, room.id), eq(purchasesTable.teamId, prevTeamId)));
        const retentionsCount = await db.select().from(retentionsTable).where(and(eq(retentionsTable.roomId, room.id), eq(retentionsTable.teamId, prevTeamId)));
        const squadSize = purchasesCount.length + retentionsCount.length;

        if (winnerTeamId !== prevTeamId && budgetRemaining >= soldPrice && squadSize < room.maxSquadSize) {
          // Trigger RTM pending state
          await db.update(roomsTable).set({
            rtmPendingTeamId: prevTeamId,
            rtmBidAmountCrore: soldPrice.toString(),
            rtmBidderTeamId: winnerTeamId,
          }).where(eq(roomsTable.id, room.id));

          const io = getSocketServer();
          if (io) {
            io.to(req.params.code).emit("auction:rtm_prompt", {
              playerId: currentEntry.playerId,
              rtmPendingTeamId: prevTeamId,
              bidAmountCrore: soldPrice,
              bidderTeamId: winnerTeamId,
            });
          }

          const player = await db.select().from(playersTable).where(eq(playersTable.id, currentEntry.playerId)).limit(1);
          const prevFranchise = await db.select().from(franchisesTable).where(eq(franchisesTable.id, prevTeam[0].franchiseId)).limit(1);
          await db.insert(messagesTable).values({
            roomId: room.id,
            userId: "system",
            displayName: "Auction",
            content: `Right to Match (RTM) prompted for ${player[0]?.name ?? "Player"}. Former franchise ${prevFranchise[0]?.shortName ?? "Team"} has 30 seconds to match the bid of ${soldPrice} Cr.`,
            isSystem: true,
          });

          const updatedRoom = await getAuctionRoom(req.params.code);
          await sendAuctionState(req.params.code, updatedRoom ?? room, res);
          return;
        }
      }
    }
  }

  // Normal sale when RTM not applicable/enabled
  await db.update(auctionPoolTable).set({
    status: "sold",
    soldToTeamId: winnerTeamId,
    soldPriceCrore: soldPrice.toString(),
  }).where(eq(auctionPoolTable.id, currentEntry.id));

  await db.insert(purchasesTable).values({
    roomId: room.id,
    teamId: winnerTeamId,
    playerId: currentEntry.playerId,
    soldPriceCrore: soldPrice.toString(),
    isRtmMatched: false,
  });

  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, winnerTeamId)).limit(1);
  if (team.length) {
    const newBudgetRemaining = parseFloat(team[0].budgetRemainingCrore as string) - soldPrice;
    const newBudgetSpent = parseFloat(team[0].budgetSpentCrore as string) + soldPrice;
    await db.update(teamsTable).set({
      budgetRemainingCrore: Math.max(0, newBudgetRemaining).toString(),
      budgetSpentCrore: newBudgetSpent.toString(),
    }).where(eq(teamsTable.id, winnerTeamId));
  }

  const franchise = team.length
    ? await db.select().from(franchisesTable).where(eq(franchisesTable.id, team[0].franchiseId)).limit(1)
    : [];

  const io = getSocketServer();
  if (io) {
    io.to(req.params.code).emit("auction:sold", {
      playerId: currentEntry.playerId,
      teamId: winnerTeamId,
      teamName: franchise[0]?.name,
      soldPriceCrore: soldPrice,
      isRtmMatched: false,
    });
  }

  const player = await db.select().from(playersTable).where(eq(playersTable.id, currentEntry.playerId)).limit(1);
  await db.insert(messagesTable).values({
    roomId: room.id,
    userId: "system",
    displayName: "Auction",
    content: `${player[0]?.name ?? "Player"} SOLD to ${franchise[0]?.shortName ?? "Team"} for ${soldPrice} Cr!`,
    isSystem: true,
  });

  await sendAuctionState(req.params.code, room, res);
});

// POST /api/rooms/:code/auction/rtm
router.post("/rtm", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }
  if (!room.rtmPendingTeamId) { res.status(400).json({ error: "No RTM decision pending" }); return; }

  const { useRtm } = req.body as { useRtm?: boolean };
  if (useRtm === undefined) { res.status(400).json({ error: "useRtm parameter is required" }); return; }

  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  if (!available.length) { res.status(400).json({ error: "No player to sell" }); return; }

  const currentEntry = available[0];
  const soldPrice = parseFloat(room.rtmBidAmountCrore as string);
  const rtmTeamId = room.rtmPendingTeamId;
  const bidderTeamId = room.rtmBidderTeamId!;

  let finalBuyerTeamId = bidderTeamId;
  let isRtmMatched = false;

  if (useRtm) {
    finalBuyerTeamId = rtmTeamId;
    isRtmMatched = true;
  }

  // Finalize purchase
  await db.update(auctionPoolTable).set({
    status: "sold",
    soldToTeamId: finalBuyerTeamId,
    soldPriceCrore: soldPrice.toString(),
  }).where(eq(auctionPoolTable.id, currentEntry.id));

  // Insert purchase log
  await db.insert(purchasesTable).values({
    roomId: room.id,
    teamId: finalBuyerTeamId,
    playerId: currentEntry.playerId,
    soldPriceCrore: soldPrice.toString(),
    isRtmMatched,
  });

  // Update buyer budget
  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, finalBuyerTeamId)).limit(1);
  if (team.length) {
    const newBudgetRemaining = parseFloat(team[0].budgetRemainingCrore as string) - soldPrice;
    const newBudgetSpent = parseFloat(team[0].budgetSpentCrore as string) + soldPrice;
    await db.update(teamsTable).set({
      budgetRemainingCrore: Math.max(0, newBudgetRemaining).toString(),
      budgetSpentCrore: newBudgetSpent.toString(),
    }).where(eq(teamsTable.id, finalBuyerTeamId));
  }

  // Clear RTM pending status on the room
  await db.update(roomsTable).set({
    rtmPendingTeamId: null,
    rtmBidAmountCrore: null,
    rtmBidderTeamId: null,
  }).where(eq(roomsTable.id, room.id));

  const franchise = team.length
    ? await db.select().from(franchisesTable).where(eq(franchisesTable.id, team[0].franchiseId)).limit(1)
    : [];

  const player = await db.select().from(playersTable).where(eq(playersTable.id, currentEntry.playerId)).limit(1);

  const io = getSocketServer();
  if (io) {
    io.to(req.params.code).emit("auction:sold", {
      playerId: currentEntry.playerId,
      teamId: finalBuyerTeamId,
      teamName: franchise[0]?.name,
      soldPriceCrore: soldPrice,
      isRtmMatched,
    });
  }

  await db.insert(messagesTable).values({
    roomId: room.id,
    userId: "system",
    displayName: "Auction",
    content: isRtmMatched
      ? `${player[0]?.name ?? "Player"} SOLD to ${franchise[0]?.shortName ?? "Team"} via RTM for ${soldPrice} Cr!`
      : `${player[0]?.name ?? "Player"} SOLD to ${franchise[0]?.shortName ?? "Team"} for ${soldPrice} Cr!`,
    isSystem: true,
  });

  const freshRoom = await getAuctionRoom(req.params.code);
  await sendAuctionState(req.params.code, freshRoom ?? room, res);
});

// POST /api/rooms/:code/auction/unsold
router.post("/unsold", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  if (!available.length) { res.status(400).json({ error: "No player to mark unsold" }); return; }

  await db.update(auctionPoolTable).set({ status: "unsold" })
    .where(eq(auctionPoolTable.id, available[0].id));

  const player = await db.select().from(playersTable).where(eq(playersTable.id, available[0].playerId)).limit(1);
  await db.insert(messagesTable).values({
    roomId: room.id,
    userId: "system",
    displayName: "Auction",
    content: `${player[0]?.name ?? "Player"} is UNSOLD.`,
    isSystem: true,
  });

  const io = getSocketServer();
  if (io) io.to(req.params.code).emit("auction:unsold", { playerId: available[0].playerId });

  await sendAuctionState(req.params.code, room, res);
});

// POST /api/rooms/:code/auction/next
router.post("/next", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const io = getSocketServer();
  if (io) io.to(req.params.code).emit("auction:next", {});

  await sendAuctionState(req.params.code, room, res);
});

// GET /api/rooms/:code/auction/history
router.get("/history", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  if (!available.length) { res.json([]); return; }

  const bids = await db.select({
    id: bidsTable.id,
    teamId: bidsTable.teamId,
    bidAmountCrore: bidsTable.bidAmountCrore,
    placedAt: bidsTable.placedAt,
    franchiseName: franchisesTable.name,
  }).from(bidsTable)
    .leftJoin(teamsTable, eq(teamsTable.id, bidsTable.teamId))
    .leftJoin(franchisesTable, eq(franchisesTable.id, teamsTable.franchiseId))
    .where(eq(bidsTable.auctionPoolId, available[0].id))
    .orderBy(desc(bidsTable.placedAt));

  res.json(bids.map((b) => ({
    id: b.id,
    teamId: b.teamId,
    teamName: b.franchiseName ?? "Unknown",
    bidAmountCrore: parseFloat(b.bidAmountCrore as string),
    placedAt: b.placedAt.toISOString(),
  })));
});

// POST /api/rooms/:code/auction/complete
router.post("/complete", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  const room = await getAuctionRoom(req.params.code);
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }

  const [updated] = await db.update(roomsTable)
    .set({ status: "completed" })
    .where(eq(roomsTable.id, room.id))
    .returning();

  const io = getSocketServer();
  if (io) io.to(req.params.code).emit("auction:complete", {});

  res.json({
    id: updated.id,
    code: updated.code,
    name: updated.name,
    hostUserId: updated.hostUserId,
    seasonYear: updated.seasonYear,
    auctionType: updated.auctionType,
    status: updated.status,
    budgetCrore: parseFloat(updated.budgetCrore as string),
    maxSquadSize: updated.maxSquadSize,
    maxOverseas: updated.maxOverseas,
    maxOwnersPerTeam: updated.maxOwnersPerTeam,
    auctionSpeed: updated.auctionSpeed,
    currentPlayerIndex: updated.currentPlayerIndex,
    createdAt: updated.createdAt.toISOString(),
  });
});

async function sendAuctionState(code: string, room: RoomRow, res: Response): Promise<void> {
  const available = await db.select().from(auctionPoolTable)
    .where(and(eq(auctionPoolTable.roomId, room.id), eq(auctionPoolTable.status, "available")))
    .orderBy(asc(auctionPoolTable.auctionOrder))
    .limit(1);

  const total = await db.select().from(auctionPoolTable).where(eq(auctionPoolTable.roomId, room.id));
  const auctioned = total.filter((p) => p.status === "sold" || p.status === "unsold").length;
  const remaining = total.filter((p) => p.status === "available").length;
  const speedTimer: Record<string, number> = { fast: 15, normal: 30, slow: 45 };

  if (!available.length) {
    res.json({
      currentPlayer: null,
      currentBidCrore: 0,
      currentBidderTeamId: null,
      currentBidderTeamName: null,
      timerSeconds: 0,
      status: "completed",
      totalPlayersAuctioned: auctioned,
      totalPlayersRemaining: remaining,
    });
    return;
  }

  const playerCard = await buildPlayerCard(available[0]);

  if (room.rtmPendingTeamId) {
    let currentBidderTeamName: string | null = null;
    if (room.rtmBidderTeamId) {
      const teamData = await db.select({ franchiseId: teamsTable.franchiseId })
        .from(teamsTable).where(eq(teamsTable.id, room.rtmBidderTeamId)).limit(1);
      if (teamData[0]) {
        const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, teamData[0].franchiseId)).limit(1);
        currentBidderTeamName = f[0]?.name ?? null;
      }
    }

    let rtmPendingTeamName: string | null = null;
    const rtmTeamData = await db.select({ franchiseId: teamsTable.franchiseId })
      .from(teamsTable).where(eq(teamsTable.id, room.rtmPendingTeamId)).limit(1);
    if (rtmTeamData[0]) {
      const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, rtmTeamData[0].franchiseId)).limit(1);
      rtmPendingTeamName = f[0]?.name ?? null;
    }

    res.json({
      currentPlayer: playerCard,
      currentBidCrore: room.rtmBidAmountCrore ? parseFloat(room.rtmBidAmountCrore as string) : playerCard.basePriceCrore,
      currentBidderTeamId: room.rtmBidderTeamId,
      currentBidderTeamName,
      rtmPendingTeamId: room.rtmPendingTeamId,
      rtmPendingTeamName,
      timerSeconds: 30,
      status: "rtm",
      totalPlayersAuctioned: auctioned,
      totalPlayersRemaining: remaining,
    });
    return;
  }

  const latestBid = await db.select().from(bidsTable)
    .where(eq(bidsTable.auctionPoolId, available[0].id))
    .orderBy(desc(bidsTable.placedAt))
    .limit(1);

  let currentBidderTeamName: string | null = null;
  if (latestBid[0]) {
    const teamData = await db.select({ franchiseId: teamsTable.franchiseId })
      .from(teamsTable).where(eq(teamsTable.id, latestBid[0].teamId)).limit(1);
    if (teamData[0]) {
      const f = await db.select().from(franchisesTable).where(eq(franchisesTable.id, teamData[0].franchiseId)).limit(1);
      currentBidderTeamName = f[0]?.name ?? null;
    }
  }

  res.json({
    currentPlayer: playerCard,
    currentBidCrore: latestBid[0] ? parseFloat(latestBid[0].bidAmountCrore as string) : playerCard.basePriceCrore,
    currentBidderTeamId: latestBid[0]?.teamId ?? null,
    currentBidderTeamName,
    timerSeconds: speedTimer[room.auctionSpeed] ?? 30,
    status: "bidding",
    totalPlayersAuctioned: auctioned,
    totalPlayersRemaining: remaining,
  });
}

export default router;
