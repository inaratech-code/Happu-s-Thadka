import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/** Load DATABASE_URL from .env.development / .env.local (does not override existing env). */
export function loadDatabaseEnv() {
  parseEnvFile(join(root, ".env.development"));
  parseEnvFile(join(root, ".env.local"));
  parseEnvFile(join(root, ".env"));
}

export function requireDatabaseUrl() {
  loadDatabaseEnv();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      "DATABASE_URL is not set.\n" +
        "Add it to .env.development (from Neon dashboard → Connection string),\n" +
        "then run: npm run db:migrate && npm run db:seed-menu"
    );
    process.exit(1);
  }
  if (url.includes("your-neon-url") || !url.startsWith("postgres")) {
    console.error(
      "DATABASE_URL looks invalid. Use your real Neon connection string in .env.development,\n" +
        "not the placeholder 'your-neon-url'."
    );
    process.exit(1);
  }
  return url;
}
