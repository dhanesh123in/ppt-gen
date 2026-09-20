/**
 * Flex-like 1D layout for slide regions (px).
 *
 * Tracks declare preferred size (basis), clamps (min/max), and grow/shrink
 * weights. Remaining free space is distributed proportionally — same idea as
 * CSS flex, but for PowerPoint place() math without a DOM.
 */

/**
 * @typedef {{
 *   id?: string,
 *   basis?: number,
 *   min?: number,
 *   max?: number,
 *   grow?: number,
 *   shrink?: number,
 * }} FlexTrack
 */

/**
 * Allocate `total` px across tracks with gap between them.
 * @param {number} total
 * @param {FlexTrack[]} tracks
 * @param {{ gap?: number }} [opts]
 * @returns {{ id: string|number, offset: number, size: number }[]}
 */
export function flexAllocate(total, tracks, { gap = 0 } = {}) {
  const list = (tracks ?? []).filter(Boolean);
  const n = list.length;
  if (n === 0) return [];
  const gaps = gap * Math.max(0, n - 1);
  const inner = Math.max(0, total - gaps);

  const resolved = list.map((t, i) => {
    const min = Math.max(0, t.min ?? 0);
    const max = t.max == null ? Infinity : Math.max(min, t.max);
    let size = clamp(t.basis ?? min, min, max);
    return {
      id: t.id ?? i,
      min,
      max,
      grow: Math.max(0, t.grow ?? 0),
      shrink: Math.max(0, t.shrink ?? 1),
      size,
    };
  });

  let used = resolved.reduce((s, t) => s + t.size, 0);
  let free = inner - used;

  if (free > 0) {
    const growSum = resolved.reduce((s, t) => s + t.grow, 0);
    if (growSum > 0) {
      // Iterative grow with max clamps
      let remaining = free;
      let guard = 0;
      while (remaining > 0.5 && guard++ < 8) {
        const growers = resolved.filter((t) => t.grow > 0 && t.size < t.max);
        const gSum = growers.reduce((s, t) => s + t.grow, 0);
        if (!gSum) break;
        let consumed = 0;
        for (const t of growers) {
          const share = (remaining * t.grow) / gSum;
          const next = Math.min(t.max, t.size + share);
          consumed += next - t.size;
          t.size = next;
        }
        remaining -= consumed;
        if (consumed < 0.5) break;
      }
    }
  } else if (free < 0) {
    let remaining = -free;
    let guard = 0;
    while (remaining > 0.5 && guard++ < 8) {
      const shrinkers = resolved.filter((t) => t.shrink > 0 && t.size > t.min);
      const sSum = shrinkers.reduce((s, t) => s + t.shrink, 0);
      if (!sSum) break;
      let consumed = 0;
      for (const t of shrinkers) {
        const share = (remaining * t.shrink) / sSum;
        const next = Math.max(t.min, t.size - share);
        consumed += t.size - next;
        t.size = next;
      }
      remaining -= consumed;
      if (consumed < 0.5) break;
    }
  }

  // Snap to integers. Leftover space (when tracks hit max) is intentionally
  // left for stack()'s justify:center|end — do NOT dump it into the last track.
  let offset = 0;
  const out = resolved.map((t, i) => {
    const size = Math.round(t.size);
    const row = { id: t.id, offset, size };
    offset += size + (i < resolved.length - 1 ? gap : 0);
    return row;
  });
  return out;
}

/**
 * Stack tracks inside a region (column = vertical, row = horizontal).
 * @param {{ x:number, y:number, w:number, h:number }} region
 * @param {FlexTrack[]} tracks
 * @param {{
 *   direction?: 'column'|'row',
 *   gap?: number,
 *   justify?: 'start'|'center'|'end',
 * }} [opts]
 * @returns {Record<string, { x:number, y:number, w:number, h:number }>}
 */
export function stack(region, tracks, opts = {}) {
  const direction = opts.direction ?? "column";
  const gap = opts.gap ?? 12;
  const justify = opts.justify ?? "start";
  const main = direction === "column" ? region.h : region.w;
  const alloc = flexAllocate(main, tracks, { gap });

  const used =
    alloc.reduce((s, a) => s + a.size, 0) + gap * Math.max(0, alloc.length - 1);
  let origin = 0;
  if (justify === "center") origin = Math.max(0, Math.round((main - used) / 2));
  else if (justify === "end") origin = Math.max(0, Math.round(main - used));

  /** @type {Record<string, { x:number, y:number, w:number, h:number }>} */
  const boxes = {};
  for (const a of alloc) {
    if (direction === "column") {
      boxes[String(a.id)] = {
        x: region.x,
        y: region.y + origin + a.offset,
        w: region.w,
        h: a.size,
      };
    } else {
      boxes[String(a.id)] = {
        x: region.x + origin + a.offset,
        y: region.y,
        w: a.size,
        h: region.h,
      };
    }
  }
  return boxes;
}

