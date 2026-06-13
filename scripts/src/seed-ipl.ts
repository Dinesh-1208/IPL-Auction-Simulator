import { db } from "@workspace/db";
import { franchisesTable, playersTable, playerSeasonsTable, seasonSquadsTable } from "@workspace/db";

// ─── Franchises ────────────────────────────────────────────────────────────────
const franchises = [
  { name: "Chennai Super Kings",         shortName: "CSK",  city: "Chennai",   primaryColor: "#F5C518", secondaryColor: "#0066B2", foundedYear: 2008 },
  { name: "Mumbai Indians",              shortName: "MI",   city: "Mumbai",    primaryColor: "#004BA0", secondaryColor: "#D4AF37", foundedYear: 2008 },
  { name: "Royal Challengers Bengaluru", shortName: "RCB",  city: "Bengaluru", primaryColor: "#EC1C24", secondaryColor: "#000000", foundedYear: 2008 },
  { name: "Kolkata Knight Riders",       shortName: "KKR",  city: "Kolkata",   primaryColor: "#3A225D", secondaryColor: "#F4D03F", foundedYear: 2008 },
  { name: "Sunrisers Hyderabad",         shortName: "SRH",  city: "Hyderabad", primaryColor: "#FF6B2B", secondaryColor: "#000000", foundedYear: 2012 },
  { name: "Delhi Capitals",              shortName: "DC",   city: "Delhi",     primaryColor: "#00008B", secondaryColor: "#EF1B23", foundedYear: 2008 },
  { name: "Rajasthan Royals",            shortName: "RR",   city: "Jaipur",    primaryColor: "#ED1C7C", secondaryColor: "#253A93", foundedYear: 2008 },
  { name: "Punjab Kings",                shortName: "PBKS", city: "Mohali",    primaryColor: "#ED1B24", secondaryColor: "#A7A9AC", foundedYear: 2008 },
  { name: "Gujarat Titans",              shortName: "GT",   city: "Ahmedabad", primaryColor: "#1D3461", secondaryColor: "#C8A951", foundedYear: 2022 },
  { name: "Lucknow Super Giants",        shortName: "LSG",  city: "Lucknow",   primaryColor: "#A4C3D2", secondaryColor: "#FFD966", foundedYear: 2022 },
];

// Season years to seed
const SEASONS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];


type Stats = {
  matches: number;
  runs?: number;
  highScore?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  bestBowling?: string;
  catches?: number;
  stumpings?: number;
};

