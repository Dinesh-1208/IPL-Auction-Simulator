import { db } from "@workspace/db";
import { franchisesTable, playersTable, playerSeasonsTable } from "@workspace/db";

const franchises = [
  { name: "Chennai Super Kings", shortName: "CSK", city: "Chennai", primaryColor: "#F5C518", secondaryColor: "#0066B2", foundedYear: 2008 },
  { name: "Mumbai Indians", shortName: "MI", city: "Mumbai", primaryColor: "#004BA0", secondaryColor: "#D4AF37", foundedYear: 2008 },
  { name: "Royal Challengers Bengaluru", shortName: "RCB", city: "Bengaluru", primaryColor: "#EC1C24", secondaryColor: "#000000", foundedYear: 2008 },
  { name: "Kolkata Knight Riders", shortName: "KKR", city: "Kolkata", primaryColor: "#3A225D", secondaryColor: "#F4D03F", foundedYear: 2008 },
  { name: "Sunrisers Hyderabad", shortName: "SRH", city: "Hyderabad", primaryColor: "#FF6B2B", secondaryColor: "#000000", foundedYear: 2012 },
  { name: "Delhi Capitals", shortName: "DC", city: "Delhi", primaryColor: "#00008B", secondaryColor: "#EF1B23", foundedYear: 2008 },
  { name: "Rajasthan Royals", shortName: "RR", city: "Jaipur", primaryColor: "#ED1C7C", secondaryColor: "#253A93", foundedYear: 2008 },
  { name: "Punjab Kings", shortName: "PBKS", city: "Mohali", primaryColor: "#ED1B24", secondaryColor: "#A7A9AC", foundedYear: 2008 },
  { name: "Gujarat Titans", shortName: "GT", city: "Ahmedabad", primaryColor: "#1D3461", secondaryColor: "#C8A951", foundedYear: 2022 },
  { name: "Lucknow Super Giants", shortName: "LSG", city: "Lucknow", primaryColor: "#A4C3D2", secondaryColor: "#FFD966", foundedYear: 2022 },
];