/** Inset a rect by padding (number or {t,r,b,l}). */
export function inset(rect, pad = 0) {
  const p =
    typeof pad === "number"
      ? { t: pad, r: pad, b: pad, l: pad }
      : { t: 0, r: 0, b: 0, l: 0, ...pad };
  return {
    x: rect.x + p.l,
    y: rect.y + p.t,
    w: Math.max(0, rect.w - p.l - p.r),
    h: Math.max(0, rect.h - p.t - p.b),
  };
}

/**
 * Place a fixed-size block inside a region.
 * @param {'start'|'center'|'end'} [alignX]
 * @param {'start'|'center'|'end'} [alignY]
 */
export function placeBlock(region, w, h, { alignX = "center", alignY = "center" } = {}) {
  const x =
    alignX === "start"
      ? region.x
      : alignX === "end"
        ? region.x + region.w - w
        : region.x + Math.round((region.w - w) / 2);
  const y =
    alignY === "start"
      ? region.y
      : alignY === "end"
        ? region.y + region.h - h
        : region.y + Math.round((region.h - h) / 2);
  return { x, y, w, h };
}

/**
 * Split a row into n equal columns with gap (flex grow equal).
 */
export function columns(region, n, { gap = 12 } = {}) {
  if (n <= 0) return [];
  const tracks = Array.from({ length: n }, (_, i) => ({
    id: i,
    basis: Math.floor(region.w / n),
    min: 40,
    grow: 1,
    shrink: 1,
  }));
  const boxed = stack(region, tracks, { direction: "row", gap, justify: "start" });
  return Array.from({ length: n }, (_, i) => boxed[String(i)]);
}

/**
 * Title / subtitle chrome metrics — responsive to line count + font size.
 * Gap between title and subtitle scales with type size (never a flat 4px).
 */
export function titleChromeMetrics(theme, data = {}) {
  const raw = String(data.title ?? "").replace(/\n+$/, "");
  const lineCount = Math.max(1, raw.split(/\n/).length);
  const hasSub = Boolean(data.subtitle);
  const titleSize = theme.headingPx ? Math.min(30, theme.headingPx) : 28;
  const subSize = theme.captionPx ?? 15;
  const lineH = Math.round(titleSize * 1.2);
  const top = 26;
  const titleH = lineCount > 1 ? lineH * lineCount : Math.max(38, lineH + 4);
  // Breath between title block and subtitle — proportional to type
  const titleSubGap = hasSub ? Math.max(18, Math.round(titleSize * 0.55)) : 0;
  const subH = hasSub
    ? Math.max(28, measureLineHeight(String(data.subtitle), 1100, subSize))
    : 0;
  const gapAfter = Math.max(16, Math.round((theme.space?.md ?? 16)));
  const logoW = theme.logoPath
    ? (theme.logoWidthPx ?? 44) + (theme.logoRightPx ?? 36) + 20
    : 56;

  const band = top + titleH + titleSubGap + subH + gapAfter;
  return {
    top,
    titleH,
    titleSize,
    titleSubGap,
    subH,
    subSize,
    gapAfter,
    band,
    titleW: 1280 - 42 - logoW,
    hasSub,
  };
}

