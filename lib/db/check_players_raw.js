import pg from "pg";

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log("Connected to DB!");

    // 1. Get total count of players
    const playersCountRes = await client.query("SELECT COUNT(*) FROM players");
    console.log("Total players in DB:", playersCountRes.rows[0].count);

    // 2. Get total count of player_seasons
    const seasonsCountRes = await client.query("SELECT COUNT(*) FROM player_seasons");
    console.log("Total player_seasons in DB:", seasonsCountRes.rows[0].count);

    // 3. Query players for 2025 for a team
    const sampleSeasonsRes = await client.query(`
      SELECT ps.id, p.name, ps.franchise_id, ps.season_year
      FROM player_seasons ps
      JOIN players p ON p.id = ps.player_id
      WHERE ps.season_year = 2025 AND ps.franchise_id IS NOT NULL
      LIMIT 3
    `);
    console.log("Sample active franchise players in 2025:", sampleSeasonsRes.rows);

    // 4. Check if season squads are populated
    const seasonSquadsCountRes = await client.query("SELECT COUNT(*) FROM season_squads");
    console.log("Total season_squads in DB:", seasonSquadsCountRes.rows[0].count);

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await client.end();
  }
}

main();