const players = [
  // CSK
  { name: "MS Dhoni", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
  { name: "Ruturaj Gaikwad", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Ravindra Jadeja", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox" },
  { name: "Deepak Chahar", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast" },
  { name: "Devon Conway", role: "Wicket-Keeper", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Moeen Ali", role: "All-Rounder", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Matheesha Pathirana", role: "Bowler", nationality: "Sri Lanka", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Shivam Dube", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm medium" },

  // MI
  { name: "Rohit Sharma", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Hardik Pandya", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Jasprit Bumrah", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Suryakumar Yadav", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Ishan Kishan", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Tim David", role: "Batter", nationality: "Singapore", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Trent Boult", role: "Bowler", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium" },
  { name: "Tilak Varma", role: "Batter", nationality: "India", isOverseas: false, isCapped: false, battingStyle: "Left-hand bat", bowlingStyle: null },

  // RCB
  { name: "Virat Kohli", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
  { name: "Faf du Plessis", role: "Batter", nationality: "South Africa", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
  { name: "Glenn Maxwell", role: "All-Rounder", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Mohammed Siraj", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Dinesh Karthik", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Cameron Green", role: "All-Rounder", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Alzarri Joseph", role: "Bowler", nationality: "West Indies", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Rajat Patidar", role: "Batter", nationality: "India", isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null },

  // KKR
  { name: "Shreyas Iyer", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
  { name: "Andre Russell", role: "All-Rounder", nationality: "West Indies", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Sunil Narine", role: "All-Rounder", nationality: "West Indies", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Phil Salt", role: "Wicket-Keeper", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Varun Chakravarthy", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Rinku Singh", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Mitchell Starc", role: "Bowler", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast" },

  // SRH
  { name: "Pat Cummins", role: "All-Rounder", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Travis Head", role: "Batter", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Heinrich Klaasen", role: "Wicket-Keeper", nationality: "South Africa", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Abhishek Sharma", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox" },
  { name: "Nitish Kumar Reddy", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast" },
  { name: "Bhuvneshwar Kumar", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast" },
  { name: "T Natarajan", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium" },

  // DC
  { name: "Rishabh Pant", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "David Warner", role: "Batter", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm leg-break" },
  { name: "Kuldeep Yadav", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm wrist-spin" },
  { name: "Axar Patel", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox" },
  { name: "Anrich Nortje", role: "Bowler", nationality: "South Africa", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Jake Fraser-McGurk", role: "Batter", nationality: "Australia", isOverseas: true, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null },

  // RR
  { name: "Sanju Samson", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Jos Buttler", role: "Wicket-Keeper", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Shimron Hetmyer", role: "Batter", nationality: "West Indies", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Yuzvendra Chahal", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break" },
  { name: "Trent Boult", role: "Bowler", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium" },
  { name: "Dhruv Jurel", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },

  // PBKS
  { name: "Shikhar Dhawan", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Sam Curran", role: "All-Rounder", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast-medium" },
  { name: "Arshdeep Singh", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast-medium" },
  { name: "Liam Livingstone", role: "All-Rounder", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break" },
  { name: "Jonny Bairstow", role: "Wicket-Keeper", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Rilee Rossouw", role: "Batter", nationality: "South Africa", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },

  // GT
  { name: "Shubman Gill", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Hardik Pandya", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Rashid Khan", role: "All-Rounder", nationality: "Afghanistan", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break" },
  { name: "David Miller", role: "Batter", nationality: "South Africa", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Wriddhiman Saha", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Mohammed Shami", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Sai Kishore", role: "Bowler", nationality: "India", isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm orthodox" },

  // LSG
  { name: "KL Rahul", role: "Wicket-Keeper", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Nicholas Pooran", role: "Wicket-Keeper", nationality: "West Indies", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Quinton de Kock", role: "Wicket-Keeper", nationality: "South Africa", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Mark Wood", role: "Bowler", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Krunal Pandya", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox" },
  { name: "Ravi Bishnoi", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break" },

  // Extra auction pool players
  { name: "Mayank Agarwal", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Prithvi Shaw", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Sai Sudharsan", role: "Batter", nationality: "India", isOverseas: false, isCapped: false, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Yashasvi Jaiswal", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Manish Pandey", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Ambati Rayudu", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Ajinkya Rahane", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Sarfaraz Khan", role: "Batter", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Washington Sundar", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break" },
  { name: "Shahbaz Ahmed", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: false, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox" },
  { name: "Harpreet Brar", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: false, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox" },
  { name: "Shardul Thakur", role: "All-Rounder", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast" },
  { name: "Harshal Patel", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
  { name: "Umesh Yadav", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Avesh Khan", role: "Bowler", nationality: "India", isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Josh Hazlewood", role: "Bowler", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Kyle Jamieson", role: "All-Rounder", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Lockie Ferguson", role: "Bowler", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast" },
  { name: "Adam Zampa", role: "Bowler", nationality: "Australia", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break" },
  { name: "Wanindu Hasaranga", role: "All-Rounder", nationality: "Sri Lanka", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break" },
  { name: "Ben Stokes", role: "All-Rounder", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm fast-medium" },
  { name: "Jason Roy", role: "Batter", nationality: "England", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Nicholas Pooran", role: "Wicket-Keeper", nationality: "West Indies", isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null },
  { name: "Finn Allen", role: "Wicket-Keeper", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null },
  { name: "Daryl Mitchell", role: "All-Rounder", nationality: "New Zealand", isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium" },
];

// Base prices in crore
function getBasePrice(player: { isCapped: boolean; isOverseas: boolean; role: string }): number {
  if (player.isCapped) {
    if (player.isOverseas) return 2;
    return 1;
  }
  return 0.2;
}

async function seed() {
  console.log("Seeding franchises...");
  const existingFranchises = await db.select().from(franchisesTable);
  if (existingFranchises.length > 0) {
    console.log("Franchises already seeded, skipping.");
  } else {
    for (const f of franchises) {
      await db.insert(franchisesTable).values(f);
    }
    console.log(`Inserted ${franchises.length} franchises.`);
  }

  console.log("Seeding players...");
  const existingPlayers = await db.select().from(playersTable);
  if (existingPlayers.length > 0) {
    console.log("Players already seeded, skipping.");
    return;
  }

  const uniqueNames = new Set<string>();
  const uniquePlayers = players.filter(p => {
    if (uniqueNames.has(p.name)) return false;
    uniqueNames.add(p.name);
    return true;
  });

  for (const p of uniquePlayers) {
    const [player] = await db.insert(playersTable).values({
      name: p.name,
      role: p.role,
      nationality: p.nationality,
      isOverseas: p.isOverseas,
      isCapped: p.isCapped,
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
    }).returning();

    // Add to seasons 2022-2025
    for (const year of [2022, 2023, 2024, 2025]) {
      const basePrice = getBasePrice(p);
      const variation = 0.8 + Math.random() * 0.4;
      await db.insert(playerSeasonsTable).values({
        playerId: player.id,
        seasonYear: year,
        basePriceCrore: (basePrice * variation).toFixed(2),
      });
    }
  }

  console.log(`Inserted ${uniquePlayers.length} players.`);
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
