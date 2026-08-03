import { existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { readFile } from "node:fs/promises";

import { CHARTS_DIR, DATA_DIR } from "../paths.mjs";

const registry = new Map();
let loaded = false;

export function register(name, fn) {
  registry.set(name, fn);
  return fn;
}

export async function ensureChartsLoaded() {
  if (loaded) return;
  loaded = true;
  if (!existsSync(CHARTS_DIR)) return;
  for (const name of readdirSync(CHARTS_DIR).sort()) {
    if (!name.endsWith(".mjs") || name.startsWith("_")) continue;
    await import(pathToFileURL(join(CHARTS_DIR, name)).href);
  }
}

export async function getPlot(name) {
  await ensureChartsLoaded();
  if (!registry.has(name)) {
    throw new Error(
      `Unknown plot '${name}'. Registered: ${[...registry.keys()].sort().join(", ")}`,
    );
  }
  return registry.get(name);
}

function coerceRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === "" || v == null) {
      out[k] = v;
      continue;
    }
    const n = Number(v);
    out[k] = Number.isFinite(n) && String(v).trim() !== "" ? n : v;
  }
  return out;
}

export async function loadData() {
  const data = {};
  if (!existsSync(DATA_DIR)) return data;
  for (const name of readdirSync(DATA_DIR).sort()) {
    if (!name.endsWith(".csv")) continue;
    const text = await readFile(join(DATA_DIR, name), "utf8");
    const rows = parse(text, { columns: true, skip_empty_lines: true });
    data[name.replace(/\.csv$/, "")] = rows.map(coerceRow);
  }
  return data;
}
