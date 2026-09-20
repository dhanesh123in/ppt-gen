import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

import { THEMES_DIR, themeDir } from "../paths.mjs";

const TOKEN_REF = /^\{([^}]+)\}$/;

export class ThemeTokens {
  constructor({
    name,
    variant,
    canvas,
    colors,
    typography,
    layout,
    plot,
    table,
    mermaid,
    slots,
    sourcePath,
    raw,
  }) {
    this.name = name;
    this.variant = variant;
    this.canvas = canvas;
    this.colors = colors;
    this.typography = typography;
    this.layout = layout;
    this.plot = plot;
    this.table = table;
    this.mermaid = mermaid;
    this.slots = slots;
    this.sourcePath = sourcePath;
    this.raw = raw;
  }

  get slideWidthPx() {
    return Number(this.canvas.width_px);
  }

  get slideHeightPx() {
    return Number(this.canvas.height_px);
  }

  get dpi() {
    return Number(this.plot.dpi);
  }

  get facecolor() {
    return String(this.colors.background);
  }

  get foreground() {
    return String(this.colors.foreground);
  }

  get seriesColors() {
    return this.colors.series.map(String);
  }

  get figureWidthFrac() {
    return Number(this.layout.figure_width_frac);
  }

  get figureWidthPct() {
    return Math.round(this.figureWidthFrac * 100);
  }

  get padInches() {
    return Number(this.layout.pad_inches ?? 0.08);
  }

  resolveRef(value) {
    if (typeof value !== "string") return String(value);
    const match = TOKEN_REF.exec(value.trim());
    if (!match) return value;
    const parts = match[1].split(".");
    let node = this.raw;
    for (const part of parts) {
      node = /^\d+$/.test(part) ? node[Number(part)] : node[part];
    }
    return String(node);
  }

  tableHeaderBg() {
    return this.resolveRef(this.table.header_bg);
  }

  tableZebraBg() {
    return this.resolveRef(this.table.zebra_bg);
  }

  slot(name) {
    if (!(name in this.slots)) {
      throw new Error(
        `Unknown slot '${name}'. Available: ${Object.keys(this.slots).join(", ")}`,
      );
    }
    return this.slots[name];
  }
}

export async function loadTheme(name) {
  const path = join(themeDir(name), "tokens.yaml");
  if (!existsSync(path)) {
    throw new Error(`Theme not found: ${name} (${path})`);
  }
  const raw = parseYaml(await readFile(path, "utf8"));
  const slotsRaw = raw.slots ?? {};
  const slots = Object.fromEntries(
    Object.entries(slotsRaw).map(([k, v]) => [
      k,
      {
        widthFrac: Number(v.width_frac),
        heightFrac: Number(v.height_frac),
      },
    ]),
  );
  return new ThemeTokens({
    name: raw.name,
    variant: raw.variant ?? "dark",
    canvas: raw.canvas,
    colors: raw.colors,
    typography: raw.typography,
    layout: raw.layout,
    plot: raw.plot,
    table: raw.table,
    mermaid: raw.mermaid,
    slots,
    sourcePath: path,
    raw,
  });
}

export function listThemes() {
  if (!existsSync(THEMES_DIR)) return [];
  return readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && existsSync(join(THEMES_DIR, d.name, "tokens.yaml")),
    )
    .map((d) => d.name)
    .sort();
}
