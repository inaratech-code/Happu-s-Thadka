#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lockFile = path.join(root, ".next-dev.lock");
const args = process.argv.slice(2);

function removeLock() {
  try {
    fs.unlinkSync(lockFile);
  } catch {
    /* ignore */
  }
}

fs.writeFileSync(lockFile, String(process.pid));
process.on("exit", removeLock);
process.on("SIGINT", () => {
  removeLock();
  process.exit(130);
});
process.on("SIGTERM", () => {
  removeLock();
  process.exit(143);
});

const child = spawn("npx", ["next", "dev", "-H", "127.0.0.1", ...args], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  removeLock();
  process.exit(code ?? 0);
});
