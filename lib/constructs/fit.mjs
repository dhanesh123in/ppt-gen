/**
 * Slide fit engine: chrome bands, equal distribute, text measure, autofit, grid.
 * Pixel coordinates on a 1280×720 canvas.
 */

import { titleChromeMetrics, stack, columns, inset, placeBlock, flexAllocate, partitionRegion, normalizeArrangement } from "./layout-flex.mjs";

const SLIDE_W = 1280;
const SLIDE_H = 720;

/** Default spacing scale (px) — overridden by theme.space when present */
export const DEFAULT_SPACE = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  contentPad: 42,
  cardGap: 20,
  minCardH: 120,
  titleBand: 72,
  footerBand: 48,
  minFont: 11,
  maxFont: 18,
  maxCols: 4,
};

export function spaceFromTheme(theme) {
  const s = theme.space ?? theme.tokens?.raw?.space ?? {};
  return { ...DEFAULT_SPACE, ...s };
}

/**
 * Content region below title/subtitle and above footer.
 */
export function contentBox(theme, data = {}) {
  const space = spaceFromTheme(theme);
  const pad = space.contentPad;
  const band = titleChromeMetrics(theme, data).band;
  return {
    x: pad,
    y: band,
    w: SLIDE_W - pad * 2,
    h: SLIDE_H - band - space.footerBand - 8,
    slideW: SLIDE_W,
    slideH: SLIDE_H,
  };
}

/** Equal columns across width with gap. */
export function distributeRow(region, n, gap) {
  if (n <= 0) return [];
  const g = gap ?? 16;
  const colW = Math.floor((region.w - g * (n - 1)) / n);
  return Array.from({ length: n }, (_, i) => ({
    x: region.x + i * (colW + g),
    y: region.y,
    w: colW,
    h: region.h,
  }));
}

/** Equal rows stacked with gap. */
export function distributeCol(region, n, gap) {
  if (n <= 0) return [];
  const g = gap ?? 16;
  const rowH = Math.floor((region.h - g * (n - 1)) / n);
  return Array.from({ length: n }, (_, i) => ({
    x: region.x,
    y: region.y + i * (rowH + g),
    w: region.w,
    h: rowH,
  }));
}

/** Split region into left/right with gap and optional leftFrac (default 0.45). */
export function splitPane(region, gap = 24, leftFrac = 0.45) {
  const leftW = Math.floor(region.w * leftFrac);
  const rightW = region.w - leftW - gap;
  return {
    left: { x: region.x, y: region.y, w: leftW, h: region.h },
    right: { x: region.x + leftW + gap, y: region.y, w: rightW, h: region.h },
  };
}

/**
 * Heuristic text height (px) for wrapping at `width` with fontSize.
 * Avoids canvas dependency for place(); good enough for autofit.
 */
export function measureTextHeight(text, width, fontSize, { lineHeight = 1.35 } = {}) {
  const str = String(text ?? "");
  if (!str || width <= 0) return 0;
  const avgChar = fontSize * 0.52;
  const charsPerLine = Math.max(1, Math.floor(width / avgChar));
  const paragraphs = str.split(/\n/);
  let lines = 0;
  for (const p of paragraphs) {
    if (!p) {
      lines += 1;
      continue;
    }
    lines += Math.max(1, Math.ceil(p.length / charsPerLine));
  }
  return Math.ceil(lines * fontSize * lineHeight);
}

/**
 * Binary-search largest font that fits text in box height.
 */
export function autofitFont(text, boxW, boxH, { minFont = 11, maxFont = 18, pad = 16 } = {}) {
  const innerW = Math.max(8, boxW - pad * 2);
  const innerH = Math.max(8, boxH - pad * 2);
  let lo = minFont;
  let hi = maxFont;
  let best = minFont;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const h = measureTextHeight(text, innerW, mid);
    if (h <= innerH) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/** Uniform font across siblings (SmartArt-style). */
export function uniformFont(sizes) {
  if (!sizes.length) return 14;
  return Math.min(...sizes);
}

/**
 * Choose cols/rows for n items (snake/grid).
 */
export function chooseGrid(n, { maxCols = 4, preferCols = null } = {}) {
  if (n <= 0) return { cols: 1, rows: 1 };
  if (preferCols) {
    const cols = Math.min(preferCols, n, maxCols);
    return { cols, rows: Math.ceil(n / cols) };
  }
  if (n <= maxCols) return { cols: n, rows: 1 };
  const cols = Math.min(maxCols, Math.ceil(Math.sqrt(n)));
  return { cols, rows: Math.ceil(n / cols) };
}

/**
 * Fit items into a grid of cards with autofit + uniform font.
 * @returns {Array<{x,y,w,h,font,item,index}>}
 */
export function fitGrid(region, items, opts = {}) {
  const list = items ?? [];
  const n = list.length;
  if (!n) return [];
  const gap = opts.minGap ?? opts.gap ?? 20;
  const maxCols = opts.maxCols ?? 4;
  const minFont = opts.minFont ?? 12;
  const maxFont = opts.maxFont ?? 18;
  const pad = opts.pad ?? 16;
  const { cols, rows } = chooseGrid(n, { maxCols, preferCols: opts.preferCols });
  const cellW = Math.floor((region.w - gap * (cols - 1)) / cols);
  const cellH = Math.floor((region.h - gap * (rows - 1)) / rows);

  const sizes = list.map((item) => {
    const text = [item.label, item.detail, ...(item.outputs ?? []), ...(item.bullets ?? [])]
      .filter(Boolean)
      .join("\n");
    return autofitFont(text, cellW, cellH, { minFont, maxFont, pad });
  });
  const font = opts.uniformFont === false ? null : uniformFont(sizes);

  return list.map((item, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return {
      x: region.x + c * (cellW + gap),
      y: region.y + r * (cellH + gap),
      w: cellW,
      h: cellH,
      font: font ?? sizes[i],
      item,
      index: i,
    };
  });
}

/**
 * Build a fit context bound to theme + slide data.
 * @param {{ contentRegion?: {x,y,w,h}|null }} [opts] — when set, contentBox() returns this (nested/compose)
 */
export function createFitContext(theme, data = {}, opts = {}) {
  const space = spaceFromTheme(theme);
  const override = opts.contentRegion ?? null;
  return {
    theme,
    data,
    space,
    contentBox: () => override ?? contentBox(theme, data),
    distributeRow,
    distributeCol,
    splitPane,
    measureTextHeight,
    autofitFont,
    uniformFont,
    chooseGrid,
    stack,
    columns,
    inset,
    placeBlock,
    flexAllocate,
    partitionRegion,
    normalizeArrangement,
    fitGrid: (region, items, opts) =>
      fitGrid(region, items, {
        minGap: space.cardGap,
        minFont: space.minFont,
        maxFont: space.maxFont,
        maxCols: space.maxCols,
        ...opts,
      }),
  };
}
