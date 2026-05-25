#!/usr/bin/env node
/**
 * Fixes corrupted .next on external volumes and when dev + production builds are mixed.
 * Symptoms: ENOENT page.js, Cannot find module './611.js', Internal Server Error (missing routes-manifest).
 *
 * Never deletes .next during production prebuild — stop dev first, then npm run clean.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const isProduction = process.argv.includes("--production");
const isPrebuild = process.argv.includes("--prebuild");
const devLockFile = path.join(root, ".next-dev.lock");

const inventoryDir = path.join(nextDir, "server/app/(dashboard)/inventory");
const pageJs = path.join(inventoryDir, "page.js");
const clientManifest = path.join(inventoryDir, "page_client-reference-manifest.js");
const webpackRuntime = path.join(nextDir, "server/webpack-runtime.js");
const buildId = path.join(nextDir, "BUILD_ID");
const routesManifest = path.join(nextDir, "routes-manifest.json");
const documentJs = path.join(nextDir, "server/pages/_document.js");
const prodPagesRuntime = path.join(nextDir, "server/pages/_document.js");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rmNext(reason) {
  console.warn(`[happus-tadka] ${reason}`);
  console.warn("[happus-tadka] Removing .next — run npm run dev:clean (or npm run build) next.");

  const cache = path.join(root, "node_modules", ".cache");
  const targets = [nextDir, cache].filter((p) => fs.existsSync(p));

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      for (const target of targets) {
        fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      }
      return;
    } catch (err) {
      if (attempt === 5) throw err;
      await sleep(200 * attempt);
    }
  }
}

function readRuntime() {
  if (!fs.existsSync(webpackRuntime)) return "";
  return fs.readFileSync(webpackRuntime, "utf8");
}

/** Production runtime loads chunks from ./chunks/ — dev-only runtime uses ./ID.js */
function isBrokenProductionRuntime(content) {
  if (!content) return false;
  if (content.includes('require("./chunks/') || content.includes('require("./chunks"+')) {
    return false;
  }
  if (content.includes('require("./"') && content.includes(".js")) {
    return true;
  }
  return documentJs && fs.existsSync(documentJs) && !content.includes("chunks/");
}

/** Production `next build` output — must not be reused by `next dev` */
function isProductionBuildArtifact() {
  if (!fs.existsSync(buildId)) return false;
  if (!fs.existsSync(routesManifest)) return true;
  if (!fs.existsSync(prodPagesRuntime)) return false;
  const doc = fs.readFileSync(prodPagesRuntime, "utf8");
  return doc.includes("pages.runtime.prod");
}

function isBrokenClientWebpackRuntime() {
  const chunksDir = path.join(nextDir, "static/chunks");
  if (!fs.existsSync(chunksDir)) return false;

  const runtimes = fs
    .readdirSync(chunksDir)
    .filter((name) => name === "webpack.js" || /^webpack-[^/]+\.js$/.test(name));

  if (runtimes.length === 0) return false;

  return runtimes.some((name) => {
    const content = fs.readFileSync(path.join(chunksDir, name), "utf8");
    if (!content.includes("webpackChunk_N_E")) return false;
    return !/\.n\s*=\s*function|__webpack_require__\.n\s*=/.test(content);
  });
}

function failProduction(message) {
  console.error(`[happus-tadka] ${message}`);
  console.error(
    "[happus-tadka] Stop any running dev server (Ctrl+C), then run: npm run clean && npm run build"
  );
  process.exit(1);
}

function devServerRunning() {
  if (!fs.existsSync(devLockFile)) return false;
  try {
    const pid = parseInt(fs.readFileSync(devLockFile, "utf8"), 10);
    if (!Number.isFinite(pid)) return false;
    process.kill(pid, 0);
    return true;
  } catch {
    try {
      fs.unlinkSync(devLockFile);
    } catch {
      /* ignore */
    }
    return false;
  }
}

async function main() {
  if ((isProduction || isPrebuild) && devServerRunning()) {
    failProduction(
      "Dev server is still running and shares .next — stop it first (Ctrl+C or: npm run dev:stop)."
    );
  }

  if (!fs.existsSync(nextDir)) {
    process.exit(0);
  }

  if (fs.existsSync(clientManifest) && !fs.existsSync(pageJs)) {
    if (isProduction) {
      failProduction("Incomplete Next.js cache (missing page.js).");
    }
    await rmNext("Incomplete Next.js cache (missing page.js).");
    process.exit(0);
  }

  const runtimeContent = readRuntime();

  if (isPrebuild) {
    if (isBrokenProductionRuntime(runtimeContent) || !fs.existsSync(routesManifest)) {
      await rmNext("Stale or incomplete .next before production build.");
    }
    process.exit(0);
  }

  if (isProduction) {
    if (!fs.existsSync(buildId)) {
      console.error("[happus-tadka] No production build found. Run: npm run build");
      process.exit(1);
    }
    if (isBrokenProductionRuntime(runtimeContent)) {
      failProduction("Corrupted production cache (dev build mixed in — missing ./chunks/ paths).");
    }
    process.exit(0);
  }

  if (isProductionBuildArtifact()) {
    await rmNext(
      "Production .next detected (npm run build). Clearing before dev — do not run build while dev is running."
    );
    process.exit(0);
  }

  if (!fs.existsSync(routesManifest)) {
    await rmNext("Missing routes-manifest.json — .next is incomplete.");
    process.exit(0);
  }

  if (fs.existsSync(buildId) && isBrokenProductionRuntime(runtimeContent)) {
    await rmNext("Stale production .next detected before dev — cleaning for a fresh dev compile.");
    process.exit(0);
  }

  if (isBrokenProductionRuntime(runtimeContent)) {
    await rmNext("Corrupted webpack runtime detected.");
    process.exit(0);
  }

  if (isBrokenClientWebpackRuntime()) {
    await rmNext("Corrupted client webpack runtime (__webpack_require__.n missing).");
  }
}

main().catch((err) => {
  console.error("[happus-tadka] Cache cleanup failed:", err.message);
  console.error("[happus-tadka] Stop the dev server, then run: npm run dev:clean");
  process.exit(isProduction ? 1 : 0);
});
