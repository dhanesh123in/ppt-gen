import { loadTheme } from "../theme/tokens.mjs";

/** Slide geometry in inches for pptxgenjs (16:9 @ 1280×720 → 13.333×7.5). */
export const SLIDE_W_IN = 13.333;
export const SLIDE_H_IN = 7.5;
export const PX_PER_IN = 96; // 1280/13.333 ≈ 96

export function px(n) {
  return n / PX_PER_IN;
}

/**
 * Map scientific tokens into construct theme colors / type.
 * Elevates panels on dark backgrounds so cards read like the reference deck.
 */
export async function loadConstructTheme(name = "scientific") {
  const tokens = await loadTheme(name);
  const series = tokens.seriesColors;
  const dark = tokens.variant === "dark";
  const bg = tokens.facecolor;
  const border = tokens.colors.border ?? "#3a3a5c";

  return {
    tokens,
    name: tokens.name,
    dark,
    W: SLIDE_W_IN,
    H: SLIDE_H_IN,
    bg,
    ink: tokens.foreground,
    muted: tokens.colors.muted ?? "#6c6c8a",
    // Elevated surfaces (reference uses light-grey cards on white)
    panel: dark ? "#2b2b4a" : "#E9EDF1",
    panelSoft: dark ? "#23233c" : "#F3F5F7",
    panelAlt: dark ? "#1f1f36" : "#FFFFFF",
    rule: border,
    accent: tokens.colors.accent,
    series,
    blue: series[0] ?? tokens.colors.accent,
    coral: tokens.colors.accent,
    lime: series[4] ?? series[3] ?? "#59a14f",
    cyan: series[3] ?? series[1] ?? "#76b7b2",
    orange: series[1] ?? "#f28e2b",
    white: "#FFFFFF",
    onAccent: "#FFFFFF",
    chipText: "#FFFFFF",
    sans: tokens.typography.sans.split(",")[0].trim().replace(/^"|"$/g, ""),
    titlePx: tokens.typography.slide.title_px,
    headingPx: tokens.typography.slide.heading_px,
    bodyPx: tokens.typography.slide.body_px,
    captionPx: tokens.typography.slide.caption_px,
    footerText: tokens.raw.branding?.footer ?? "",
  };
}

export function hexNoHash(color) {
  return String(color).replace(/^#/, "");
}
