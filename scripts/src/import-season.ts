import { db } from "@workspace/db";
import { franchisesTable, playersTable, playerSeasonsTable, seasonSquadsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import fs from "fs";

// parse CLI arguments
const args = process.argv.slice(2);
let year = 2026;
let sourcePath = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--year" && args[i + 1]) {
    year = parseInt(args[i + 1]);
  }
  if (args[i] === "--source" && args[i + 1]) {
    sourcePath = args[i + 1];
  }
}

async function main() {
  console.log(`▶ Starting import for IPL season ${year}...`);

  // Build franchise short name mapping
  const franchises = await db.select().from(franchisesTable);
  const franchiseMap: Record<string, number> = {};
  franchises.forEach((f) => {
    franchiseMap[f.shortName] = f.id;
  });

  let importPlayers: any[] = [];

  if (sourcePath && fs.existsSync(sourcePath)) {
    console.log(`  ✓ Loading dataset from local path: ${sourcePath}`);
    const raw = fs.readFileSync(sourcePath, "utf-8");
    importPlayers = JSON.parse(raw);
  } else {
    // If no dataset provided, we dynamically propagate/mock squad and stats data
    // for this year based on existing players in the database.
    console.log("  ℹ No external dataset source found. Projecting squads based on historical rosters...");
    
    const allPlayers = await db.select().from(playersTable);
    if (allPlayers.length === 0) {
      console.error("  ✗ Error: Players table is empty. Please run the seed script first.");
      process.exit(1);
    }

    // Load previous year's squads to project
    const prevYear = year - 1;
    const prevSquads = await db.select().from(seasonSquadsTable).where(eq(seasonSquadsTable.season, prevYear));
    const prevSquadMap = new Map<number, number>(); // playerId -> franchiseId
    prevSquads.forEach((s) => prevSquadMap.set(s.playerId, s.franchiseId));

    for (const p of allPlayers) {
      // Determine if active in the year (age >= 18)
      const ageForYear = p.age ? p.age - (2025 - year) : 25;
      if (ageForYear < 18) continue;

      // Project their team: either keep previous team or release to pool (15% chance of trade/release)
      const prevTeamId = prevSquadMap.get(p.id);
      let franchiseId: number | null = prevTeamId ?? null;
      if (franchiseId && Math.random() < 0.15) {
        // 15% chance they move to another random franchise or pool
        const otherFranchises = franchises.filter(f => f.id !== franchiseId);
        franchiseId = Math.random() < 0.7 
          ? otherFranchises[Math.floor(Math.random() * otherFranchises.length)].id 
          : null;
      } else if (!franchiseId && Math.random() < 0.1) {
        // 10% chance a free agent gets picked up by a team
        franchiseId = franchises[Math.floor(Math.random() * franchises.length)].id;
      }

      // Generate randomized but realistic season stats
      const playedMatches = Math.floor(Math.random() * 7) + 8; // 8 to 14 matches
      const isCaptain = Math.random() < 0.05;

      let runs = 0;
      let wickets = 0;
      let strikeRate = 0;
      let economy = 0;

      if (p.role === "Batter" || p.role === "Wicket-Keeper") {
        runs = Math.floor(Math.random() * 300) + 150; // 150 - 450 runs
        strikeRate = Math.floor(Math.random() * 30) + 125; // 125 - 155
      } else if (p.role === "Bowler") {
        wickets = Math.floor(Math.random() * 12) + 6; // 6 - 18 wickets
        economy = Math.round((Math.random() * 2.5 + 7.2) * 100) / 100; // 7.2 - 9.7
      } else {
        // All-Rounder
        runs = Math.floor(Math.random() * 200) + 80;
        strikeRate = Math.floor(Math.random() * 30) + 120;
        wickets = Math.floor(Math.random() * 8) + 4;
        economy = Math.round((Math.random() * 2.5 + 7.8) * 100) / 100;
      }

      importPlayers.push({
        name: p.name,
        role: p.role,
        nationality: p.nationality,
        isOverseas: p.isOverseas,
        isCapped: p.isCapped,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        age: ageForYear,
        franchiseShortName: franchises.find(f => f.id === franchiseId)?.shortName ?? null,
        basePriceCrore: p.role === "Batter" || p.role === "All-Rounder" ? 2.0 : 1.5,
        isCaptain,
        stats: {
          matches: playedMatches,
          runs,
          wickets,
          strikeRate,
          economy,
        },
      });
    }
  }

  let imported = 0;
  for (const item of importPlayers) {
    // Check if player already exists in global database
    let playerRow = await db.select().from(playersTable).where(eq(playersTable.name, item.name)).limit(1);
    let playerId: number;

    if (playerRow.length === 0) {
      const [newPlayer] = await db.insert(playersTable).values({
        name: item.name,
        role: item.role,
        nationality: item.nationality,
        isOverseas: item.isOverseas,
        isCapped: item.isCapped,
        battingStyle: item.battingStyle,
        bowlingStyle: item.bowlingStyle,
        age: item.age,
        imageUrl: `https://avatar.iran.liara.run/username?username=${encodeURIComponent(item.name)}`,
        dateOfBirth: `${year - item.age}-01-01`,
      }).returning();
      playerRow = [newPlayer];
    }
    playerId = playerRow[0].id;

    // Check if season record already exists
    const existingSeason = await db.select().from(playerSeasonsTable)
      .where(and(eq(playerSeasonsTable.playerId, playerId), eq(playerSeasonsTable.seasonYear, year)))
      .limit(1);

    const franchiseId = item.franchiseShortName ? franchiseMap[item.franchiseShortName] ?? null : null;

    if (existingSeason.length === 0) {
      await db.insert(playerSeasonsTable).values({
        playerId,
        seasonYear: year,
        franchiseId,
        basePriceCrore: item.basePriceCrore.toFixed(2),
        age: item.age,
        isCaptain: item.isCaptain ?? false,
        matchesPlayed: item.stats?.matches ?? null,
        runs: item.stats?.runs ?? null,
        wickets: item.stats?.wickets ?? null,
        strikeRate: item.stats?.strikeRate ? item.stats.strikeRate.toFixed(2) : null,
        economy: item.stats?.economy ? item.stats.economy.toFixed(2) : null,
      });
    } else {
      await db.update(playerSeasonsTable).set({
        franchiseId,
        basePriceCrore: item.basePriceCrore.toFixed(2),
        age: item.age,
        isCaptain: item.isCaptain ?? false,
        matchesPlayed: item.stats?.matches ?? null,
        runs: item.stats?.runs ?? null,
        wickets: item.stats?.wickets ?? null,
        strikeRate: item.stats?.strikeRate ? item.stats.strikeRate.toFixed(2) : null,
        economy: item.stats?.economy ? item.stats.economy.toFixed(2) : null,
      }).where(eq(playerSeasonsTable.id, existingSeason[0].id));
    }

    // Update season squad membership
    await db.delete(seasonSquadsTable).where(and(eq(seasonSquadsTable.season, year), eq(seasonSquadsTable.playerId, playerId)));
    if (franchiseId) {
      await db.insert(seasonSquadsTable).values({
        season: year,
        franchiseId,
        playerId,
      });
    }

    imported++;
  }

  console.log(`  ✓ Successfully imported/updated season ${year} records for ${imported} players.`);
  console.log("✅ Season import complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("  ✗ Error during import:", err);
  process.exit(1);
});
