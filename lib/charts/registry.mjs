import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { readFile } from "node:fs/promises";

import { DATA_DIR } from "../paths.mjs";

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

/** Load all data/*.csv keyed by stem (regions, quarterly, …). */
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

export function listDataSets(data) {
  return Object.keys(data).sort();
}
