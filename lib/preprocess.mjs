import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, join, resolve } from "node:path";

import { contentHash, isCacheValid, writeCacheMeta } from "./cache.mjs";
import { SlideContext } from "./charts/context.mjs";
import { renderCsvPlot } from "./charts/from-csv.mjs";
import { loadData } from "./charts/registry.mjs";
import { savePngBuffer } from "./charts/helpers.mjs";
import { renderMermaid } from "./mermaid.mjs";
import {
  BUILD_DIR,
  CACHE_DIR,
  DIAGRAMS_ASSETS_DIR,
  MERMAID_DIR,
  PLOTS_ASSETS_DIR,
  ROOT,
  ensureDirs,
  themeDir,
} from "./paths.mjs";
import { getTableData, renderTableMarkdown } from "./table.mjs";
import { compileTheme } from "./theme/compile.mjs";
import { loadTheme } from "./theme/tokens.mjs";

const DIRECTIVE_RE =
  /\{\{(plot|table|mermaid):([a-zA-Z0-9_/\-]+)(?:\s*\|\s*([^}]*))?\}\}/g;
const OPTION_RE = /(\w+)\s*=\s*([^|]+)/g;
const IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function parseOptions(optionsStr) {
  if (!optionsStr) return {};
  const out = {};
  for (const m of optionsStr.matchAll(OPTION_RE)) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function injectBrandingFrontmatter(text, tokens) {
  const branding = tokens.raw.branding ?? {};
  const footer = branding.footer;
  if (!footer || !text.startsWith("---")) return text;

  const end = text.indexOf("---", 3);
  if (end === -1) return text;

  const front = text.slice(3, end);
  const body = text.slice(end + 3);
  const lines = front.split(/\r?\n/);
  if (lines.some((line) => line.trim().startsWith("footer:"))) return text;

  let insertAt = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("paginate:")) {
      insertAt = i + 1;
      break;
    }
  }
  lines.splice(insertAt, 0, `footer: "${footer}"`);
  return `---\n${lines.join("\n")}\n---${body}`;
}

function parseThemeFromDeck(text) {
  if (!text.startsWith("---")) return "scientific";
  const end = text.indexOf("---", 3);
  if (end === -1) return "scientific";
  const front = text.slice(3, end);
  for (const line of front.split(/\r?\n/)) {
    if (line.trim().startsWith("theme:")) {
      return line.split(":").slice(1).join(":").trim();
    }
  }
  return "scientific";
}

async function ensureThemeCompiled(themeName) {
  const tokensFile = join(themeDir(themeName), "tokens.yaml");
  const cssFile = join(themeDir(themeName), "theme.css");
  if (
    !existsSync(cssFile) ||
    (existsSync(tokensFile) &&
      statSync(tokensFile).mtimeMs > statSync(cssFile).mtimeMs)
  ) {
    await compileTheme(themeName);
  }
  return loadTheme(themeName);
}

function assetHref(path, { absolute = false } = {}) {
  if (absolute) return resolve(path);
  return relative(BUILD_DIR, path).split("\\").join("/");
}

async function renderPlotDirective(name, options, tokens, data, hrefOpts) {
  if (!(name in data)) {
    throw new Error(
      `Unknown plot data '${name}'. Add data/${name}.csv (available: ${Object.keys(data).sort().join(", ")})`,
    );
  }
  const rows = data[name];
  const slot = options.slot ?? "full";
  const ctx = new SlideContext({ tokens, slotName: slot, data });

  const tokensText = await readFile(tokens.sourcePath, "utf8");
  const tokensHash = contentHash(tokensText, tokens.name);
  const dataHash = contentHash(rows);
  const optsHash = contentHash(options);
  const plotHash = contentHash(name, slot, tokensHash, dataHash, optsHash);

  const outStem = `${name.replace(/\//g, "_")}-${plotHash.slice(0, 10)}`;
  const outPath = join(PLOTS_ASSETS_DIR, `${outStem}.png`);
  if (
    !(await isCacheValid(CACHE_DIR, `plot-${outStem}`, {
      expectedHash: plotHash,
      outputPath: outPath,
    }))
  ) {
    const buffer = await renderCsvPlot(name, rows, options, ctx);
    await savePngBuffer(buffer, outPath);
    await writeCacheMeta(CACHE_DIR, `plot-${outStem}`, {
      hashValue: plotHash,
      output: outPath,
    });
  }

  return `![width:${tokens.figureWidthPct}%](${assetHref(outPath, hrefOpts)})`;
}

function renderTableDirective(name, options, tokens, data) {
  const maxRows =
    "max_rows" in options ? Number.parseInt(options.max_rows, 10) : null;
  const rows = getTableData(name, data);
  return renderTableMarkdown(rows, tokens, { maxRows });
}

async function renderMermaidDirective(name, tokens, hrefOpts) {
  const ext = hrefOpts.mermaidExt ?? "svg";
  const outPath = join(DIAGRAMS_ASSETS_DIR, `${name}.${ext}`);
  const mermaidSrc = join(MERMAID_DIR, `${name}.mmd`);
  const tokensText = await readFile(tokens.sourcePath, "utf8");
  const tokensHash = contentHash(tokensText, tokens.name);
  const srcHash = contentHash(
    existsSync(mermaidSrc) ? await readFile(mermaidSrc, "utf8") : name,
  );
  const diagramHash = contentHash(name, tokensHash, srcHash, ext);

  if (
    !(await isCacheValid(CACHE_DIR, `mermaid-${name}-${ext}`, {
      expectedHash: diagramHash,
      outputPath: outPath,
    }))
  ) {
    await renderMermaid(name, tokens, outPath);
    await writeCacheMeta(CACHE_DIR, `mermaid-${name}-${ext}`, {
      hashValue: diagramHash,
      output: outPath,
    });
  }

  return `![width:${tokens.figureWidthPct}%](${assetHref(outPath, hrefOpts)})`;
}

