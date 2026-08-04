import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(__dirname, "..");
export const THEMES_DIR = join(ROOT, "themes");
export const DECKS_DIR = join(ROOT, "decks");
export const BUILD_DIR = join(DECKS_DIR, ".build");
export const OUTPUT_DIR = join(ROOT, "output");
export const ASSETS_DIR = join(ROOT, "assets");
export const PLOTS_ASSETS_DIR = join(ASSETS_DIR, "plots");
export const DIAGRAMS_ASSETS_DIR = join(ASSETS_DIR, "diagrams");
export const CACHE_DIR = join(ASSETS_DIR, "cache");
export const DATA_DIR = join(ROOT, "data");
export const MERMAID_DIR = join(ROOT, "mermaid");

export function themeDir(name) {
  return join(THEMES_DIR, name);
}

export async function ensureDirs() {
  for (const d of [
    BUILD_DIR,
    OUTPUT_DIR,
    PLOTS_ASSETS_DIR,
    DIAGRAMS_ASSETS_DIR,
    CACHE_DIR,
  ]) {
    await mkdir(d, { recursive: true });
  }
}
