import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, join } from "node:path";

import { contentHash, isCacheValid, writeCacheMeta } from "./cache.mjs";
import { SlideContext } from "./charts/context.mjs";
import { getPlot, loadData } from "./charts/registry.mjs";
import { savePngBuffer } from "./charts/helpers.mjs";
import { renderMermaid } from "./mermaid.mjs";
import {
  BUILD_DIR,
  CACHE_DIR,
  CHARTS_DIR,
  DIAGRAMS_ASSETS_DIR,
  MERMAID_DIR,
  PLOTS_ASSETS_DIR,
  ensureDirs,
  themeDir,
} from "./paths.mjs";
import { getTableData, renderTableMarkdown } from "./table.mjs";
import { compileTheme } from "./theme/compile.mjs";
import { loadTheme } from "./theme/tokens.mjs";

const DIRECTIVE_RE =
  /\{\{(plot|table|mermaid):([a-zA-Z0-9_/\-]+)(?:\s*\|\s*([^}]*))?\}\}/g;
const OPTION_RE = /(\w+)\s*=\s*([^|]+)/g;

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

function assetHref(path) {
  return relative(BUILD_DIR, path).split("\\").join("/");
}

async function renderPlotDirective(name, options, tokens, data) {
  const slot = options.slot ?? "full";
  const ctx = new SlideContext({ tokens, slotName: slot, data });
  const plotFn = await getPlot(name);

  const chartSource = join(CHARTS_DIR, `${name.replace(/\//g, "_")}.mjs`);
  const tokensText = await readFile(tokens.sourcePath, "utf8");
  const tokensHash = contentHash(tokensText, tokens.name);
  const dataHash = contentHash(
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : String(v)]),
    ),
  );
  const sourceText = existsSync(chartSource)
    ? await readFile(chartSource, "utf8")
    : name;
  const plotHash = contentHash(name, slot, tokensHash, dataHash, sourceText);

  const outPath = join(PLOTS_ASSETS_DIR, `${name.replace(/\//g, "_")}.png`);
  if (
    !(await isCacheValid(CACHE_DIR, `plot-${name}`, {
      expectedHash: plotHash,
      outputPath: outPath,
    }))
  ) {
    const buffer = await plotFn(ctx);
    await savePngBuffer(buffer, outPath);
    await writeCacheMeta(CACHE_DIR, `plot-${name}`, {
      hashValue: plotHash,
      output: outPath,
    });
  }

  return `![width:${tokens.figureWidthPct}%](${assetHref(outPath)})`;
}

function renderTableDirective(name, options, tokens, data) {
  const maxRows =
    "max_rows" in options ? Number.parseInt(options.max_rows, 10) : null;
  const rows = getTableData(name, data);
  return renderTableMarkdown(rows, tokens, { maxRows });
}

async function renderMermaidDirective(name, tokens) {
  const outPath = join(DIAGRAMS_ASSETS_DIR, `${name}.svg`);
  const mermaidSrc = join(MERMAID_DIR, `${name}.mmd`);
  const tokensText = await readFile(tokens.sourcePath, "utf8");
  const tokensHash = contentHash(tokensText, tokens.name);
  const srcHash = contentHash(
    existsSync(mermaidSrc) ? await readFile(mermaidSrc, "utf8") : name,
  );
  const diagramHash = contentHash(name, tokensHash, srcHash);

  if (
    !(await isCacheValid(CACHE_DIR, `mermaid-${name}`, {
      expectedHash: diagramHash,
      outputPath: outPath,
    }))
  ) {
    await renderMermaid(name, tokens, outPath);
    await writeCacheMeta(CACHE_DIR, `mermaid-${name}`, {
      hashValue: diagramHash,
      output: outPath,
    });
  }

  return `![width:${tokens.figureWidthPct}%](${assetHref(outPath)})`;
}

export async function preprocessDeck(deckPath, { themeName = null } = {}) {
  await ensureDirs();
  const text = await readFile(deckPath, "utf8");
  const theme = themeName || parseThemeFromDeck(text);
  const tokens = await ensureThemeCompiled(theme);
  const data = await loadData();

  const parts = [];
  let last = 0;
  for (const match of text.matchAll(DIRECTIVE_RE)) {
    parts.push(text.slice(last, match.index));
    const kind = match[1];
    const name = match[2];
    const options = parseOptions(match[3]);
    if (kind === "plot") {
      parts.push(await renderPlotDirective(name, options, tokens, data));
    } else if (kind === "table") {
      parts.push(renderTableDirective(name, options, tokens, data));
    } else if (kind === "mermaid") {
      parts.push(await renderMermaidDirective(name, tokens));
    } else {
      parts.push(match[0]);
    }
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));

  let processed = parts.join("");
  processed = injectBrandingFrontmatter(processed, tokens);
  await mkdir(BUILD_DIR, { recursive: true });
  const outPath = join(BUILD_DIR, deckPath.split(/[/\\]/).pop());
  await writeFile(outPath, processed);
  return outPath;
}
