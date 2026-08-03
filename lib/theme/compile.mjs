import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ensureLogo } from "../brand.mjs";
import { ASSETS_DIR, themeDir } from "../paths.mjs";
import { loadTheme } from "./tokens.mjs";

function mermaidThemeVariables(tokens) {
  const series = tokens.seriesColors;
  return {
    darkMode: Boolean(tokens.mermaid.dark_mode ?? tokens.variant === "dark"),
    background: tokens.facecolor,
    primaryColor: series[0] ?? tokens.colors.accent,
    primaryTextColor: tokens.foreground,
    primaryBorderColor: tokens.colors.border ?? series[0],
    secondaryColor: series[1] ?? series[0],
    secondaryTextColor: tokens.foreground,
    secondaryBorderColor: tokens.colors.border ?? series[1] ?? series[0],
    tertiaryColor: series[2] ?? series[0],
    tertiaryTextColor: tokens.foreground,
    tertiaryBorderColor: tokens.colors.border ?? series[0],
    lineColor: tokens.foreground,
    textColor: tokens.foreground,
    fontFamily: tokens.typography.sans,
    fontSize: `${tokens.typography.mermaid.font_px}px`,
    noteBkgColor: tokens.colors.border ?? "#3a3a5c",
    noteTextColor: tokens.foreground,
    noteBorderColor: tokens.colors.muted ?? "#6c6c8a",
  };
}

function logoDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

function generateCss(tokens, logoUri) {
  const slide = tokens.typography.slide;
  const headerBg = tokens.tableHeaderBg();
  const zebraBg = tokens.tableZebraBg();
  const accent = tokens.colors.accent;
  const muted = tokens.colors.muted;
  const mono = tokens.typography.mono;
  const captionPx = slide.caption_px;
  const pad = tokens.layout.content_padding_px ?? 48;
  const border = tokens.colors.border ?? "#3a3a5c";
  const widthPx = tokens.canvas.width_px;
  const heightPx = tokens.canvas.height_px;
  const branding = tokens.raw.branding ?? {};
  const logoH = Number(branding.logo_height_px ?? 44);
  const logoTop = Number(branding.logo_top_px ?? 28);
  const logoRight = Number(branding.logo_right_px ?? 36);

  return `/* @theme ${tokens.name} */
/* generated from tokens.yaml; edit tokens, recompile */
section {
  background: ${tokens.facecolor};
  color: ${tokens.foreground};
  font-family: ${tokens.typography.sans};
  font-size: ${slide.body_px}px;
  width: ${widthPx}px;
  height: ${heightPx}px;
  padding: ${pad}px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  place-content: start start;
}
section:has(> h1) {
  justify-content: center;
  place-content: center center;
  text-align: center;
}
section::before {
  content: "";
  position: absolute;
  top: ${logoTop}px;
  right: ${logoRight}px;
  width: ${logoH}px;
  height: ${logoH}px;
  background: url("${logoUri}") no-repeat center / contain;
  pointer-events: none;
}
h1 {
  color: ${accent};
  font-size: ${slide.title_px}px;
  margin: 0;
}
section:not(:has(> h1)) > h2:first-of-type {
  color: ${tokens.foreground};
  font-size: ${slide.heading_px}px;
  margin: 0 0 0.5em 0;
  margin-block: 0 0.5em;
  padding-bottom: 0.35em;
  border-bottom: 2px solid ${border};
  width: 100%;
  flex-shrink: 0;
}
h2 {
  color: ${tokens.foreground};
  font-size: ${slide.heading_px}px;
  margin-block: 0 0.5em;
}
strong {
  color: ${accent};
}
code {
  font-family: ${mono};
  background: ${zebraBg};
}
table {
  font-size: ${tokens.table.font_px}px;
  border-collapse: collapse;
  width: 100%;
}
table th {
  background: ${headerBg};
  color: ${tokens.foreground};
  padding: 0.4em 0.6em;
}
table td {
  border: 1px solid ${tokens.colors.border ?? "#3a3a5c"};
  padding: 0.35em 0.6em;
}
table tr:nth-child(even) {
  background: ${zebraBg};
}
.figure-caption, .table-caption {
  font-size: ${captionPx}px;
  color: ${muted};
  margin-top: 0.5em;
}
footer {
  position: absolute;
  bottom: 0;
  left: 0;
  color: ${muted};
  font-size: 0.55em;
  padding: inherit;
  width: calc(100% - 5em);
}
`;
}

async function mergeOverrides(css, themeName) {
  const overrides = join(themeDir(themeName), "overrides.css");
  if (!existsSync(overrides)) return css;
  return `${css}\n/* overrides */\n${await readFile(overrides, "utf8")}\n`;
}

/** Stub for theme dir familiarity; unused by the MJS Chart.js pipeline. */
function generateMplstyleStub(tokens) {
  return `# Unused by MJS CLI (Chart.js). Kept for theme-dir familiarity.
# Theme: ${tokens.name}
# Prefer charts/*.mjs for plots.
`;
}

export async function compileTheme(name) {
  const tokens = await loadTheme(name);
  const outDir = themeDir(name);
  await mkdir(outDir, { recursive: true });

  const logoPath = join(outDir, "logo.svg");
  await ensureLogo(logoPath, tokens);
  const logoSvg = await readFile(logoPath, "utf8");
  const brandDir = join(ASSETS_DIR, "brand");
  await mkdir(brandDir, { recursive: true });
  await writeFile(join(brandDir, "logo.svg"), logoSvg);
  const logoUri = logoDataUri(logoSvg);

  const cssPath = join(outDir, "theme.css");
  const mplPath = join(outDir, "plot.mplstyle");
  const mermaidPath = join(outDir, "mermaid.json");

  const cssContent = await mergeOverrides(
    generateCss(tokens, logoUri),
    name,
  );
  await writeFile(cssPath, cssContent);
  await writeFile(mplPath, generateMplstyleStub(tokens));

  const mermaidConfig = {
    theme: tokens.mermaid.theme ?? "base",
    themeVariables: mermaidThemeVariables(tokens),
  };
  await writeFile(mermaidPath, JSON.stringify(mermaidConfig, null, 2));

  return { css: cssPath, mplstyle: mplPath, mermaid: mermaidPath, logo: logoPath };
}
