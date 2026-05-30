/**
 * Downloads AI product photos for each menu catalog item into public/menu-images/.
 * Uses Pollinations (flux) — run: npm run menu:images
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "menu-images");
const catalogPath = path.join(root, "src", "lib", "default-menu.ts");

const CONCURRENCY = 1;
const BATCH_DELAY_MS = 3500;
const MAX_RETRIES = 4;
const WIDTH = 512;
const HEIGHT = 512;

function seedFromSlug(slug) {
  let h = 0;
  for (const c of slug) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h) % 1_000_000;
}

function menuImagePrompt(name, category) {
  return [
    "Professional restaurant menu product photograph",
    `of ${name}`,
    `(${category})`,
    "single item centered on a clean neutral background",
    "soft studio lighting, photorealistic, appetizing, high detail",
    "no text, no labels, no watermark, no people",
  ].join(", ");
}

function parseCatalog(content) {
  const items = [];
  const re = /\{[\s\S]*?\}/g;
  for (const block of content.match(re) ?? []) {
    if (!block.includes("sellingPrice")) continue;
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const category = block.match(/category:\s*"([^"]+)"/)?.[1];
    const sellingPrice = block.match(/sellingPrice:\s*(\d+)/)?.[1];
    if (id && name && category && sellingPrice) {
      items.push({ slug: id, name, category });
    }
  }
  return items;
}

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadFromUrl(url, attempt = 0) {
  const res = await fetch(url, {
    headers: { "User-Agent": "HappusTadka-MenuImageGen/1.0" },
    signal: AbortSignal.timeout(120_000),
  });

  if (res.status === 402 || res.status === 429) {
    if (attempt < MAX_RETRIES) {
      await sleep(8000 * (attempt + 1));
      return downloadFromUrl(url, attempt + 1);
    }
    throw new Error(`HTTP ${res.status} (rate limited)`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) {
    throw new Error("Response too small — likely not an image");
  }

  return buf;
}

async function downloadImage(item) {
  const prompt = encodeURIComponent(menuImagePrompt(item.name, item.category));
  const seed = seedFromSlug(item.slug);
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=${WIDTH}&height=${HEIGHT}&seed=${seed}&model=flux&nologo=true`;
  return downloadFromUrl(url);
}

const CATEGORY_PROMPTS = {
  beer: "assortment of beer bottles on a bar, professional menu photo",
  vodka: "vodka bottles on a bar shelf, professional menu photo",
  beverages: "assorted soft drinks and energy drinks, professional menu photo",
  wine: "red and white wine bottles, professional menu photo",
  curry: "Indian egg curry in a bowl, restaurant menu photo",
  chicken: "Indian chicken curry dish, restaurant menu photo",
  whiskey: "premium whiskey bottles, professional menu photo",
  sides: "Indian restaurant sides kulcha salad water, menu photo",
};

async function downloadCategoryImages() {
  const keys = Object.keys(CATEGORY_PROMPTS);
  const allPresent = (
    await Promise.all(keys.map((k) => exists(path.join(outDir, `_cat-${k}.jpg`))))
  ).every(Boolean);
  if (allPresent) {
    console.log("All category thumbnails present — skipping");
    return;
  }

  for (const [key, promptText] of Object.entries(CATEGORY_PROMPTS)) {
    const outFile = path.join(outDir, `_cat-${key}.jpg`);
    if (await exists(outFile)) {
      console.log(`skip category _cat-${key} (exists)`);
      continue;
    }
    const prompt = encodeURIComponent(
      `${promptText}, soft studio lighting, photorealistic, no text, no watermark`
    );
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=${WIDTH}&height=${HEIGHT}&seed=${seedFromSlug(key)}&model=flux&nologo=true`;
    process.stdout.write(`category _cat-${key}… `);
    try {
      const buf = await downloadFromUrl(url);
      await writeFile(outFile, buf);
      console.log("ok");
    } catch (err) {
      console.log(`failed (${err instanceof Error ? err.message : err})`);
    }
    await sleep(BATCH_DELAY_MS);
  }
}

async function main() {
  const onlyCategories = process.argv.includes("--categories-only");
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
  const skipExisting = !process.argv.includes("--force");

  const catalogSrc = await import("node:fs/promises").then((fs) =>
    fs.readFile(catalogPath, "utf8")
  );
  let items = parseCatalog(catalogSrc);
  if (only) {
    items = items.filter((i) => i.slug === only);
    if (items.length === 0) {
      console.error(`No catalog item with slug "${only}"`);
      process.exit(1);
    }
  }

  await mkdir(outDir, { recursive: true });

  console.log("Category thumbnails…");
  await downloadCategoryImages();
  if (onlyCategories) return;

  console.log(`Generating ${items.length} menu images → public/menu-images/`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  const pending = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const outFile = path.join(outDir, `${item.slug}.jpg`);
    if (skipExisting && (await exists(outFile))) {
      skipped++;
      console.log(`[${i + 1}/${items.length}] skip ${item.slug} (exists)`);
      continue;
    }
    pending.push({ item, index: i });
  }

  for (let b = 0; b < pending.length; b += CONCURRENCY) {
    const batch = pending.slice(b, b + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ item, index }) => {
        const label = `[${index + 1}/${items.length}]`;
        const outFile = path.join(outDir, `${item.slug}.jpg`);
        process.stdout.write(`${label} ${item.slug}… `);
        try {
          const buf = await downloadImage(item);
          await writeFile(outFile, buf);
          ok++;
          console.log("ok");
        } catch (err) {
          failed++;
          console.log(`failed (${err instanceof Error ? err.message : err})`);
        }
      })
    );
    if (b + CONCURRENCY < pending.length) await sleep(BATCH_DELAY_MS);
  }

  console.log(`Done: ${ok} saved, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
