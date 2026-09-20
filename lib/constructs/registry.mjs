import { existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveLayoutName } from "./normalize.mjs";
import { createFitContext } from "./fit.mjs";
import * as primitives from "./primitives.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAYOUTS_DIR = join(__dirname, "layouts");

const registry = new Map();
let loaded = false;

/**
 * @param {string} name
 * @param {object} def
 * @param {string[]} [def.aliases]
 * @param {string[]} [def.fields]
 * @param {(ctx) => object} [def.place]
 * @param {(slide, theme, boxes, data, page) => void} def.paint
 * @param {(data) => object} [def.normalize]
 */
export function registerLayout(name, def) {
  if (!def || typeof def.paint !== "function") {
    throw new Error(`registerLayout('${name}'): paint(slide, theme, boxes, data, page) required`);
  }
  const entry = { name, ...def };
  registry.set(name, entry);
  for (const a of def.aliases ?? []) {
    registry.set(a, entry);
  }
  return entry;
}

export function getLayout(name) {
  const canonical = resolveLayoutName(name);
  return registry.get(canonical) ?? registry.get(name) ?? null;
}

export function listLayouts() {
  return [...new Set([...registry.values()].map((e) => e.name))].sort();
}

export async function ensureLayoutsLoaded() {
  if (loaded) return;
  loaded = true;
  // Side-effect imports: each file calls registerLayout
  if (!existsSync(LAYOUTS_DIR)) return;
  for (const file of readdirSync(LAYOUTS_DIR).sort()) {
    if (!file.endsWith(".mjs") || file.startsWith("_")) continue;
    if (file === "index.mjs" || file === "legacy.mjs") continue;
    await import(pathToFileURL(join(LAYOUTS_DIR, file)).href);
  }
  // Bundle of remaining legacy + catalog
  await import(pathToFileURL(join(LAYOUTS_DIR, "catalog.mjs")).href);
}

/**
 * Run a registered layout on a pptxgenjs slide.
 */
export function runLayout(slide, theme, name, data, page = 1) {
  const layout = getLayout(name);
  if (!layout) {
    throw new Error(
      `Unknown layout '${name}'. Available: ${listLayouts().join(", ")}`,
    );
  }
  let normalized = data;
  if (typeof layout.normalize === "function") {
    normalized = layout.normalize(data);
  }
  const fit = createFitContext(theme, normalized);
  const ctx = {
    theme,
    data: normalized,
    page,
    fit,
    space: fit.space,
    ...primitives,
  };
  const boxes =
    typeof layout.place === "function" ? layout.place(ctx) : { region: fit.contentBox() };
  layout.paint(slide, theme, boxes, normalized, page);
}

export { LAYOUTS_DIR };
