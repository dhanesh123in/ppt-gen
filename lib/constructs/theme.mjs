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
      maxFont: 18,
      maxCols: 4,
      ...(raw.space ?? {}),
      ...(overrides.space ?? {}),
    },
  };
}

export function hexNoHash(color) {
  return String(color).replace(/^#/, "");
}