/**
 * Expand {{plot}} / {{table}} / {{mermaid}} in markdown text.
 * @param {object} [opts]
 * @param {boolean} [opts.absolute] — absolute image paths (for pptxgenjs)
 * @param {'svg'|'png'} [opts.mermaidExt]
 */
export async function expandDirectives(
  text,
  tokens,
  data,
  { absolute = false, mermaidExt = "svg" } = {},
) {
  const hrefOpts = { absolute, mermaidExt };
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(DIRECTIVE_RE)) {
    parts.push(text.slice(last, match.index));
    const kind = match[1];
    const name = match[2];
    const options = parseOptions(match[3]);
    if (kind === "plot") {
      parts.push(await renderPlotDirective(name, options, tokens, data, hrefOpts));
    } else if (kind === "table") {
      parts.push(renderTableDirective(name, options, tokens, data));
    } else if (kind === "mermaid") {
      parts.push(await renderMermaidDirective(name, tokens, hrefOpts));
    } else {
      parts.push(match[0]);
    }
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts.join("");
}

/**
 * Parse expanded markdown into contentSlide data (images, tables, bullets).
 */
export function parseContentFromExpandedMarkdown(markdown) {
  // Local heading extract (subtitle must not swallow directive/image lines)
  const lines = markdown.split(/\r?\n/);
  let title = null;
  let subtitle = null;
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const h = lines[i]?.match(/^#{1,2}\s+(.+)$/);
  if (h) {
    title = h[1].trim();
    i++;
    while (i < lines.length && !lines[i].trim()) i++;
    const line = lines[i];
    if (
      line &&
      !line.startsWith("#") &&
      !line.startsWith(":::") &&
      !line.startsWith("{{") &&
      !line.startsWith("!") &&
      !line.startsWith("|") &&
      !line.startsWith("<") &&
      !/^[-*]\s/.test(line)
    ) {
      subtitle = line.trim();
      i++;
    }
  }
  let working = lines.slice(i).join("\n").trim();
  const images = [];

  working = working.replace(IMG_RE, (_m, alt, src) => {
    let path = src.trim();
    if (!path.startsWith("/") && !/^[A-Za-z]:/.test(path)) {
      const fromBuild = resolve(BUILD_DIR, path);
      const fromRoot = resolve(ROOT, path);
      if (existsSync(fromBuild)) path = fromBuild;
      else if (existsSync(fromRoot)) path = fromRoot;
      else path = fromBuild;
    }
    const widthMatch = String(alt).match(/width:(\d+)%/);
    const widthPct = widthMatch ? Number(widthMatch[1]) : 90;
    const w = Math.round(1156 * (widthPct / 100));
    images.push({ path, w, h: 400 });
    return "";
  });

  working = working.replace(/<style[\s\S]*?<\/style>/gi, "").trim();

  let table = null;
  const tableLines = working.split(/\r?\n/);
  const tableStart = tableLines.findIndex((l) => /^\|.+\|$/.test(l.trim()));
  if (tableStart >= 0) {
    const splitRow = (row) =>
      row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
    const headers = splitRow(tableLines[tableStart]);
    let ti = tableStart + 1;
    if (tableLines[ti] && /^\|[\s:|-]+\|$/.test(tableLines[ti].trim())) ti += 1;
    const rows = [];
    while (ti < tableLines.length && /^\|.+\|$/.test(tableLines[ti].trim())) {
      rows.push(splitRow(tableLines[ti]));
      ti += 1;
    }
    table = { headers, rows };
    const before = tableLines.slice(0, tableStart).join("\n");
    const after = tableLines.slice(ti).join("\n");
    working = `${before}\n${after}`.trim();
  }

  const bullets = [];
  const bodyParts = [];
  for (const line of working.split(/\r?\n/)) {
    const b = line.match(/^[-*]\s+(.+)$/);
    if (b) {
      bullets.push(b[1].replace(/\*\*(.+?)\*\*/g, "$1"));
    } else if (line.trim() && !line.startsWith("#")) {
      bodyParts.push(line.replace(/\*\*(.+?)\*\*/g, "$1").trim());
    }
  }

  if (images.length === 1 && !table && bullets.length === 0) {
    images[0].h = 440;
  } else if (images.length) {
    for (const img of images) img.h = 360;
  }

  return {
    title,
    subtitle,
    images,
    table,
    bullets,
    body: bodyParts.filter(Boolean).join("\n") || null,
  };
}

export async function preprocessDeck(deckPath, { themeName = null } = {}) {
  await ensureDirs();
  let text = await readFile(deckPath, "utf8");

  // Shared IR: expand ::: construct blocks to Marp-readable fallbacks first.
  const { parseDeckMarkdown } = await import("./ir/parse.mjs");
  const { irToMarpMarkdown } = await import("./ir/to-marp.mjs");
  const ir = parseDeckMarkdown(text);
  if (ir.hasConstructs) {
    text = irToMarpMarkdown(ir);
  }

  const theme = themeName || parseThemeFromDeck(text) || ir.meta.theme || "scientific";
  const tokens = await ensureThemeCompiled(theme);
  const data = await loadData();

  let processed = await expandDirectives(text, tokens, data, {
    absolute: false,
    mermaidExt: "svg",
  });
  processed = injectBrandingFrontmatter(processed, tokens);
  await mkdir(BUILD_DIR, { recursive: true });
  const outPath = join(BUILD_DIR, deckPath.split(/[/\\]/).pop());
  await writeFile(outPath, processed);
  return outPath;
}

export { ensureThemeCompiled, parseThemeFromDeck };
export { loadData } from "./charts/registry.mjs";
