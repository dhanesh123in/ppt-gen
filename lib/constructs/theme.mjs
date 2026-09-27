import { existsSync } from "node:fs";
import { join } from "node:path";

import { resolveLogoSource } from "../brand.mjs";
import { themeDir } from "../paths.mjs";
import { loadTheme } from "../theme/tokens.mjs";
import { resolveAssetPath } from "./assets.mjs";

/** Slide geometry in inches for pptxgenjs (16:9 @ 1280×720 → 13.333×7.5). */
export const SLIDE_W_IN = 13.333;
export const SLIDE_H_IN = 7.5;
export const PX_PER_IN = 96; // 1280/13.333 ≈ 96

export function px(n) {
  return n / PX_PER_IN;
}

function deepMerge(base, over) {
  if (!over || typeof over !== "object") return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") {
      out[k] = deepMerge(base[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

const TOKEN_REF = /^\{([a-zA-Z0-9_.]+)\}$/;

/** Resolve `{colors.series.0}`-style refs against a raw tokens object. */
export function resolveTokenRef(raw, value) {
  if (typeof value !== "string") return value == null ? "" : String(value);
  const match = TOKEN_REF.exec(value.trim());
  if (!match) return value;
  const parts = match[1].split(".");
  let node = raw;
  for (const part of parts) {
    if (node == null) return value;
    node = /^\d+$/.test(part) ? node[Number(part)] : node[part];
  }
  return node == null ? value : String(node);
}

/** Pick light or dark ink for readable text on a fill. */
export function contrastInk(bg, light = "#FFFFFF", dark = "#131722") {
  const h = String(bg ?? "#000000").replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padStart(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return light;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.55 ? dark : light;
}

async function resolveConstructLogo(tokens, overrides = {}) {
  const branding = deepMerge(tokens.raw?.branding ?? {}, overrides.branding ?? {});
  const logoOverride = overrides.logo ?? branding.logo ?? branding.logo_path ?? null;
  const source = await resolveLogoSource(
    { ...tokens, raw: { ...tokens.raw, branding } },
    { logoOverride },
  );
  if (source.path) return source.path;
  if (!source.generated) return null;
  for (const ext of [".svg", ".png", ".jpg", ".jpeg", ".webp"]) {
    const p = join(themeDir(tokens.name), `logo${ext}`);
    if (existsSync(p)) return p;
  }
  return resolveAssetPath("logo.svg", { themeName: tokens.name });
}

/**
 * Map theme tokens into construct colors / type.
 * @param {string} name
 * @param {object} [overrides] — frontmatter colors/typography/space/variant/logo/branding
 */
export async function loadConstructTheme(name = "scientific", overrides = {}) {
  const tokens = await loadTheme(name);
  const raw = deepMerge(tokens.raw, {
    colors: overrides.colors,
    typography: overrides.typography,
    space: overrides.space,
    table: overrides.table,
    plot: overrides.plot,
    variant: overrides.variant,
    branding: overrides.branding,
  });
  const colors = raw.colors ?? tokens.colors;
  const series = colors.series ?? tokens.seriesColors;
  const dark = (overrides.variant ?? raw.variant ?? tokens.variant) === "dark";
  const bg = colors.background ?? tokens.facecolor;
  const fg = colors.foreground ?? tokens.foreground;
  const border = colors.border ?? "#3a3a5c";
  const typography = raw.typography ?? tokens.typography;
  const tableTok = raw.table ?? {};
  const tableHeaderBg =
    resolveTokenRef(raw, tableTok.header_bg) ||
    series[0] ||
    colors.accent ||
    "#4e79a7";
  const tableZebraBg =
    resolveTokenRef(raw, tableTok.zebra_bg) || border;
  const tableHeaderFg =
    resolveTokenRef(raw, tableTok.header_fg) ||
    contrastInk(tableHeaderBg, colors.onAccent ?? "#FFFFFF", fg);
  const sansFace = String(typography.sans ?? "Helvetica Neue")
    .split(",")[0]
    .trim()
    .replace(/^"|"$/g, "");
  const branding = raw.branding ?? tokens.raw.branding ?? {};
  const logoPath = await resolveConstructLogo(tokens, {
    logo: overrides.logo,
    branding,
  });
  const classification =
    overrides.classification ??
    branding.classification ??
    branding.tag ??
    null;
  const classificationTone =
    overrides.classificationTone ??
    overrides.classification_tone ??
    branding.classification_tone ??
    branding.classificationTone ??
    "warn";

  return {
    tokens,
    name: tokens.name,
    dark,
    W: SLIDE_W_IN,
    H: SLIDE_H_IN,
    bg,
    ink: fg,
    muted: colors.muted ?? "#6c6c8a",
    panel: colors.panel ?? (dark ? "#2b2b4a" : "#E9EDF1"),
    panelSoft: colors.panelSoft ?? (dark ? "#23233c" : "#F3F5F7"),
    panelAlt: colors.panelAlt ?? (dark ? "#1f1f36" : "#FFFFFF"),
    rule: border,
    accent: colors.accent ?? tokens.colors.accent,
    series,
    blue: series[0] ?? colors.accent,
    coral: colors.accent ?? series[2],
    lime: series[4] ?? series[3] ?? "#59a14f",
    cyan: series[3] ?? series[1] ?? "#76b7b2",
    orange: series[1] ?? "#f28e2b",
    white: "#FFFFFF",
    onAccent: colors.onAccent ?? "#FFFFFF",
    chipText: colors.chipText ?? "#FFFFFF",
    tableHeaderBg,
    tableHeaderFg,
    tableZebraBg,
    sans: sansFace,
    titlePx: typography.slide?.title_px ?? 44,
    headingPx: typography.slide?.heading_px ?? 32,
    bodyPx: typography.slide?.body_px ?? 22,
    captionPx: typography.slide?.caption_px ?? 16,
    footerText: branding.footer ?? "",
    classification: classification ? String(classification) : null,
    classificationTone: String(classificationTone),
    logoPath,
    logoHeightPx: Number(
      overrides.logoHeight ??
        overrides.logo_height_px ??
        branding.logo_height_px ??
        44,
    ),
    logoWidthPx: Number(
      overrides.logoWidth ??
        overrides.logo_width_px ??
        branding.logo_width_px ??
        branding.logo_height_px ??
        44,
    ),
    logoTopPx: Number(
      overrides.logoTop ?? overrides.logo_top_px ?? branding.logo_top_px ?? 28,
    ),
    logoRightPx: Number(
      overrides.logoRight ??
        overrides.logo_right_px ??
        branding.logo_right_px ??
        36,
    ),
    space: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
      contentPad: 42,
      cardGap: 20,
      minCardH: 120,
      titleBand: 100,
      footerBand: 48,
      minFont: 12,
      maxFont: 22,
      maxCols: 4,
      titleSubGap: 28,
      gapAfterChrome: 20,
      coverTitleSubGap: 36,
      coverSubChipGap: 36,
      ...(raw.space ?? {}),
      ...(overrides.space ?? {}),
    },
  };
}

export function hexNoHash(color) {
  return String(color).replace(/^#/, "");
}