// franchiseByYear: overrides which franchise the player was at for specific years.
// Years not in this map use defaultFranchise (their 2025 team).
// null = not in any team / pool that year.
type PlayerEntry = {
  name: string;
  role: "Batter" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
  nationality: string;
  isOverseas: boolean;
  isCapped: boolean;
  battingStyle: string;
  bowlingStyle: string | null;
  age: number; // age as of 2025
  basePriceCrore: number;
  defaultFranchise: string | null; // 2025 franchise (null = pool)
  franchiseByYear?: Partial<Record<number, string | null>>; // overrides for specific years
  captainYears?: number[]; // years they were captain
  stats?: Stats; // 2025 season stats
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYERS
// ─────────────────────────────────────────────────────────────────────────────

const players: PlayerEntry[] = [
  // ══════════════════════════════════════════════════════════════
  // CSK — Chennai Super Kings
  // ══════════════════════════════════════════════════════════════
  {
    name: "Ruturaj Gaikwad", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 28, basePriceCrore: 2, defaultFranchise: "CSK", captainYears: [2024, 2025],
    stats: { matches: 14, runs: 583, highScore: 98, strikeRate: 143.5, catches: 8 },
  },
  {
    name: "MS Dhoni", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 43, basePriceCrore: 2, defaultFranchise: "CSK", captainYears: [2019, 2020, 2021, 2022, 2023],
    stats: { matches: 14, runs: 161, highScore: 37, strikeRate: 222.2, catches: 12, stumpings: 4 },
  },
  {
    name: "Ravindra Jadeja", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox",
    age: 36, basePriceCrore: 2, defaultFranchise: "CSK",
    stats: { matches: 14, runs: 228, highScore: 52, strikeRate: 148.0, wickets: 7, economy: 8.2, bestBowling: "3/18", catches: 5 },
  },
  {
    name: "Matheesha Pathirana", role: "Bowler", nationality: "Sri Lanka",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 23, basePriceCrore: 2, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "CSK", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 14, wickets: 24, economy: 8.2, bestBowling: "4/17" },
  },
  {
    name: "Devon Conway", role: "Wicket-Keeper", nationality: "New Zealand",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 33, basePriceCrore: 2, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: "CSK", 2022: "CSK", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 10, runs: 295, highScore: 87, strikeRate: 127.5, catches: 7, stumpings: 2 },
  },
  {
    name: "Moeen Ali", role: "All-Rounder", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 37, basePriceCrore: 2, defaultFranchise: "CSK",
    franchiseByYear: { 2019: "CSK", 2020: "CSK", 2021: "CSK", 2022: "CSK", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 13, runs: 170, highScore: 55, strikeRate: 155.0, wickets: 12, economy: 8.7, bestBowling: "3/21", catches: 4 },
  },
  {
    name: "Shivam Dube", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm medium",
    age: 31, basePriceCrore: 1.5, defaultFranchise: "CSK",
    franchiseByYear: { 2019: "RCB", 2020: "RR", 2021: "RR", 2022: "CSK", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 14, runs: 418, highScore: 68, strikeRate: 151.0, wickets: 4, economy: 9.5, catches: 6 },
  },
  {
    name: "Sam Curran", role: "All-Rounder", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 27, basePriceCrore: 2, defaultFranchise: "CSK",
    // Was PBKS 2019-2022 (₹18.5Cr world record at the time), moved to CSK 2023
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "PBKS", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 14, runs: 240, highScore: 50, strikeRate: 143.0, wickets: 14, economy: 9.1, bestBowling: "3/20", catches: 3 },
  },
  {
    name: "Rachin Ravindra", role: "Batter", nationality: "New Zealand",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox",
    age: 25, basePriceCrore: 1.5, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "CSK" },
    stats: { matches: 13, runs: 222, highScore: 65, strikeRate: 135.3, catches: 5 },
  },
  {
    name: "Deepak Chahar", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast",
    age: 32, basePriceCrore: 1, defaultFranchise: "CSK",
    stats: { matches: 11, wickets: 12, economy: 8.6, bestBowling: "3/16", catches: 2 },
  },
  {
    name: "Tushar Deshpande", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 29, basePriceCrore: 0.5, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "CSK", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 12, wickets: 12, economy: 9.1, bestBowling: "3/24" },
  },
  {
    name: "Khaleel Ahmed", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 27, basePriceCrore: 0.75, defaultFranchise: "CSK",
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "DC", 2022: "DC", 2023: "DC", 2024: "CSK" },
    stats: { matches: 9, wickets: 9, economy: 9.8, bestBowling: "2/22" },
  },
  {
    name: "Noor Ahmad", role: "Bowler", nationality: "Afghanistan",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm wrist-spin",
    age: 21, basePriceCrore: 2, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "GT", 2024: "CSK" },
    stats: { matches: 14, wickets: 14, economy: 8.4, bestBowling: "3/18", catches: 2 },
  },
  {
    name: "Nathan Ellis", role: "Bowler", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 29, basePriceCrore: 1.5, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "PBKS", 2023: "PBKS", 2024: "CSK" },
    stats: { matches: 8, wickets: 8, economy: 9.6, bestBowling: "2/25" },
  },
  {
    name: "Vijay Shankar", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast",
    age: 34, basePriceCrore: 0.5, defaultFranchise: "CSK",
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "GT", 2023: "GT", 2024: "CSK" },
    stats: { matches: 8, runs: 85, highScore: 30, strikeRate: 128.0, wickets: 4, economy: 9.8, catches: 2 },
  },
  {
    name: "Shaik Rasheed", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 21, basePriceCrore: 0.2, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "CSK", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 6, runs: 58, highScore: 28, strikeRate: 130.0, catches: 1 },
  },
  {
    name: "Anshul Kamboj", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 24, basePriceCrore: 0.2, defaultFranchise: "CSK",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "CSK" },
    stats: { matches: 7, wickets: 7, economy: 10.2, bestBowling: "2/28" },
  },

  // ══════════════════════════════════════════════════════════════
  // MI — Mumbai Indians
  // ══════════════════════════════════════════════════════════════
  {
    name: "Rohit Sharma", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 38, basePriceCrore: 2, defaultFranchise: "MI", captainYears: [2019, 2020, 2021, 2022, 2023],
    stats: { matches: 14, runs: 417, highScore: 105, strikeRate: 140.0, catches: 7 },
  },
  {
    name: "Jasprit Bumrah", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 31, basePriceCrore: 2, defaultFranchise: "MI", captainYears: [2024, 2025],
    stats: { matches: 13, wickets: 20, economy: 6.6, bestBowling: "3/14", catches: 2 },
  },
  {
    name: "Suryakumar Yadav", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 34, basePriceCrore: 2, defaultFranchise: "MI",
    stats: { matches: 14, runs: 428, highScore: 82, strikeRate: 178.0, catches: 9 },
  },
  {
    name: "Hardik Pandya", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 31, basePriceCrore: 2, defaultFranchise: "MI",
    // MI 2019-2021, GT founding captain 2022-2023, back to MI 2024-2025
    franchiseByYear: { 2019: "MI", 2020: "MI", 2021: "MI", 2022: "GT", 2023: "GT", 2024: "MI" },
    captainYears: [2022, 2023],
    stats: { matches: 14, runs: 216, highScore: 45, strikeRate: 148.0, wickets: 11, economy: 9.2, bestBowling: "3/22", catches: 5 },
  },
  {
    name: "Tilak Varma", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 22, basePriceCrore: 1.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "MI", 2023: "MI", 2024: "MI" },
    stats: { matches: 14, runs: 494, highScore: 84, strikeRate: 152.0, catches: 6 },
  },
  {
    name: "Ishan Kishan", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 26, basePriceCrore: 1, defaultFranchise: "MI",
    franchiseByYear: { 2019: "MI", 2020: "MI", 2021: "MI", 2022: "MI", 2023: "MI", 2024: "MI" },
    stats: { matches: 14, runs: 323, highScore: 82, strikeRate: 139.0, catches: 10, stumpings: 3 },
  },
  {
    name: "Tim David", role: "Batter", nationality: "Singapore",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 29, basePriceCrore: 2, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "MI", 2023: "MI", 2024: "MI" },
    stats: { matches: 13, runs: 247, highScore: 65, strikeRate: 159.0, catches: 4 },
  },
  {
    name: "Trent Boult", role: "Bowler", nationality: "New Zealand",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 36, basePriceCrore: 2, defaultFranchise: "MI",
    // MI 2019-2021, released to RR 2022, free agent 2023-2024, back to MI 2025
    franchiseByYear: { 2019: "MI", 2020: "MI", 2021: "MI", 2022: "RR", 2023: null, 2024: null },
    stats: { matches: 14, wickets: 14, economy: 8.4, bestBowling: "3/12" },
  },
  {
    name: "Naman Dhir", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium",
    age: 24, basePriceCrore: 0.2, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "MI", 2024: "MI" },
    stats: { matches: 10, runs: 112, highScore: 38, strikeRate: 155.0, wickets: 3, catches: 3 },
  },
  {
    name: "Will Jacks", role: "All-Rounder", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 26, basePriceCrore: 1.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "RCB" },
    stats: { matches: 13, runs: 158, highScore: 45, strikeRate: 147.0, wickets: 6, economy: 9.1, catches: 5 },
  },
  {
    name: "Mitchell Santner", role: "All-Rounder", nationality: "New Zealand",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox",
    age: 33, basePriceCrore: 1.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: "CSK", 2020: "CSK", 2021: "CSK", 2022: "CSK", 2023: "CSK", 2024: "MI" },
    stats: { matches: 14, runs: 62, wickets: 12, economy: 7.8, bestBowling: "3/15", catches: 4 },
  },
  {
    name: "Romario Shepherd", role: "All-Rounder", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 28, basePriceCrore: 1.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "LSG", 2024: "MI" },
    stats: { matches: 12, runs: 145, highScore: 42, strikeRate: 163.0, wickets: 9, economy: 9.4, bestBowling: "3/28", catches: 3 },
  },
  {
    name: "Ryan Rickelton", role: "Wicket-Keeper", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 26, basePriceCrore: 1.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: null },
    stats: { matches: 11, runs: 185, highScore: 55, strikeRate: 145.0, catches: 8, stumpings: 2 },
  },
  {
    name: "Nuwan Thushara", role: "Bowler", nationality: "Sri Lanka",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 29, basePriceCrore: 1, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "MI" },
    stats: { matches: 11, wickets: 11, economy: 9.1, bestBowling: "3/22" },
  },
  {
    name: "Karn Sharma", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break",
    age: 36, basePriceCrore: 0.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: "SRH", 2020: "MI", 2021: "MI", 2022: "LSG", 2023: "LSG", 2024: "MI" },
    stats: { matches: 9, wickets: 8, economy: 8.4, bestBowling: "2/18" },
  },

  // ══════════════════════════════════════════════════════════════
  // RCB — Royal Challengers Bengaluru
  // ══════════════════════════════════════════════════════════════
  {
    name: "Virat Kohli", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium",
    age: 36, basePriceCrore: 2, defaultFranchise: "RCB", captainYears: [2019, 2020, 2021],
    stats: { matches: 15, runs: 741, highScore: 113, strikeRate: 154.4, catches: 11 },
  },
  {
    name: "Faf du Plessis", role: "Batter", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium",
    age: 40, basePriceCrore: 2, defaultFranchise: "RCB",
    // CSK 2019-2021, RCB 2022-2025 (RCB captain 2022-2024)
    franchiseByYear: { 2019: "CSK", 2020: "CSK", 2021: "CSK", 2022: "RCB", 2023: "RCB", 2024: "RCB" },
    captainYears: [2022, 2023, 2024],
    stats: { matches: 15, runs: 475, highScore: 88, strikeRate: 138.0, catches: 10 },
  },
  {
    name: "Glenn Maxwell", role: "All-Rounder", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 37, basePriceCrore: 2, defaultFranchise: "RCB",
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "RCB", 2022: "RCB", 2023: "RCB", 2024: "RCB" },
    stats: { matches: 15, runs: 352, highScore: 72, strikeRate: 165.0, wickets: 8, economy: 8.9, bestBowling: "3/28", catches: 6 },
  },
  {
    name: "Rajat Patidar", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 31, basePriceCrore: 1, defaultFranchise: "RCB", captainYears: [2025],
    franchiseByYear: { 2019: null, 2020: "RCB", 2021: "RCB", 2022: "RCB", 2023: "RCB", 2024: "RCB" },
    stats: { matches: 14, runs: 403, highScore: 90, strikeRate: 146.0, catches: 7 },
  },
  {
    name: "Phil Salt", role: "Wicket-Keeper", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 28, basePriceCrore: 2, defaultFranchise: "RCB",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "DC", 2024: "KKR" },
    stats: { matches: 15, runs: 389, highScore: 68, strikeRate: 152.0, catches: 12, stumpings: 3 },
  },
  {
    name: "Liam Livingstone", role: "All-Rounder", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break",
    age: 31, basePriceCrore: 2, defaultFranchise: "RCB",
    franchiseByYear: { 2019: null, 2020: null, 2021: "PBKS", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    stats: { matches: 14, runs: 396, highScore: 94, strikeRate: 171.0, wickets: 6, economy: 9.3, bestBowling: "2/20", catches: 5 },
  },
  {
    name: "Josh Hazlewood", role: "Bowler", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 34, basePriceCrore: 2, defaultFranchise: "RCB",
    franchiseByYear: { 2019: null, 2020: null, 2021: "CSK", 2022: null, 2023: "RCB", 2024: "RCB" },
    stats: { matches: 12, wickets: 18, economy: 7.8, bestBowling: "4/21" },
  },
  {
    name: "Krunal Pandya", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox",
    age: 33, basePriceCrore: 1, defaultFranchise: "RCB",
    franchiseByYear: { 2019: "MI", 2020: "MI", 2021: "MI", 2022: "LSG", 2023: "LSG", 2024: "RCB" },
    stats: { matches: 13, runs: 185, highScore: 44, strikeRate: 142.0, wickets: 8, economy: 8.3, bestBowling: "3/25", catches: 4 },
  },
  {
    name: "Bhuvneshwar Kumar", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast",
    age: 35, basePriceCrore: 1.5, defaultFranchise: "RCB",
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "SRH", 2023: "SRH", 2024: "SRH" },
    stats: { matches: 12, wickets: 15, economy: 8.1, bestBowling: "3/18" },
  },
  {
    name: "Swapnil Singh", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox",
    age: 28, basePriceCrore: 0.3, defaultFranchise: "RCB",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "RR" },
    stats: { matches: 10, runs: 78, wickets: 7, economy: 7.9, bestBowling: "3/22", catches: 3 },
  },
  {
    name: "Yash Dayal", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 26, basePriceCrore: 0.5, defaultFranchise: "RCB",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "GT", 2023: "GT", 2024: "RCB" },
    stats: { matches: 13, wickets: 15, economy: 9.4, bestBowling: "4/27" },
  },
  {
    name: "Romario Shepherd", role: "All-Rounder", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 28, basePriceCrore: 1.5, defaultFranchise: "MI",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "LSG", 2024: "MI" },
    stats: { matches: 12, runs: 145, highScore: 42, strikeRate: 163.0, wickets: 9, economy: 9.4, bestBowling: "3/28", catches: 3 },
  },

  // ══════════════════════════════════════════════════════════════
  // KKR — Kolkata Knight Riders
  // ══════════════════════════════════════════════════════════════
  {
    name: "Shreyas Iyer", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 30, basePriceCrore: 2, defaultFranchise: "KKR", captainYears: [2022, 2023, 2024, 2025],
    // DC captain 2020-2021, KKR 2022 onwards
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "KKR", 2023: "KKR", 2024: "KKR" },
    stats: { matches: 14, runs: 351, highScore: 80, strikeRate: 145.0, catches: 8 },
  },
  {
    name: "Andre Russell", role: "All-Rounder", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 37, basePriceCrore: 2, defaultFranchise: "KKR",
    stats: { matches: 14, runs: 387, highScore: 70, strikeRate: 185.0, wickets: 10, economy: 10.1, bestBowling: "3/22", catches: 7 },
  },
  {
    name: "Sunil Narine", role: "All-Rounder", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 36, basePriceCrore: 2, defaultFranchise: "KKR",
    stats: { matches: 14, runs: 488, highScore: 109, strikeRate: 180.0, wickets: 10, economy: 6.8, bestBowling: "3/17", catches: 6 },
  },
  {
    name: "Rinku Singh", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm medium",
    age: 27, basePriceCrore: 1.5, defaultFranchise: "KKR",
    franchiseByYear: { 2019: null, 2020: null, 2021: "KKR", 2022: "KKR", 2023: "KKR", 2024: "KKR" },
    stats: { matches: 14, runs: 380, highScore: 76, strikeRate: 162.0, catches: 5 },
  },
  {
    name: "Varun Chakravarthy", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm wrist-spin",
    age: 33, basePriceCrore: 2, defaultFranchise: "KKR",
    franchiseByYear: { 2019: "PBKS", 2020: "KKR", 2021: "KKR", 2022: "KKR", 2023: "KKR", 2024: "KKR" },
    stats: { matches: 14, wickets: 21, economy: 7.4, bestBowling: "4/19", catches: 3 },
  },
  {
    name: "Mitchell Starc", role: "Bowler", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast",
    age: 35, basePriceCrore: 2, defaultFranchise: "KKR",
    // Pool before 2024, KKR at world-record ₹24.75Cr in 2024 auction
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "KKR" },
    stats: { matches: 13, wickets: 17, economy: 8.2, bestBowling: "4/22" },
  },
  {
    name: "Venkatesh Iyer", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm medium",
    age: 30, basePriceCrore: 2, defaultFranchise: "KKR",
    franchiseByYear: { 2019: null, 2020: null, 2021: "KKR", 2022: "KKR", 2023: "KKR", 2024: "KKR" },
    stats: { matches: 14, runs: 370, highScore: 67, strikeRate: 148.0, wickets: 5, economy: 9.8, catches: 6 },
  },
  {
    name: "Harshit Rana", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 23, basePriceCrore: 0.5, defaultFranchise: "KKR",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "KKR", 2024: "KKR" },
    stats: { matches: 13, wickets: 19, economy: 9.0, bestBowling: "4/21" },
  },
  {
    name: "Angkrish Raghuvanshi", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 20, basePriceCrore: 0.3, defaultFranchise: "KKR",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "KKR", 2024: "KKR" },
    stats: { matches: 10, runs: 195, highScore: 54, strikeRate: 144.0, catches: 4 },
  },
  {
    name: "Ramandeep Singh", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 25, basePriceCrore: 0.4, defaultFranchise: "KKR",
    franchiseByYear: { 2019: null, 2020: null, 2021: "MI", 2022: "MI", 2023: "KKR", 2024: "KKR" },
    stats: { matches: 12, runs: 125, highScore: 38, strikeRate: 155.0, wickets: 5, economy: 10.0, catches: 4 },
  },

  // ══════════════════════════════════════════════════════════════
  // SRH — Sunrisers Hyderabad
  // ══════════════════════════════════════════════════════════════
  {
    name: "Pat Cummins", role: "Bowler", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 32, basePriceCrore: 2, defaultFranchise: "SRH", captainYears: [2024, 2025],
    // KKR 2019-2022, SRH 2023 onwards
    franchiseByYear: { 2019: "KKR", 2020: "KKR", 2021: "KKR", 2022: "KKR", 2023: "SRH", 2024: "SRH" },
    stats: { matches: 14, wickets: 21, economy: 8.3, bestBowling: "4/28", catches: 3 },
  },
  {
    name: "Travis Head", role: "Batter", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 31, basePriceCrore: 2, defaultFranchise: "SRH",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "SRH" },
    stats: { matches: 15, runs: 567, highScore: 102, strikeRate: 191.0, catches: 8 },
  },
  {
    name: "Heinrich Klaasen", role: "Wicket-Keeper", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 33, basePriceCrore: 2, defaultFranchise: "SRH",
    franchiseByYear: { 2019: "RR", 2020: null, 2021: null, 2022: "DC", 2023: "SRH", 2024: "SRH" },
    stats: { matches: 15, runs: 542, highScore: 80, strikeRate: 162.0, catches: 14, stumpings: 4 },
  },
  {
    name: "Abhishek Sharma", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox",
    age: 24, basePriceCrore: 1.5, defaultFranchise: "SRH",
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "SRH", 2023: "SRH", 2024: "SRH" },
    stats: { matches: 15, runs: 521, highScore: 82, strikeRate: 175.0, wickets: 5, economy: 9.0, catches: 6 },
  },
  {
    name: "Nitish Kumar Reddy", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast",
    age: 21, basePriceCrore: 1.5, defaultFranchise: "SRH",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "SRH" },
    stats: { matches: 15, runs: 303, highScore: 76, strikeRate: 145.0, wickets: 6, economy: 9.7, bestBowling: "2/19", catches: 5 },
  },
  {
    name: "Mayank Agarwal", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 34, basePriceCrore: 1, defaultFranchise: "SRH",
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "PBKS", 2023: "SRH", 2024: "SRH" },
    captainYears: [2022],
    stats: { matches: 11, runs: 241, highScore: 78, strikeRate: 148.0, catches: 5 },
  },
  {
    name: "T Natarajan", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 33, basePriceCrore: 1, defaultFranchise: "SRH",
    stats: { matches: 14, wickets: 16, economy: 9.1, bestBowling: "3/24" },
  },
  {
    name: "Harshal Patel", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium",
    age: 34, basePriceCrore: 1, defaultFranchise: "SRH",
    franchiseByYear: { 2019: "RCB", 2020: "RCB", 2021: "RCB", 2022: "RCB", 2023: "PBKS", 2024: "RCB" },
    stats: { matches: 13, wickets: 17, economy: 8.8, bestBowling: "3/26", catches: 2 },
  },
  {
    name: "Jaydev Unadkat", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 33, basePriceCrore: 0.75, defaultFranchise: "SRH",
    franchiseByYear: { 2019: "RR", 2020: "RR", 2021: "RR", 2022: "RR", 2023: "RR", 2024: "DC" },
    stats: { matches: 9, wickets: 8, economy: 9.6, bestBowling: "2/24" },
  },

  // ══════════════════════════════════════════════════════════════
  // DC — Delhi Capitals
  // ══════════════════════════════════════════════════════════════
  {
    name: "Rishabh Pant", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 27, basePriceCrore: 2, defaultFranchise: "DC", captainYears: [2021, 2025],
    stats: { matches: 14, runs: 446, highScore: 88, strikeRate: 151.0, catches: 13, stumpings: 5 },
  },
  {
    name: "Axar Patel", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm orthodox",
    age: 31, basePriceCrore: 2, defaultFranchise: "DC", captainYears: [2024],
    franchiseByYear: { 2019: "PBKS", 2020: "DC", 2021: "DC", 2022: "DC", 2023: "DC", 2024: "DC" },
    stats: { matches: 14, runs: 262, highScore: 59, strikeRate: 155.0, wickets: 11, economy: 7.6, bestBowling: "3/18", catches: 5 },
  },
  {
    name: "KL Rahul", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 33, basePriceCrore: 2, defaultFranchise: "DC",
    // PBKS 2019-2021 (captain 2020-21), LSG 2022-2024, DC 2025
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    captainYears: [2020, 2021, 2022, 2023, 2024],
    stats: { matches: 14, runs: 520, highScore: 95, strikeRate: 138.0, catches: 16, stumpings: 3 },
  },
  {
    name: "David Warner", role: "Batter", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm leg-break",
    age: 38, basePriceCrore: 2, defaultFranchise: "DC",
    // SRH 2014-2022 (captain), DC 2023 (last IPL season)
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "SRH", 2023: "DC", 2024: null },
    captainYears: [2015, 2016, 2019, 2020, 2021, 2022],
    stats: { matches: 13, runs: 355, highScore: 88, strikeRate: 145.0, catches: 7 },
  },
  {
    name: "Jake Fraser-McGurk", role: "Batter", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 23, basePriceCrore: 2, defaultFranchise: "DC",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "DC" },
    stats: { matches: 14, runs: 330, highScore: 65, strikeRate: 214.0, catches: 6 },
  },
  {
    name: "Kuldeep Yadav", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm wrist-spin",
    age: 30, basePriceCrore: 2, defaultFranchise: "DC",
    franchiseByYear: { 2019: "KKR", 2020: "KKR", 2021: "KKR", 2022: "DC", 2023: "DC", 2024: "DC" },
    stats: { matches: 13, wickets: 21, economy: 7.9, bestBowling: "5/24", catches: 3 },
  },
  {
    name: "T Stubbs", role: "Wicket-Keeper", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 25, basePriceCrore: 1.5, defaultFranchise: "DC",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "DC", 2024: "DC" },
    stats: { matches: 14, runs: 312, highScore: 72, strikeRate: 163.0, catches: 11, stumpings: 2 },
  },
  {
    name: "Mukesh Kumar", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 30, basePriceCrore: 0.5, defaultFranchise: "DC",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "KKR", 2024: "DC" },
    stats: { matches: 12, wickets: 14, economy: 9.3, bestBowling: "3/30" },
  },
  {
    name: "Sameer Rizvi", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 20, basePriceCrore: 0.2, defaultFranchise: "DC",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: "CSK" },
    stats: { matches: 8, runs: 112, highScore: 46, strikeRate: 172.0, catches: 3 },
  },

  // ══════════════════════════════════════════════════════════════
  // RR — Rajasthan Royals
  // ══════════════════════════════════════════════════════════════
  {
    name: "Sanju Samson", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 30, basePriceCrore: 2, defaultFranchise: "RR", captainYears: [2021, 2022, 2023, 2024, 2025],
    franchiseByYear: { 2019: "RR", 2020: "RR", 2021: "RR", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 14, runs: 531, highScore: 107, strikeRate: 151.0, catches: 15, stumpings: 4 },
  },
  {
    name: "Jos Buttler", role: "Wicket-Keeper", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 34, basePriceCrore: 2, defaultFranchise: "RR",
    franchiseByYear: { 2019: "RR", 2020: "RR", 2021: "RR", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 14, runs: 396, highScore: 93, strikeRate: 152.0, catches: 8, stumpings: 3 },
  },
  {
    name: "Yashasvi Jaiswal", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm leg-break",
    age: 23, basePriceCrore: 2, defaultFranchise: "RR",
    franchiseByYear: { 2019: null, 2020: "RR", 2021: "RR", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 14, runs: 632, highScore: 104, strikeRate: 168.0, catches: 9 },
  },
  {
    name: "Shimron Hetmyer", role: "Batter", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 28, basePriceCrore: 1.5, defaultFranchise: "RR",
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "RCB", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 14, runs: 326, highScore: 60, strikeRate: 162.0, catches: 4 },
  },
  {
    name: "Riyan Parag", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 23, basePriceCrore: 1.5, defaultFranchise: "RR",
    franchiseByYear: { 2019: "RR", 2020: "RR", 2021: "RR", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 14, runs: 573, highScore: 84, strikeRate: 157.0, wickets: 4, economy: 9.3, catches: 6 },
  },
  {
    name: "Jofra Archer", role: "Bowler", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 30, basePriceCrore: 2, defaultFranchise: "RR",
    franchiseByYear: { 2019: "RR", 2020: "RR", 2021: null, 2022: null, 2023: "MI", 2024: "MI" },
    stats: { matches: 14, wickets: 20, economy: 8.0, bestBowling: "4/21" },
  },
  {
    name: "Yuzvendra Chahal", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break",
    age: 35, basePriceCrore: 1.5, defaultFranchise: "RR",
    franchiseByYear: { 2019: "RCB", 2020: "RCB", 2021: "RCB", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 14, wickets: 18, economy: 7.8, bestBowling: "4/24" },
  },
  {
    name: "Sandeep Sharma", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast",
    age: 31, basePriceCrore: 0.75, defaultFranchise: "RR",
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "SRH", 2022: "SRH", 2023: "RR", 2024: "RR" },
    stats: { matches: 12, wickets: 13, economy: 8.5, bestBowling: "3/20" },
  },
  {
    name: "Dhruv Jurel", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 23, basePriceCrore: 0.4, defaultFranchise: "RR",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "RR", 2024: "RR" },
    stats: { matches: 13, runs: 285, highScore: 58, strikeRate: 132.0, catches: 8, stumpings: 3 },
  },

  // ══════════════════════════════════════════════════════════════
  // PBKS — Punjab Kings
  // ══════════════════════════════════════════════════════════════
  {
    name: "Shikhar Dhawan", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 39, basePriceCrore: 1, defaultFranchise: "PBKS",
    // SRH 2013-2019, DC 2019-2021, PBKS 2022 onwards (captain 2022-23)
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    captainYears: [2022, 2023],
    stats: { matches: 13, runs: 329, highScore: 88, strikeRate: 138.0, catches: 8 },
  },
  {
    name: "Shreyas Iyer", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 30, basePriceCrore: 2, defaultFranchise: "PBKS", captainYears: [2025],
    // DC 2019-2021, KKR 2022-2024, PBKS 2025 (big auction move)
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "KKR", 2023: "KKR", 2024: "KKR" },
    stats: { matches: 14, runs: 368, highScore: 82, strikeRate: 148.0, catches: 7 },
  },
  {
    name: "Arshdeep Singh", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 26, basePriceCrore: 2, defaultFranchise: "PBKS",
    franchiseByYear: { 2019: null, 2020: "PBKS", 2021: "PBKS", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    stats: { matches: 14, wickets: 19, economy: 8.5, bestBowling: "4/28" },
  },
  {
    name: "Marcus Stoinis", role: "All-Rounder", nationality: "Australia",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 35, basePriceCrore: 2, defaultFranchise: "PBKS",
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 14, runs: 329, highScore: 65, strikeRate: 160.0, wickets: 8, economy: 9.5, bestBowling: "3/22", catches: 5 },
  },
  {
    name: "Jonny Bairstow", role: "Wicket-Keeper", nationality: "England",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 35, basePriceCrore: 1.5, defaultFranchise: "PBKS",
    franchiseByYear: { 2019: "PBKS", 2020: null, 2021: "PBKS", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    stats: { matches: 13, runs: 341, highScore: 75, strikeRate: 145.0, catches: 7, stumpings: 2 },
  },
  {
    name: "Kagiso Rabada", role: "Bowler", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 30, basePriceCrore: 2, defaultFranchise: "PBKS",
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    stats: { matches: 14, wickets: 20, economy: 8.1, bestBowling: "4/26" },
  },
  {
    name: "Yusei Yamamoto", role: "Bowler", nationality: "Japan",
    isOverseas: true, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 25, basePriceCrore: 0.5, defaultFranchise: "PBKS",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: null, 2024: null },
    stats: { matches: 8, wickets: 8, economy: 9.5, bestBowling: "2/22" },
  },
  {
    name: "Prabhsimran Singh", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 23, basePriceCrore: 0.6, defaultFranchise: "PBKS",
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    stats: { matches: 11, runs: 248, highScore: 62, strikeRate: 155.0, catches: 6, stumpings: 1 },
  },

  // ══════════════════════════════════════════════════════════════
  // GT — Gujarat Titans
  // ══════════════════════════════════════════════════════════════
  {
    name: "Shubman Gill", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 25, basePriceCrore: 2, defaultFranchise: "GT", captainYears: [2024, 2025],
    franchiseByYear: { 2019: "KKR", 2020: "KKR", 2021: "KKR", 2022: "GT", 2023: "GT", 2024: "GT" },
    stats: { matches: 14, runs: 520, highScore: 104, strikeRate: 148.0, catches: 8 },
  },
  {
    name: "Mohammed Shami", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 34, basePriceCrore: 2, defaultFranchise: "GT",
    franchiseByYear: { 2019: "DC", 2020: "PBKS", 2021: "PBKS", 2022: "GT", 2023: "GT", 2024: "GT" },
    stats: { matches: 13, wickets: 22, economy: 7.9, bestBowling: "5/18" },
  },
  {
    name: "Rashid Khan", role: "Bowler", nationality: "Afghanistan",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm wrist-spin",
    age: 26, basePriceCrore: 2, defaultFranchise: "GT",
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "GT", 2023: "GT", 2024: "GT" },
    captainYears: [2024],
    stats: { matches: 14, wickets: 20, economy: 7.4, bestBowling: "4/24", catches: 5 },
  },
  {
    name: "David Miller", role: "Batter", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm medium",
    age: 35, basePriceCrore: 2, defaultFranchise: "GT",
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "RR", 2022: "GT", 2023: "GT", 2024: "GT" },
    stats: { matches: 14, runs: 351, highScore: 82, strikeRate: 152.0, catches: 7 },
  },
  {
    name: "Wriddhiman Saha", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 40, basePriceCrore: 1, defaultFranchise: "GT",
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "GT", 2023: "GT", 2024: "GT" },
    stats: { matches: 10, runs: 153, highScore: 40, strikeRate: 122.0, catches: 8, stumpings: 4 },
  },
  {
    name: "Sai Sudharsan", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 23, basePriceCrore: 1, defaultFranchise: "GT",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "GT", 2023: "GT", 2024: "GT" },
    stats: { matches: 14, runs: 488, highScore: 103, strikeRate: 138.0, catches: 8 },
  },
  {
    name: "Kane Williamson", role: "Batter", nationality: "New Zealand",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 34, basePriceCrore: 1.5, defaultFranchise: "GT",
    // SRH captain 2018-2022, GT 2022-2023, SRH 2024
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "GT", 2023: "GT", 2024: "SRH" },
    captainYears: [2018, 2019, 2022],
    stats: { matches: 12, runs: 318, highScore: 75, strikeRate: 130.0, catches: 6 },
  },
  {
    name: "Umesh Yadav", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 37, basePriceCrore: 0.75, defaultFranchise: "GT",
    franchiseByYear: { 2019: "RCB", 2020: "RCB", 2021: "DC", 2022: "KKR", 2023: "GT", 2024: "GT" },
    stats: { matches: 10, wickets: 11, economy: 9.5, bestBowling: "3/28" },
  },

  // ══════════════════════════════════════════════════════════════
  // LSG — Lucknow Super Giants
  // ══════════════════════════════════════════════════════════════
  {
    name: "Nicholas Pooran", role: "Wicket-Keeper", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 29, basePriceCrore: 2, defaultFranchise: "LSG", captainYears: [2025],
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "SRH", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 14, runs: 521, highScore: 98, strikeRate: 165.0, catches: 14, stumpings: 3 },
  },
  {
    name: "Ravi Bishnoi", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break",
    age: 24, basePriceCrore: 1.5, defaultFranchise: "LSG",
    franchiseByYear: { 2019: null, 2020: null, 2021: "PBKS", 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 14, wickets: 19, economy: 8.2, bestBowling: "4/22", catches: 2 },
  },
  {
    name: "Mohsin Khan", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium",
    age: 25, basePriceCrore: 0.4, defaultFranchise: "LSG",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 10, wickets: 13, economy: 8.5, bestBowling: "3/22" },
  },
  {
    name: "Deepak Hooda", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 29, basePriceCrore: 0.75, defaultFranchise: "LSG",
    franchiseByYear: { 2019: "PBKS", 2020: "RR", 2021: "PBKS", 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 11, runs: 198, highScore: 60, strikeRate: 148.0, wickets: 5, economy: 8.8, catches: 4 },
  },
  {
    name: "Ayush Badoni", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 24, basePriceCrore: 0.4, defaultFranchise: "LSG",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 12, runs: 210, highScore: 55, strikeRate: 145.0, catches: 4 },
  },
  {
    name: "Aryan Juyal", role: "Wicket-Keeper", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 22, basePriceCrore: 0.2, defaultFranchise: "LSG",
    franchiseByYear: { 2019: null, 2020: null, 2021: null, 2022: null, 2023: "LSG", 2024: "LSG" },
    stats: { matches: 8, runs: 95, highScore: 32, strikeRate: 128.0, catches: 5, stumpings: 1 },
  },
  {
    name: "Avesh Khan", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 27, basePriceCrore: 1, defaultFranchise: "LSG",
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "LSG", 2023: "LSG", 2024: "RR" },
    stats: { matches: 12, wickets: 14, economy: 9.2, bestBowling: "3/24" },
  },

  // ══════════════════════════════════════════════════════════════
  // Pool players (not in any 2025 team; available for auction)
  // ══════════════════════════════════════════════════════════════
  {
    name: "R Ashwin", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 38, basePriceCrore: 2, defaultFranchise: null,
    franchiseByYear: { 2019: "PBKS", 2020: "DC", 2021: "DC", 2022: "RR", 2023: "CSK", 2024: "CSK" },
    stats: { matches: 10, runs: 115, wickets: 12, economy: 7.5, bestBowling: "3/22", catches: 4 },
  },
  {
    name: "Quinton de Kock", role: "Wicket-Keeper", nationality: "South Africa",
    isOverseas: true, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 32, basePriceCrore: 2, defaultFranchise: null,
    franchiseByYear: { 2019: "MI", 2020: "MI", 2021: "MI", 2022: "LSG", 2023: "LSG", 2024: "LSG" },
    stats: { matches: 14, runs: 417, highScore: 80, strikeRate: 145.0, catches: 14, stumpings: 5 },
  },
  {
    name: "Shikhar Dhawan", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 39, basePriceCrore: 1, defaultFranchise: null,
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "PBKS", 2023: "PBKS", 2024: "PBKS" },
    captainYears: [2022, 2023],
    stats: { matches: 13, runs: 329, highScore: 88, strikeRate: 138.0, catches: 8 },
  },
  {
    name: "Ambati Rayudu", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium",
    age: 39, basePriceCrore: 0.75, defaultFranchise: null,
    franchiseByYear: { 2019: "CSK", 2020: "CSK", 2021: "CSK", 2022: "CSK", 2023: "CSK", 2024: null },
    stats: { matches: 8, runs: 165, highScore: 72, strikeRate: 140.0, catches: 4 },
  },
  {
    name: "Umran Malik", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 25, basePriceCrore: 1, defaultFranchise: null,
    franchiseByYear: { 2019: null, 2020: null, 2021: "SRH", 2022: "SRH", 2023: "SRH", 2024: "GT" },
    stats: { matches: 10, wickets: 11, economy: 9.8, bestBowling: "3/27" },
  },
  {
    name: "Prasidh Krishna", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 29, basePriceCrore: 1, defaultFranchise: null,
    franchiseByYear: { 2019: null, 2020: "KKR", 2021: "KKR", 2022: "RR", 2023: "RR", 2024: "RR" },
    stats: { matches: 10, wickets: 12, economy: 9.1, bestBowling: "3/26" },
  },
  {
    name: "Saurabh Tiwary", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: null,
    age: 35, basePriceCrore: 0.5, defaultFranchise: null,
    franchiseByYear: { 2019: "MI", 2020: "MI", 2021: "MI", 2022: "MI", 2023: null, 2024: null },
    stats: { matches: 5, runs: 68, highScore: 35, strikeRate: 128.0, catches: 2 },
  },
  {
    name: "Prithvi Shaw", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 25, basePriceCrore: 0.75, defaultFranchise: null,
    franchiseByYear: { 2019: "DC", 2020: "DC", 2021: "DC", 2022: "DC", 2023: "DC", 2024: null },
    stats: { matches: 8, runs: 175, highScore: 55, strikeRate: 152.0, catches: 3 },
  },
  {
    name: "Manish Pandey", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium",
    age: 35, basePriceCrore: 0.75, defaultFranchise: null,
    franchiseByYear: { 2019: "SRH", 2020: "SRH", 2021: "SRH", 2022: "LSG", 2023: null, 2024: null },
    stats: { matches: 7, runs: 124, highScore: 42, strikeRate: 130.0, catches: 3 },
  },
  {
    name: "Washington Sundar", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break",
    age: 25, basePriceCrore: 1, defaultFranchise: null,
    franchiseByYear: { 2019: "RCB", 2020: "RCB", 2021: "RCB", 2022: "SRH", 2023: "SRH", 2024: "GT" },
    stats: { matches: 12, runs: 155, wickets: 11, economy: 7.8, bestBowling: "3/24", catches: 5 },
  },
  {
    name: "Mandeep Singh", role: "Batter", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: null,
    age: 32, basePriceCrore: 0.5, defaultFranchise: null,
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: "PBKS", 2023: null, 2024: null },
    stats: { matches: 6, runs: 98, highScore: 38, strikeRate: 128.0, catches: 2 },
  },
  {
    name: "Chris Gayle", role: "Batter", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 45, basePriceCrore: 1, defaultFranchise: null,
    franchiseByYear: { 2019: "PBKS", 2020: "PBKS", 2021: "PBKS", 2022: null, 2023: null, 2024: null },
    stats: { matches: 4, runs: 82, highScore: 63, strikeRate: 148.0, catches: 2 },
  },
  {
    name: "Kedar Jadhav", role: "All-Rounder", nationality: "India",
    isOverseas: false, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-break",
    age: 39, basePriceCrore: 0.5, defaultFranchise: null,
    franchiseByYear: { 2019: "CSK", 2020: "CSK", 2021: "CSK", 2022: null, 2023: null, 2024: null },
    stats: { matches: 4, runs: 55, highScore: 28, strikeRate: 122.0, catches: 2 },
  },
  {
    name: "Alzarri Joseph", role: "Bowler", nationality: "West Indies",
    isOverseas: true, isCapped: true, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast",
    age: 28, basePriceCrore: 1.5, defaultFranchise: null,
    franchiseByYear: { 2019: "MI", 2020: null, 2021: null, 2022: "GT", 2023: "GT", 2024: "SRH" },
    stats: { matches: 10, wickets: 14, economy: 9.1, bestBowling: "3/24" },
  },
  {
    name: "Ishan Porel", role: "Bowler", nationality: "India",
    isOverseas: false, isCapped: false, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium",
    age: 25, basePriceCrore: 0.3, defaultFranchise: null,
    franchiseByYear: { 2019: "PBKS", 2020: null, 2021: "KKR", 2022: null, 2023: "GT", 2024: null },
    stats: { matches: 5, wickets: 6, economy: 9.8, bestBowling: "2/24" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  // ── Franchises ─────────────────────────────────────────────────────────────
  console.log("▶ Seeding franchises...");
  const existing = await db.select().from(franchisesTable);
  if (existing.length >= franchises.length) {
    console.log(`  ↩ Franchises already seeded (${existing.length})`);
  } else {
    await db.delete(franchisesTable);
    await db.insert(franchisesTable).values(franchises);
    console.log(`  ✓ Inserted ${franchises.length} franchises`);
  }

  // Build shortName → id map
  const allFranchises = await db.select().from(franchisesTable);
  const franchiseMap: Record<string, number> = {};
  for (const f of allFranchises) {
    franchiseMap[f.shortName] = f.id;
  }

  // ── Players ────────────────────────────────────────────────────────────────
  console.log("▶ Cleaning existing player data...");
  await db.delete(seasonSquadsTable);
  await db.delete(playerSeasonsTable);
  await db.delete(playersTable);

  console.log("▶ Seeding players and season data...");

  // Deduplicate players by name (in case of copy-paste errors)
  const seen = new Set<string>();
  const uniquePlayers = players.filter(({ name }) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });

  let inserted = 0;
  for (const p of uniquePlayers) {
    const [dbPlayer] = await db.insert(playersTable).values({
      name: p.name,
      role: p.role,
      nationality: p.nationality,
      isOverseas: p.isOverseas,
      isCapped: p.isCapped,
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle ?? null,
      age: p.age,
      imageUrl: `https://avatar.iran.liara.run/username?username=${encodeURIComponent(p.name)}`, // dynamic visual avatar URL
      dateOfBirth: `${2025 - p.age}-01-01`, // computed DOB string
    }).returning();

    for (const year of SEASONS) {
      const ageForYear = p.age - (2025 - year);

      // Determine franchise for this year
      // Younger players are not active if age is under 18
      const rawFranchise = ageForYear >= 18
        ? (p.franchiseByYear?.[year] !== undefined ? p.franchiseByYear[year] : p.defaultFranchise)
        : null;

      const franchiseId = rawFranchise ? (franchiseMap[rawFranchise] ?? null) : null;
      const isCaptain = (p.captainYears ?? []).includes(year);

      const s = p.stats;
      await db.insert(playerSeasonsTable).values({
        playerId: dbPlayer.id,
        seasonYear: year,
        franchiseId,
        basePriceCrore: p.basePriceCrore.toFixed(2),
        age: ageForYear > 0 ? ageForYear : null,
        isCaptain,
        ...(s && year === 2025 ? {
          matchesPlayed: s.matches,
          runs: s.runs ?? null,
          highScore: s.highScore ?? null,
          strikeRate: s.strikeRate != null ? s.strikeRate.toFixed(2) : null,
          wickets: s.wickets ?? null,
          economy: s.economy != null ? s.economy.toFixed(2) : null,
          bestBowling: s.bestBowling ?? null,
          catches: s.catches ?? null,
          stumpings: s.stumpings ?? null,
        } : {}),
      });

      // Seed season squads for historical tracking
      if (franchiseId) {
        await db.insert(seasonSquadsTable).values({
          season: year,
          franchiseId,
          playerId: dbPlayer.id,
        });
      }
    }
    inserted++;
  }

  console.log(`  ✓ Inserted ${inserted} players with season data (${SEASONS[0]}–${SEASONS[SEASONS.length - 1]})`);
  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
