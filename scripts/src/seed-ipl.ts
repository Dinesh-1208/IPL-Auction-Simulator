import { db } from "@workspace/db";
import { franchisesTable, playersTable, playerSeasonsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

// ─── Franchises ────────────────────────────────────────────────────────────────
const franchises = [
  { name: "Chennai Super Kings",          shortName: "CSK",  city: "Chennai",   primaryColor: "#F5C518", secondaryColor: "#0066B2", foundedYear: 2008 },
  { name: "Mumbai Indians",               shortName: "MI",   city: "Mumbai",    primaryColor: "#004BA0", secondaryColor: "#D4AF37", foundedYear: 2008 },
  { name: "Royal Challengers Bengaluru",  shortName: "RCB",  city: "Bengaluru", primaryColor: "#EC1C24", secondaryColor: "#000000", foundedYear: 2008 },
  { name: "Kolkata Knight Riders",        shortName: "KKR",  city: "Kolkata",   primaryColor: "#3A225D", secondaryColor: "#F4D03F", foundedYear: 2008 },
  { name: "Sunrisers Hyderabad",          shortName: "SRH",  city: "Hyderabad", primaryColor: "#FF6B2B", secondaryColor: "#000000", foundedYear: 2012 },
  { name: "Delhi Capitals",               shortName: "DC",   city: "Delhi",     primaryColor: "#00008B", secondaryColor: "#EF1B23", foundedYear: 2008 },
  { name: "Rajasthan Royals",             shortName: "RR",   city: "Jaipur",    primaryColor: "#ED1C7C", secondaryColor: "#253A93", foundedYear: 2008 },
  { name: "Punjab Kings",                 shortName: "PBKS", city: "Mohali",    primaryColor: "#ED1B24", secondaryColor: "#A7A9AC", foundedYear: 2008 },
  { name: "Gujarat Titans",               shortName: "GT",   city: "Ahmedabad", primaryColor: "#1D3461", secondaryColor: "#C8A951", foundedYear: 2022 },
  { name: "Lucknow Super Giants",         shortName: "LSG",  city: "Lucknow",   primaryColor: "#A4C3D2", secondaryColor: "#FFD966", foundedYear: 2022 },
];

type Stats = {
  matches: number;
  runs?: number;
  highScore?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  bestBowling?: string;
};

type PlayerEntry = {
  name: string;
  role: "Batter" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
  nationality: string;
  isOverseas: boolean;
  isCapped: boolean;
  battingStyle: string;
  bowlingStyle: string | null;
  age: number;
  basePriceCrore: number;
  isCaptain?: boolean;
  stats?: Stats;
};

// ─── 2025 Squads ──────────────────────────────────────────────────────────────
const squads: Record<string, PlayerEntry[]> = {
  CSK: [
    { name: "Ruturaj Gaikwad",   role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 28, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 583, highScore: 98,  strikeRate: 143.5 } },
    { name: "MS Dhoni",          role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 43, basePriceCrore: 2,                      stats: { matches: 14, runs: 161, highScore: 37,  strikeRate: 222.2 } },
    { name: "Ravindra Jadeja",   role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Slow left-arm orthodox", age: 36, basePriceCrore: 2,                      stats: { matches: 14, runs: 228, highScore: 52,  strikeRate: 148.0, wickets:  7, economy: 8.2, bestBowling: "3/18" } },
    { name: "Matheesha Pathirana",role: "Bowler",        nationality: "Sri Lanka",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 23, basePriceCrore: 2,                      stats: { matches: 14, wickets: 24, economy: 8.2, bestBowling: "4/17" } },
    { name: "Devon Conway",      role: "Wicket-Keeper", nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 33, basePriceCrore: 2,                      stats: { matches: 10, runs: 295, highScore: 87,  strikeRate: 127.5 } },
    { name: "Moeen Ali",         role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm off-break",    age: 37, basePriceCrore: 2,                      stats: { matches: 13, runs: 170, highScore: 55,  strikeRate: 155.0, wickets: 12, economy: 8.7, bestBowling: "3/21" } },
    { name: "Shivam Dube",       role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm medium",       age: 31, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 418, highScore: 68,  strikeRate: 151.0, wickets: 4,  economy: 9.5 } },
    { name: "Sam Curran",        role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm fast-medium",   age: 27, basePriceCrore: 2,                      stats: { matches: 14, runs: 240, highScore: 50,  strikeRate: 143.0, wickets: 14, economy: 9.1, bestBowling: "3/20" } },
    { name: "Rachin Ravindra",   role: "Batter",        nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 25, basePriceCrore: 1.5,                    stats: { matches: 13, runs: 222, highScore: 65,  strikeRate: 135.3 } },
    { name: "Deepak Chahar",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 32, basePriceCrore: 1,                      stats: { matches: 11, wickets: 12, economy: 8.6, bestBowling: "3/16" } },
    { name: "Tushar Deshpande",  role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 29, basePriceCrore: 0.5,                    stats: { matches: 12, wickets: 12, economy: 9.1, bestBowling: "3/24" } },
    { name: "Khaleel Ahmed",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 27, basePriceCrore: 0.75,                   stats: { matches:  9, wickets:  9, economy: 9.8, bestBowling: "2/22" } },
    { name: "Noor Ahmad",        role: "Bowler",        nationality: "Afghanistan",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm wrist-spin",    age: 21, basePriceCrore: 2,                      stats: { matches: 14, wickets: 14, economy: 8.4, bestBowling: "3/18" } },
    { name: "Nathan Ellis",      role: "Bowler",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 29, basePriceCrore: 1.5,                    stats: { matches:  8, wickets:  8, economy: 9.6, bestBowling: "2/25" } },
    { name: "Vijay Shankar",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 34, basePriceCrore: 0.5,                    stats: { matches:  8, runs:  85, highScore: 30,  strikeRate: 128.0, wickets: 4, economy: 9.8 } },
    { name: "Shaik Rasheed",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 21, basePriceCrore: 0.2,                    stats: { matches:  6, runs:  58, highScore: 28, strikeRate: 130.0 } },
    { name: "Anshul Kamboj",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 24, basePriceCrore: 0.2,                    stats: { matches:  7, wickets:  7, economy: 10.2, bestBowling: "2/28" } },
    { name: "Jamie Overton",     role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 29, basePriceCrore: 1,                      stats: { matches:  7, runs:  45, wickets: 5, economy: 9.9 } },
  ],
  MI: [
    { name: "Rohit Sharma",      role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 38, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 417, highScore: 105, strikeRate: 140.0 } },
    { name: "Jasprit Bumrah",    role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 31, basePriceCrore: 2,                      stats: { matches: 13, wickets: 20, economy: 6.6, bestBowling: "3/14" } },
    { name: "Suryakumar Yadav",  role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 34, basePriceCrore: 2,                      stats: { matches: 14, runs: 428, highScore: 82,  strikeRate: 178.0 } },
    { name: "Hardik Pandya",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 31, basePriceCrore: 2,                      stats: { matches: 14, runs: 216, highScore: 45,  strikeRate: 148.0, wickets: 11, economy: 9.2, bestBowling: "3/22" } },
    { name: "Tilak Varma",       role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 22, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 494, highScore: 84,  strikeRate: 152.0 } },
    { name: "Ishan Kishan",      role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 26, basePriceCrore: 1,                      stats: { matches: 14, runs: 323, highScore: 82,  strikeRate: 139.0 } },
    { name: "Tim David",         role: "Batter",        nationality: "Singapore",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 29, basePriceCrore: 2,                      stats: { matches: 13, runs: 247, highScore: 65,  strikeRate: 159.0 } },
    { name: "Trent Boult",       role: "Bowler",        nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 36, basePriceCrore: 2,                      stats: { matches: 14, wickets: 14, economy: 8.4, bestBowling: "3/12" } },
    { name: "Naman Dhir",        role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 24, basePriceCrore: 0.2,                    stats: { matches: 10, runs: 112, highScore: 38, strikeRate: 155.0, wickets: 3 } },
    { name: "Will Jacks",        role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 26, basePriceCrore: 1.5,                    stats: { matches: 13, runs: 158, highScore: 45, strikeRate: 147.0, wickets: 6, economy: 9.1 } },
    { name: "Mitchell Santner",  role: "All-Rounder",   nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 33, basePriceCrore: 1.5,                    stats: { matches: 14, runs:  62, wickets: 12, economy: 7.8, bestBowling: "3/15" } },
    { name: "Romario Shepherd",  role: "All-Rounder",   nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 28, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 145, highScore: 42, strikeRate: 163.0, wickets: 9, economy: 9.4, bestBowling: "3/28" } },
    { name: "Ryan Rickelton",    role: "Wicket-Keeper", nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 26, basePriceCrore: 1.5,                    stats: { matches: 11, runs: 185, highScore: 55, strikeRate: 145.0 } },
    { name: "Nuwan Thushara",    role: "Bowler",        nationality: "Sri Lanka",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 29, basePriceCrore: 1,                      stats: { matches: 11, wickets: 11, economy: 9.1, bestBowling: "3/22" } },
    { name: "Karn Sharma",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 36, basePriceCrore: 0.5,                    stats: { matches:  9, wickets:  8, economy: 8.4, bestBowling: "2/18" } },
    { name: "Reece Topley",      role: "Bowler",        nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm fast-medium",   age: 30, basePriceCrore: 1,                      stats: { matches:  8, wickets:  7, economy: 9.8, bestBowling: "2/22" } },
    { name: "Robin Minz",        role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 22, basePriceCrore: 0.2,                    stats: { matches:  4, runs:  28, highScore: 15, strikeRate: 120.0 } },
    { name: "Bevon Jacobs",      role: "Batter",        nationality: "West Indies",  isOverseas: true,  isCapped: false, battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 24, basePriceCrore: 0.5,                    stats: { matches:  5, runs:  45, highScore: 25 } },
  ],
  RCB: [
    { name: "Virat Kohli",       role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 36, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 15, runs: 741, highScore: 113, strikeRate: 154.5 } },
    { name: "Rajat Patidar",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 31, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 256, highScore: 70, strikeRate: 152.0 } },
    { name: "Yash Dayal",        role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 26, basePriceCrore: 0.75,                   stats: { matches: 14, wickets: 12, economy: 9.4, bestBowling: "3/22" } },
    { name: "Josh Hazlewood",    role: "Bowler",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 34, basePriceCrore: 2,                      stats: { matches: 14, wickets: 15, economy: 7.8, bestBowling: "3/18" } },
    { name: "Phil Salt",         role: "Wicket-Keeper", nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 28, basePriceCrore: 2,                      stats: { matches: 14, runs: 182, highScore: 58, strikeRate: 157.0 } },
    { name: "Liam Livingstone",  role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 31, basePriceCrore: 2,                      stats: { matches: 13, runs: 176, highScore: 48, strikeRate: 148.0, wickets: 8, economy: 8.8, bestBowling: "3/25" } },
    { name: "Krunal Pandya",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 33, basePriceCrore: 1,                      stats: { matches: 14, runs: 174, highScore: 42, strikeRate: 138.0, wickets: 10, economy: 8.5, bestBowling: "3/19" } },
    { name: "Bhuvneshwar Kumar", role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 35, basePriceCrore: 1.5,                    stats: { matches: 12, wickets: 11, economy: 8.9, bestBowling: "3/14" } },
    { name: "Jacob Bethell",     role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 21, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 128, highScore: 45, strikeRate: 148.0, wickets: 4, economy: 9.2 } },
    { name: "Jitesh Sharma",     role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 30, basePriceCrore: 1,                      stats: { matches: 12, runs: 175, highScore: 52, strikeRate: 173.0 } },
    { name: "Lungi Ngidi",       role: "Bowler",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 29, basePriceCrore: 1.5,                    stats: { matches: 13, wickets: 10, economy: 9.2, bestBowling: "3/20" } },
    { name: "Devdutt Padikkal",  role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 24, basePriceCrore: 1,                      stats: { matches: 10, runs: 168, highScore: 55, strikeRate: 142.0 } },
    { name: "Swapnil Singh",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 29, basePriceCrore: 0.2,                    stats: { matches:  8, runs:  42, wickets: 4, economy: 8.8 } },
    { name: "Rasikh Dar",        role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 22, basePriceCrore: 0.2,                    stats: { matches:  8, wickets:  6, economy: 10.1, bestBowling: "2/18" } },
    { name: "Manoj Bhandage",    role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 26, basePriceCrore: 0.2,                    stats: { matches:  8, runs:  67, wickets: 3 } },
    { name: "Suyash Prabhudessai",role:"Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 26, basePriceCrore: 0.2,                    stats: { matches:  6, runs:  82, highScore: 37, strikeRate: 145.0 } },
    { name: "Abhinandan Singh",  role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 20, basePriceCrore: 0.2,                    stats: { matches:  5, wickets:  4, economy: 10.5 } },
  ],
  KKR: [
    { name: "Rinku Singh",       role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 27, basePriceCrore: 2,                      stats: { matches: 14, runs: 388, highScore: 74,  strikeRate: 155.0 } },
    { name: "Sunil Narine",      role: "All-Rounder",   nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm off-break",    age: 36, basePriceCrore: 2,                      stats: { matches: 14, runs: 488, highScore: 109, strikeRate: 180.0, wickets: 17, economy: 6.4, bestBowling: "4/12" } },
    { name: "Andre Russell",     role: "All-Rounder",   nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 36, basePriceCrore: 2,                      stats: { matches: 14, runs: 222, highScore: 64,  strikeRate: 176.0, wickets: 19, economy: 9.8, bestBowling: "4/20" } },
    { name: "Varun Chakravarthy",role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm mystery spin", age: 33, basePriceCrore: 2,                      stats: { matches: 14, wickets: 21, economy: 7.3, bestBowling: "4/21" } },
    { name: "Harshit Rana",      role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 23, basePriceCrore: 0.5,                    stats: { matches: 14, wickets: 19, economy: 8.8, bestBowling: "3/24" } },
    { name: "Venkatesh Iyer",    role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm medium",       age: 30, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 356, highScore: 75, strikeRate: 151.0, wickets: 4, economy: 9.2 } },
    { name: "Quinton de Kock",   role: "Wicket-Keeper", nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 32, basePriceCrore: 2,                      stats: { matches: 14, runs: 378, highScore: 96, strikeRate: 143.0 } },
    { name: "Mitchell Starc",    role: "Bowler",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm fast",          age: 35, basePriceCrore: 2,                      stats: { matches: 14, wickets: 17, economy: 8.8, bestBowling: "4/14" } },
    { name: "Angkrish Raghuvanshi",role:"Batter",       nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 19, basePriceCrore: 0.2,                    stats: { matches:  9, runs: 148, highScore: 52, strikeRate: 148.0 } },
    { name: "Ramandeep Singh",   role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 25, basePriceCrore: 0.5,                    stats: { matches: 12, runs: 132, highScore: 44, strikeRate: 162.0, wickets: 5 } },
    { name: "Spencer Johnson",   role: "Bowler",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm fast",          age: 29, basePriceCrore: 1.5,                    stats: { matches:  9, wickets: 11, economy: 9.4, bestBowling: "3/14" } },
    { name: "Rovman Powell",     role: "Batter",        nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 31, basePriceCrore: 1.5,                    stats: { matches: 10, runs: 172, highScore: 58, strikeRate: 175.0 } },
    { name: "Manish Pandey",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 35, basePriceCrore: 0.5,                    stats: { matches:  8, runs:  95, highScore: 35, strikeRate: 128.0 } },
    { name: "Mayank Markande",   role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 27, basePriceCrore: 0.2,                    stats: { matches:  7, wickets:  7, economy: 9.6, bestBowling: "3/28" } },
    { name: "Luvnith Sisodia",   role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 22, basePriceCrore: 0.2,                    stats: { matches:  4, runs:  38, highScore: 20 } },
    { name: "Umesh Yadav",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 37, basePriceCrore: 0.5,                    stats: { matches:  9, wickets:  8, economy: 9.9, bestBowling: "2/20" } },
  ],
  SRH: [
    { name: "Pat Cummins",       role: "All-Rounder",   nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 32, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 15, runs: 178, highScore: 42, strikeRate: 148.0, wickets: 19, economy: 8.5, bestBowling: "4/18" } },
    { name: "Travis Head",       role: "Batter",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm off-break",    age: 31, basePriceCrore: 2,                      stats: { matches: 15, runs: 567, highScore: 102, strikeRate: 188.0 } },
    { name: "Abhishek Sharma",   role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 24, basePriceCrore: 1.5,                    stats: { matches: 15, runs: 484, highScore: 75,  strikeRate: 205.0, wickets: 5, economy: 9.1 } },
    { name: "Heinrich Klaasen",  role: "Wicket-Keeper", nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 33, basePriceCrore: 2,                      stats: { matches: 15, runs: 479, highScore: 80,  strikeRate: 165.0 } },
    { name: "Nitish Kumar Reddy",role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 22, basePriceCrore: 0.5,                    stats: { matches: 15, runs: 303, highScore: 76,  strikeRate: 147.0, wickets: 8, economy: 9.8, bestBowling: "2/12" } },
    { name: "Bhuvneshwar Kumar", role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 35, basePriceCrore: 1.5,                    stats: { matches: 14, wickets: 15, economy: 8.2, bestBowling: "3/14" } },
    { name: "T Natarajan",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 33, basePriceCrore: 1,                      stats: { matches: 15, wickets: 19, economy: 9.1, bestBowling: "4/22" } },
    { name: "Shahbaz Ahmed",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 29, basePriceCrore: 0.5,                    stats: { matches: 12, runs: 112, highScore: 38, strikeRate: 145.0, wickets: 6, economy: 9.2 } },
    { name: "Jaydev Unadkat",    role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 33, basePriceCrore: 0.5,                    stats: { matches: 10, wickets:  8, economy: 10.1, bestBowling: "3/22" } },
    { name: "Adam Zampa",        role: "Bowler",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 33, basePriceCrore: 1.5,                    stats: { matches: 11, wickets: 12, economy: 8.1, bestBowling: "3/18" } },
    { name: "Aiden Markram",     role: "All-Rounder",   nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 30, basePriceCrore: 2,                      stats: { matches: 14, runs: 325, highScore: 78, strikeRate: 148.0, wickets: 5, economy: 8.2 } },
    { name: "Glenn Phillips",    role: "Wicket-Keeper", nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 27, basePriceCrore: 1.5,                    stats: { matches: 10, runs: 148, highScore: 55, strikeRate: 162.0, wickets: 3 } },
    { name: "Harshal Patel",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 34, basePriceCrore: 1.5,                    stats: { matches: 15, wickets: 24, economy: 9.1, bestBowling: "4/20" } },
    { name: "Zeeshan Ansari",    role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm orthodox",      age: 24, basePriceCrore: 0.2,                    stats: { matches:  6, wickets:  5, economy: 9.8 } },
    { name: "Atharva Taide",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 22, basePriceCrore: 0.2,                    stats: { matches:  5, runs:  48, highScore: 28, strikeRate: 142.0 } },
  ],
  DC: [
    { name: "Rishabh Pant",      role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 27, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 446, highScore: 88,  strikeRate: 148.0 } },
    { name: "Kuldeep Yadav",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm wrist-spin",    age: 30, basePriceCrore: 1.5,                    stats: { matches: 14, wickets: 19, economy: 8.0, bestBowling: "4/14" } },
    { name: "Axar Patel",        role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 31, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 198, highScore: 66, strikeRate: 155.0, wickets: 14, economy: 7.8, bestBowling: "3/19" } },
    { name: "Jake Fraser-McGurk",role: "Batter",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 23, basePriceCrore: 2,                      stats: { matches: 14, runs: 330, highScore: 84, strikeRate: 234.0 } },
    { name: "Mitchell Marsh",    role: "All-Rounder",   nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 33, basePriceCrore: 2,                      stats: { matches: 12, runs: 248, highScore: 72, strikeRate: 152.0, wickets: 8, economy: 9.8, bestBowling: "2/18" } },
    { name: "Faf du Plessis",    role: "Batter",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 40, basePriceCrore: 1.5,                    stats: { matches: 13, runs: 288, highScore: 72, strikeRate: 142.0 } },
    { name: "Tristan Stubbs",    role: "Batter",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 24, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 248, highScore: 60, strikeRate: 165.0 } },
    { name: "Anrich Nortje",     role: "Bowler",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 31, basePriceCrore: 2,                      stats: { matches: 11, wickets: 14, economy: 8.1, bestBowling: "3/18" } },
    { name: "KL Rahul",          role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 33, basePriceCrore: 2,                      stats: { matches: 13, runs: 378, highScore: 82, strikeRate: 140.0 } },
    { name: "Mukesh Kumar",      role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 29, basePriceCrore: 0.5,                    stats: { matches: 14, wickets: 12, economy: 9.5, bestBowling: "3/20" } },
    { name: "Harry Brook",       role: "Batter",        nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 26, basePriceCrore: 2,                      stats: { matches: 12, runs: 356, highScore: 89, strikeRate: 155.0 } },
    { name: "Ishant Sharma",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 36, basePriceCrore: 0.5,                    stats: { matches:  8, wickets:  7, economy: 9.8, bestBowling: "2/22" } },
    { name: "Vicky Ostwal",      role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm orthodox",      age: 24, basePriceCrore: 0.2,                    stats: { matches:  7, wickets:  8, economy: 9.1, bestBowling: "3/24" } },
    { name: "Sumit Kumar",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 23, basePriceCrore: 0.2,                    stats: { matches:  5, wickets:  4, economy: 10.4 } },
    { name: "Donovan Ferreira",  role: "Batter",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 27, basePriceCrore: 1,                      stats: { matches:  8, runs: 145, highScore: 48, strikeRate: 152.0 } },
  ],
  RR: [
    { name: "Sanju Samson",      role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 30, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 531, highScore: 121, strikeRate: 153.0 } },
    { name: "Yashasvi Jaiswal",  role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 23, basePriceCrore: 2,                      stats: { matches: 14, runs: 435, highScore: 104, strikeRate: 159.0 } },
    { name: "Riyan Parag",       role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 22, basePriceCrore: 1,                      stats: { matches: 14, runs: 573, highScore: 84,  strikeRate: 149.0, wickets: 8, economy: 9.2 } },
    { name: "Shimron Hetmyer",   role: "Batter",        nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 27, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 330, highScore: 68,  strikeRate: 168.0 } },
    { name: "Jos Buttler",       role: "Wicket-Keeper", nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 34, basePriceCrore: 2,                      stats: { matches: 14, runs: 448, highScore: 107, strikeRate: 147.0 } },
    { name: "Sandeep Sharma",    role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 32, basePriceCrore: 0.75,                   stats: { matches: 14, wickets: 19, economy: 7.9, bestBowling: "3/12" } },
    { name: "Trent Boult",       role: "Bowler",        nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 36, basePriceCrore: 2,                      stats: { matches: 13, wickets: 14, economy: 8.1, bestBowling: "3/16" } },
    { name: "Yuzvendra Chahal",  role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 34, basePriceCrore: 1.5,                    stats: { matches: 14, wickets: 18, economy: 7.6, bestBowling: "5/40" } },
    { name: "Dhruv Jurel",       role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 23, basePriceCrore: 1,                      stats: { matches: 14, runs: 292, highScore: 56, strikeRate: 145.0 } },
    { name: "Wanindu Hasaranga", role: "All-Rounder",   nationality: "Sri Lanka",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 27, basePriceCrore: 2,                      stats: { matches: 12, runs: 88, wickets: 13, economy: 7.8, bestBowling: "3/14" } },
    { name: "Rovman Powell",     role: "Batter",        nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 31, basePriceCrore: 1.5,                    stats: { matches:  9, runs: 128, highScore: 48, strikeRate: 172.0 } },
    { name: "Navdeep Saini",     role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 32, basePriceCrore: 0.5,                    stats: { matches: 10, wickets:  9, economy: 9.8, bestBowling: "2/18" } },
    { name: "Avesh Khan",        role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 28, basePriceCrore: 0.75,                   stats: { matches: 12, wickets: 11, economy: 9.6, bestBowling: "3/22" } },
    { name: "Tom Kohler-Cadmore",role: "Wicket-Keeper", nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 30, basePriceCrore: 1,                      stats: { matches:  8, runs: 148, highScore: 65, strikeRate: 152.0 } },
    { name: "Kuldeep Sen",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 27, basePriceCrore: 0.2,                    stats: { matches:  7, wickets:  7, economy: 10.0, bestBowling: "2/20" } },
    { name: "Nandre Burger",     role: "Bowler",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast",          age: 26, basePriceCrore: 1,                      stats: { matches:  9, wickets: 10, economy: 9.2, bestBowling: "3/18" } },
  ],
  PBKS: [
    { name: "Shreyas Iyer",      role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 30, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 424, highScore: 96, strikeRate: 143.0 } },
    { name: "Arshdeep Singh",    role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm fast-medium",   age: 26, basePriceCrore: 2,                      stats: { matches: 14, wickets: 17, economy: 8.6, bestBowling: "4/18" } },
    { name: "Glenn Maxwell",     role: "All-Rounder",   nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 36, basePriceCrore: 2,                      stats: { matches: 13, runs: 198, highScore: 56, strikeRate: 165.0, wickets: 9, economy: 8.8, bestBowling: "3/21" } },
    { name: "Marcus Stoinis",    role: "All-Rounder",   nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 35, basePriceCrore: 2,                      stats: { matches: 14, runs: 295, highScore: 78, strikeRate: 158.0, wickets: 8, economy: 9.4, bestBowling: "2/18" } },
    { name: "Jonny Bairstow",    role: "Wicket-Keeper", nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 35, basePriceCrore: 1.5,                    stats: { matches: 10, runs: 258, highScore: 82, strikeRate: 155.0 } },
    { name: "Yuzvendra Chahal",  role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 34, basePriceCrore: 1.5,                    stats: { matches: 12, wickets: 15, economy: 7.8, bestBowling: "4/28" } },
    { name: "Musheer Khan",      role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 20, basePriceCrore: 0.3,                    stats: { matches: 10, runs: 152, highScore: 48, strikeRate: 138.0, wickets: 4 } },
    { name: "Harpreet Brar",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 29, basePriceCrore: 0.2,                    stats: { matches: 12, wickets: 12, economy: 8.8, bestBowling: "3/22", runs: 85 } },
    { name: "Josh Inglis",       role: "Wicket-Keeper", nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 30, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 225, highScore: 65, strikeRate: 152.0 } },
    { name: "Lockie Ferguson",   role: "Bowler",        nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 33, basePriceCrore: 1.5,                    stats: { matches: 12, wickets: 16, economy: 8.6, bestBowling: "4/22" } },
    { name: "Rilee Rossouw",     role: "Batter",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 35, basePriceCrore: 1.5,                    stats: { matches: 10, runs: 245, highScore: 72, strikeRate: 158.0 } },
    { name: "Azmatullah Omarzai",role: "All-Rounder",   nationality: "Afghanistan",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 23, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 182, highScore: 58, strikeRate: 148.0, wickets: 9, economy: 9.4 } },
    { name: "Suryansh Shedge",   role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 21, basePriceCrore: 0.2,                    stats: { matches:  6, runs:  45, wickets: 3 } },
    { name: "Xavier Bartlett",   role: "Bowler",        nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 27, basePriceCrore: 1,                      stats: { matches:  9, wickets: 10, economy: 9.6, bestBowling: "3/20" } },
    { name: "Harnoor Singh",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 22, basePriceCrore: 0.2,                    stats: { matches:  5, runs:  62, highScore: 28, strikeRate: 138.0 } },
  ],
  GT: [
    { name: "Shubman Gill",      role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 25, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 426, highScore: 91, strikeRate: 140.0 } },
    { name: "Rashid Khan",       role: "All-Rounder",   nationality: "Afghanistan",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 26, basePriceCrore: 2,                      stats: { matches: 14, runs: 148, highScore: 40, strikeRate: 155.0, wickets: 18, economy: 7.4, bestBowling: "4/21" } },
    { name: "Mohammed Shami",    role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 34, basePriceCrore: 2,                      stats: { matches: 14, wickets: 22, economy: 7.8, bestBowling: "4/16" } },
    { name: "Sai Sudharsan",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Left-arm orthodox",      age: 23, basePriceCrore: 1.5,                    stats: { matches: 14, runs: 527, highScore: 103, strikeRate: 133.0 } },
    { name: "David Miller",      role: "Batter",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 35, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 298, highScore: 75, strikeRate: 162.0 } },
    { name: "Kagiso Rabada",     role: "Bowler",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 30, basePriceCrore: 2,                      stats: { matches: 14, wickets: 18, economy: 8.4, bestBowling: "4/14" } },
    { name: "Sherfane Rutherford",role:"Batter",        nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm medium",       age: 27, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 248, highScore: 72, strikeRate: 169.0 } },
    { name: "Shahrukh Khan",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 29, basePriceCrore: 0.5,                    stats: { matches: 12, runs: 192, highScore: 58, strikeRate: 172.0 } },
    { name: "Washington Sundar", role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 25, basePriceCrore: 1,                      stats: { matches: 14, runs: 145, highScore: 45, strikeRate: 142.0, wickets: 12, economy: 8.4, bestBowling: "3/18" } },
    { name: "Rahul Tewatia",     role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm leg-break",    age: 31, basePriceCrore: 1,                      stats: { matches: 14, runs: 215, highScore: 45, strikeRate: 148.0, wickets: 6, economy: 9.5 } },
    { name: "Noor Ahmad",        role: "Bowler",        nationality: "Afghanistan",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm wrist-spin",    age: 21, basePriceCrore: 2,                      stats: { matches: 13, wickets: 15, economy: 8.2, bestBowling: "3/18" } },
    { name: "Anuj Rawat",        role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 25, basePriceCrore: 0.2,                    stats: { matches: 10, runs: 148, highScore: 42, strikeRate: 138.0 } },
    { name: "Umesh Yadav",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 37, basePriceCrore: 0.5,                    stats: { matches:  8, wickets:  8, economy: 9.9, bestBowling: "2/20" } },
    { name: "Darshan Nalkande",  role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 27, basePriceCrore: 0.2,                    stats: { matches:  6, wickets:  5, economy: 10.4, bestBowling: "2/24" } },
    { name: "Jayant Yadav",      role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 34, basePriceCrore: 0.5,                    stats: { matches:  8, runs:  62, wickets: 5, economy: 8.8 } },
  ],
  LSG: [
    { name: "Rishabh Pant",      role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 27, basePriceCrore: 2,    isCaptain: true,  stats: { matches: 14, runs: 446, highScore: 88, strikeRate: 148.0 } },
    { name: "Nicholas Pooran",   role: "Wicket-Keeper", nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 29, basePriceCrore: 2,                      stats: { matches: 14, runs: 448, highScore: 98, strikeRate: 178.0 } },
    { name: "Ravi Bishnoi",      role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 24, basePriceCrore: 1.5,                    stats: { matches: 14, wickets: 18, economy: 7.6, bestBowling: "4/19" } },
    { name: "Ayush Badoni",      role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 24, basePriceCrore: 0.3,                    stats: { matches: 14, runs: 245, highScore: 55, strikeRate: 148.0, wickets: 3 } },
    { name: "Mitchell Marsh",    role: "All-Rounder",   nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 33, basePriceCrore: 2,                      stats: { matches: 11, runs: 188, highScore: 65, strikeRate: 155.0, wickets: 6 } },
    { name: "Mark Wood",         role: "Bowler",        nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 35, basePriceCrore: 2,                      stats: { matches: 12, wickets: 14, economy: 8.8, bestBowling: "3/18" } },
    { name: "David Miller",      role: "Batter",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 35, basePriceCrore: 1.5,                    stats: { matches: 12, runs: 198, highScore: 65, strikeRate: 165.0 } },
    { name: "Aryan Juyal",       role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 23, basePriceCrore: 0.2,                    stats: { matches:  4, runs:  28, highScore: 18 } },
    { name: "Abdul Samad",       role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm leg-break",    age: 23, basePriceCrore: 0.2,                    stats: { matches: 12, runs: 142, highScore: 48, strikeRate: 158.0, wickets: 4 } },
    { name: "Mohsin Khan",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm fast-medium",   age: 25, basePriceCrore: 0.2,                    stats: { matches: 10, wickets: 10, economy: 8.8, bestBowling: "3/14" } },
    { name: "Digvijay Deshmukh", role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 22, basePriceCrore: 0.2,                    stats: { matches:  7, wickets:  6, economy: 9.8 } },
    { name: "Shamar Joseph",     role: "Bowler",        nationality: "West Indies",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 24, basePriceCrore: 1.5,                    stats: { matches: 11, wickets: 13, economy: 9.2, bestBowling: "3/20" } },
    { name: "Aiden Markram",     role: "All-Rounder",   nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 30, basePriceCrore: 2,                      stats: { matches: 12, runs: 285, highScore: 72, strikeRate: 145.0, wickets: 4 } },
    { name: "Yuvraj Singh",      role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 22, basePriceCrore: 0.2,                    stats: { matches:  5, wickets:  4, economy: 10.8 } },
    { name: "M Siddharth",       role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm orthodox",      age: 26, basePriceCrore: 0.2,                    stats: { matches:  7, wickets:  8, economy: 9.4, bestBowling: "3/22" } },
    { name: "Himmat Singh",      role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 27, basePriceCrore: 0.2,                    stats: { matches:  6, runs:  72, highScore: 32 } },
  ],
};

// ─── Extra Auction Pool Players (released / new entrants) ─────────────────────
const poolPlayers: PlayerEntry[] = [
  { name: "Shikhar Dhawan",     role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 39, basePriceCrore: 1,    stats: { matches:  9, runs: 168, highScore: 58, strikeRate: 132.0 } },
  { name: "Prithvi Shaw",        role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 25, basePriceCrore: 0.75, stats: { matches:  7, runs: 145, highScore: 55, strikeRate: 148.0 } },
  { name: "Ajinkya Rahane",      role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 37, basePriceCrore: 0.5,  stats: { matches:  8, runs: 112, highScore: 38, strikeRate: 128.0 } },
  { name: "Ambati Rayudu",       role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 39, basePriceCrore: 0.5,  stats: { matches:  5, runs:  72, highScore: 32 } },
  { name: "Sarfaraz Khan",       role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 27, basePriceCrore: 0.75, stats: { matches:  8, runs: 182, highScore: 62, strikeRate: 148.0 } },
  { name: "Mayank Agarwal",      role: "Batter",        nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 34, basePriceCrore: 0.5,  stats: { matches:  8, runs: 148, highScore: 58, strikeRate: 138.0 } },
  { name: "Shardul Thakur",      role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium-fast",  age: 33, basePriceCrore: 1,    stats: { matches: 10, runs: 112, highScore: 40, strikeRate: 145.0, wickets: 10, economy: 10.2 } },
  { name: "Washington Sundar",   role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 25, basePriceCrore: 0.75, stats: { matches: 10, runs:  85, wickets: 8, economy: 8.8 } },
  { name: "Kyle Jamieson",       role: "All-Rounder",   nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 30, basePriceCrore: 1.5,  stats: { matches:  8, wickets: 10, economy: 9.2 } },
  { name: "Jason Roy",           role: "Batter",        nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 34, basePriceCrore: 1,    stats: { matches:  7, runs: 145, highScore: 52, strikeRate: 152.0 } },
  { name: "Finn Allen",          role: "Wicket-Keeper", nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 27, basePriceCrore: 1,    stats: { matches:  8, runs: 162, highScore: 65, strikeRate: 172.0 } },
  { name: "Ben Stokes",          role: "All-Rounder",   nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: "Right-arm fast-medium",  age: 34, basePriceCrore: 2,    stats: { matches:  8, runs: 145, wickets: 7, economy: 9.8 } },
  { name: "Daryl Mitchell",      role: "All-Rounder",   nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm medium",       age: 33, basePriceCrore: 1.5,  stats: { matches: 10, runs: 225, highScore: 72, strikeRate: 148.0 } },
  { name: "Matthew Wade",        role: "Wicket-Keeper", nationality: "Australia",    isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 37, basePriceCrore: 1,    stats: { matches:  7, runs: 148, highScore: 55, strikeRate: 152.0 } },
  { name: "Alex Hales",          role: "Batter",        nationality: "England",      isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 36, basePriceCrore: 1.5,  stats: { matches:  9, runs: 188, highScore: 72, strikeRate: 158.0 } },
  { name: "Azam Khan",           role: "Wicket-Keeper", nationality: "Pakistan",     isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 27, basePriceCrore: 1,    stats: { matches:  8, runs: 145, highScore: 55, strikeRate: 165.0 } },
  { name: "Tabraiz Shamsi",      role: "Bowler",        nationality: "South Africa", isOverseas: true,  isCapped: true,  battingStyle: "Right-hand bat",  bowlingStyle: "Left-arm wrist-spin",    age: 34, basePriceCrore: 1,    stats: { matches:  9, wickets: 10, economy: 8.2 } },
  { name: "Tom Latham",          role: "Wicket-Keeper", nationality: "New Zealand",  isOverseas: true,  isCapped: true,  battingStyle: "Left-hand bat",   bowlingStyle: null,                     age: 33, basePriceCrore: 1,    stats: { matches:  7, runs: 128, highScore: 48, strikeRate: 138.0 } },
  { name: "Laurie Evans",        role: "Batter",        nationality: "England",      isOverseas: true,  isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 36, basePriceCrore: 0.5,  stats: { matches:  5, runs:  82, highScore: 38 } },
  { name: "Samarth Vyas",        role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 24, basePriceCrore: 0.2,  stats: { matches:  4, runs:  65, highScore: 32 } },
  { name: "Tanush Kotian",       role: "All-Rounder",   nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm off-break",    age: 26, basePriceCrore: 0.2,  stats: { matches:  7, runs:  72, wickets: 5, economy: 9.5 } },
  { name: "Yash Thakur",         role: "Bowler",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast-medium",  age: 24, basePriceCrore: 0.2,  stats: { matches:  7, wickets:  8, economy: 9.8 } },
  { name: "Upendra Yadav",       role: "Wicket-Keeper", nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 22, basePriceCrore: 0.2,  stats: { matches:  6, runs:  78, highScore: 32 } },
  { name: "Eshan Malinga",       role: "Bowler",        nationality: "Sri Lanka",    isOverseas: true,  isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: "Right-arm fast",         age: 21, basePriceCrore: 0.3,  stats: { matches:  5, wickets:  6, economy: 9.8 } },
  { name: "Nehal Wadhera",       role: "Batter",        nationality: "India",        isOverseas: false, isCapped: false, battingStyle: "Right-hand bat",  bowlingStyle: null,                     age: 25, basePriceCrore: 0.2,  stats: { matches:  8, runs: 128, highScore: 48, strikeRate: 148.0 } },
];

async function seed() {
  console.log("▶ Seeding franchises...");
  const allFranchises = await db.select().from(franchisesTable);
  const franchiseMap: Record<string, number> = {};

  if (allFranchises.length === 0) {
    for (const f of franchises) {
      const [inserted] = await db.insert(franchisesTable).values(f).returning();
      franchiseMap[f.shortName] = inserted.id;
    }
    console.log(`  ✓ Inserted ${franchises.length} franchises`);
  } else {
    allFranchises.forEach((f) => { franchiseMap[f.shortName] = f.id; });
    console.log(`  ↩ Franchises already seeded (${allFranchises.length})`);
  }

  console.log("▶ Seeding players and season data...");
  const existingPlayers = await db.select().from(playersTable);
  if (existingPlayers.length > 0) {
    console.log(`  ↩ Players already seeded (${existingPlayers.length}). Skipping.`);
    console.log("  ℹ To re-seed, truncate the players table first.");
    process.exit(0);
  }

  const allEntries: Array<{ player: PlayerEntry; franchiseShortName: string | null }> = [];
  for (const [shortName, players] of Object.entries(squads)) {
    for (const p of players) {
      allEntries.push({ player: p, franchiseShortName: shortName });
    }
  }
  for (const p of poolPlayers) {
    allEntries.push({ player: p, franchiseShortName: null });
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = allEntries.filter(({ player }) => {
    if (seen.has(player.name)) return false;
    seen.add(player.name);
    return true;
  });

  let inserted = 0;
  for (const { player: p, franchiseShortName } of unique) {
    const franchiseId = franchiseShortName ? (franchiseMap[franchiseShortName] ?? null) : null;

    const [dbPlayer] = await db.insert(playersTable).values({
      name: p.name,
      role: p.role,
      nationality: p.nationality,
      isOverseas: p.isOverseas,
      isCapped: p.isCapped,
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle ?? null,
      age: p.age,
    }).returning();

    const s = p.stats;
    // Create seasons 2022-2025, assigning to franchise for 2023-2025
    for (const year of [2022, 2023, 2024, 2025]) {
      const hasFranchise = year >= 2023 && franchiseId !== null;
      await db.insert(playerSeasonsTable).values({
        playerId: dbPlayer.id,
        seasonYear: year,
        franchiseId: hasFranchise ? franchiseId : null,
        basePriceCrore: p.basePriceCrore.toFixed(2),
        age: p.age - (2025 - year),
        isCaptain: year === 2025 && (p.isCaptain ?? false),
        ...(s && year === 2025 ? {
          matchesPlayed: s.matches,
          runs: s.runs ?? null,
          highScore: s.highScore ?? null,
          strikeRate: s.strikeRate != null ? s.strikeRate.toFixed(2) : null,
          wickets: s.wickets ?? null,
          economy: s.economy != null ? s.economy.toFixed(2) : null,
          bestBowling: s.bestBowling ?? null,
        } : {}),
      });
    }
    inserted++;
  }

  console.log(`  ✓ Inserted ${inserted} players with season data (2022–2025)`);
  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