function measureLineHeight(text, width, fontSize) {
  const str = String(text ?? "");
  if (!str) return Math.round(fontSize * 1.35);
  const avgChar = fontSize * 0.52;
  const charsPerLine = Math.max(1, Math.floor(width / avgChar));
  const lines = Math.max(1, Math.ceil(str.length / charsPerLine));
  return Math.ceil(lines * fontSize * 1.35);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Partition a region into `n` cells for compose arrangements.
 * @param {'cols-2'|'cols-3'|'rows-2'|'rows-3'|'grid-2x2'|'main-side'|'side-main'|'header-body'} arrangement
 * @returns {{ x:number, y:number, w:number, h:number }[]}
 */
export function partitionRegion(region, arrangement, n, { gap = 16 } = {}) {
  const key = normalizeArrangement(arrangement, n);
  const g = gap;

  if (key === "cols-2" || key === "cols-3") {
    const cols = key === "cols-3" ? 3 : 2;
    const count = Math.min(n, cols);
    return equalSplit(region, count, "row", g);
  }
  if (key === "rows-2" || key === "rows-3") {
    const rows = key === "rows-3" ? 3 : 2;
    const count = Math.min(n, rows);
    return equalSplit(region, count, "col", g);
  }
  if (key === "grid-2x2") {
    const count = Math.min(n, 4);
    const cellW = Math.floor((region.w - g) / 2);
    const cellH = Math.floor((region.h - g) / 2);
    const cells = [];
    for (let i = 0; i < count; i++) {
      const c = i % 2;
      const r = Math.floor(i / 2);
      cells.push({
        x: region.x + c * (cellW + g),
        y: region.y + r * (cellH + g),
        w: cellW,
        h: cellH,
      });
    }
    return cells;
  }
  if (key === "main-side" || key === "side-main") {
    const mainFrac = 0.58;
    const mainW = Math.floor(region.w * mainFrac);
    const sideW = region.w - mainW - g;
    const mainLeft = key === "main-side";
    const main = {
      x: mainLeft ? region.x : region.x + sideW + g,
      y: region.y,
      w: mainW,
      h: region.h,
    };
    const sideBox = {
      x: mainLeft ? region.x + mainW + g : region.x,
      y: region.y,
      w: sideW,
      h: region.h,
    };
    if (n <= 1) return [main];
    if (n === 2) {
      const side = { ...sideBox };
      return [main, side];
    }
    // 3+: slot 0 = main; remaining stacked in the side column
    const sideCount = n - 1;
    const sideCells = equalSplit(sideBox, sideCount, "col", g);
    return [main, ...sideCells];
  }
  if (key === "header-body") {
    if (n <= 1) return [{ ...region }];
    const headerH = Math.floor(region.h * 0.34);
    const bodyH = region.h - headerH - g;
    const header = { x: region.x, y: region.y, w: region.w, h: headerH };
    const body = { x: region.x, y: region.y + headerH + g, w: region.w, h: bodyH };
    if (n === 2) return [header, body];
    const bodyCells = equalSplit(body, n - 1, "row", g);
    return [header, ...bodyCells];
  }
  // fallback
  return equalSplit(region, Math.max(n, 1), "row", g);
}

function equalSplit(region, count, direction, gap) {
  const n = Math.max(count, 1);
  if (direction === "row") {
    const w = Math.floor((region.w - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => ({
      x: region.x + i * (w + gap),
      y: region.y,
      w,
      h: region.h,
    }));
  }
  const h = Math.floor((region.h - gap * (n - 1)) / n);
  return Array.from({ length: n }, (_, i) => ({
    x: region.x,
    y: region.y + i * (h + gap),
    w: region.w,
    h,
  }));
}

/** Map aliases → canonical arrangement id */
export function normalizeArrangement(raw, n = 2) {
  const s = String(raw ?? "").toLowerCase().trim();
  const aliases = {
    "cols-2": "cols-2",
    cols2: "cols-2",
    "row-2": "cols-2",
    row2: "cols-2",
    horizontal: "cols-2",
    "side-by-side": "cols-2",
    sbs: "cols-2",
    "cols-3": "cols-3",
    cols3: "cols-3",
    "row-3": "cols-3",
    horizontal3: "cols-3",
    "rows-2": "rows-2",
    rows2: "rows-2",
    "col-2": "rows-2",
    col2: "rows-2",
    vertical: "rows-2",
    stacked: "rows-2",
    "rows-3": "rows-3",
    rows3: "rows-3",
    "col-3": "rows-3",
    "grid-2x2": "grid-2x2",
    grid2x2: "grid-2x2",
    "2x2": "grid-2x2",
    quad: "grid-2x2",
    "main-side": "main-side",
    mainside: "main-side",
    "main-right": "main-side",
    "side-main": "side-main",
    sidemain: "side-main",
    "main-left": "side-main",
    "header-body": "header-body",
    headerbody: "header-body",
    "top-bottom": "header-body",
  };
  if (aliases[s]) return aliases[s];
  if (!s) {
    if (n <= 2) return "cols-2";
    if (n === 3) return "cols-3";
    return "grid-2x2";
  }
  return aliases[s] ?? "cols-2";
}
