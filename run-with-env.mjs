import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const name = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    env[name] = value;
  });
}

// Dynamically resolve WSL IP on Windows for database connection if using localhost/127.0.0.1
if (process.platform === "win32" && env.DATABASE_URL) {
  try {
    const { execSync } = await import("child_process");
    const wslIp = execSync("wsl hostname -I", { encoding: "utf-8" }).trim().split(/\s+/)[0];
    if (wslIp) {
      console.log(`[Env Helper] Routing DB connection through WSL IP: ${wslIp}`);
      env.DATABASE_URL = env.DATABASE_URL.replace("localhost", wslIp).replace("127.0.0.1", wslIp);
    }
  } catch (e) {
    // WSL not active or not installed, keep original
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please specify a command to run.");
  process.exit(1);
}

const cmd = args[0];
const cmdArgs = args.slice(1);

const child = spawn(cmd, cmdArgs, {
  stdio: "inherit",
  env: { ...process.env, ...env },
  shell: true,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
