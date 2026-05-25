#!/usr/bin/env node
/** Stop all Next dev servers for this project (prevents shared .next corruption). */
import { execSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(process.cwd());
const escaped = root.replace(/'/g, "'\\''");

try {
  const out = execSync(`pgrep -fl '${escaped}.*next dev' 2>/dev/null || true`, {
    encoding: "utf8",
    shell: "/bin/sh",
  }).trim();

  if (!out) {
    console.log("[happus-tadka] No dev servers running for this project.");
    process.exit(0);
  }

  const pids = [
    ...new Set(
      out
        .split("\n")
        .map((line) => parseInt(line.trim().split(/\s+/)[0], 10))
        .filter((n) => Number.isFinite(n))
    ),
  ];

  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already stopped */
    }
  }

  console.log(`[happus-tadka] Stopped ${pids.length} dev server(s): ${pids.join(", ")}`);
} catch (err) {
  console.warn("[happus-tadka] Could not list dev servers:", err.message);
}
