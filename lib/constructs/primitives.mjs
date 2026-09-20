import { hexNoHash, px } from "./theme.mjs";
import { containRect, imageNaturalSize } from "./image-fit.mjs";
import { titleChromeMetrics } from "./layout-flex.mjs";

export { titleChromeMetrics } from "./layout-flex.mjs";

/**
 * Low-level drawing helpers for pptxgenjs slides (pixel coords → inches).
 */

export function box(slide, theme, x, y, w, h, fill = "none", line = "none", radius = false) {
  const opts = {
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
  };
  if (fill !== "none") {
    opts.fill = { color: hexNoHash(fill) };
  } else {
    opts.fill = { type: "none" };
  }
  if (line !== "none") {
    opts.line = { color: hexNoHash(line), width: 1.25 };
  } else {
    opts.line = { color: hexNoHash(fill !== "none" ? fill : theme.bg), width: 0 };
  }
  if (radius) {
    opts.rectRadius = 0.1;
  }
  return slide.addShape(radius ? "roundRect" : "rect", opts);
}

export function ellipse(slide, theme, x, y, w, h, fill = "none", line = null, transparency = 0) {
  const opts = {
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
    fill:
      fill === "none"
        ? { type: "none" }
        : {
            color: hexNoHash(fill),
            ...(transparency > 0 ? { transparency } : {}),
          },
    line: {
      color: hexNoHash(line ?? theme.rule),
      width: line === "none" ? 0 : 1.5,
    },
  };
  return slide.addShape("ellipse", opts);
}

/** Process chevron (SmartArt-style). Falls back to roundRect if unsupported. */
export function chevronShape(slide, theme, x, y, w, h, fill) {
  const opts = {
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
    fill: { color: hexNoHash(fill) },
    line: { color: hexNoHash(fill), width: 0 },
  };
  try {
    return slide.addShape("chevron", opts);
  } catch {
    return slide.addShape("roundRect", { ...opts, rectRadius: 0.08 });
  }
}

export function line(slide, theme, x1, y1, x2, y2, color = null, width = 1.5) {
  const c = color ?? theme.rule;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Axis-aligned: prefer thin rects (more reliable than pptxgenjs line flips)
  if (Math.abs(dx) < 0.5 || Math.abs(dy) < 0.5) {
    const thick = Math.max(width, 1.5);
    if (Math.abs(dx) < 0.5) {
      return box(
        slide,
        theme,
        x1 - thick / 2,
        Math.min(y1, y2),
        thick,
        Math.max(Math.abs(dy), 1),
        c,
      );
    }
    return box(
      slide,
      theme,
      Math.min(x1, x2),
      y1 - thick / 2,
      Math.max(Math.abs(dx), 1),
      thick,
      c,
    );
  }
  // Diagonal: pptxgenjs lines run top-left→bottom-right of the box; flip when needed
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const opts = {
    x: px(left),
    y: px(top),
    w: px(Math.max(Math.abs(dx), 1)),
    h: px(Math.max(Math.abs(dy), 1)),
    line: { color: hexNoHash(c), width, beginArrowType: "none", endArrowType: "none" },
  };
  // Line from (x1,y1)→(x2,y2): flip when the vector is leftward and/or upward
  if (dx < 0) opts.flipH = true;
  if (dy < 0) opts.flipV = true;
  return slide.addShape("line", opts);
}

export function text(slide, theme, value, x, y, w, h, size = 20, opts = {}) {
  const base = {
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
    fontSize: size,
    fontFace: theme.sans,
    color: hexNoHash(opts.color ?? theme.ink),
    bold: Boolean(opts.bold),
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    margin: 0,
    wrap: opts.wrap !== false,
  };
  const str = String(value ?? "");
  if (str.includes("\n")) {
    const lines = str.split("\n");
    return slide.addText(
      lines.map((line, i) => ({
        text: line,
        options: {
          breakLine: i < lines.length - 1,
          bold: Boolean(opts.bold),
          color: hexNoHash(opts.color ?? theme.ink),
        },
      })),
      base,
    );
  }
  return slide.addText(str, base);
}

function classificationToneColor(theme, tone) {
  const t = String(tone ?? theme.classificationTone ?? "warn").toLowerCase();
  if (t === "muted") return theme.muted;
  if (t === "accent") return theme.accent;
  if (t === "danger" || t === "warn") return theme.coral ?? theme.accent;
  return theme.coral ?? theme.accent;
}

/**
 * Three-part chrome: left deck label · center classification badge · right page.
 * @param {number|string|null} n — page number; omit/blank hides page
 * @param {string|null} label — left footer text
 * @param {{ classification?: string|null }} [opts]
 */
export function footer(slide, theme, n, label = null, opts = {}) {
  const left = (label ?? theme.footerText ?? "ppt-gen").toUpperCase();
  text(slide, theme, left, 42, 678, 520, 18, 11, {
    color: theme.muted,
    bold: true,
  });

  const tag = opts.classification ?? theme.classification ?? null;
  if (tag) {
    const tagText = String(tag).toUpperCase();
    const badgeW = Math.min(280, Math.max(120, tagText.length * 9 + 28));
    const badgeX = (1280 - badgeW) / 2;
    const fill = classificationToneColor(theme, opts.classificationTone);
    box(slide, theme, badgeX, 676, badgeW, 22, fill, "none", true);
    text(slide, theme, tagText, badgeX, 678, badgeW, 18, 10, {
      color: theme.onAccent ?? theme.white,
      bold: true,
      align: "center",
    });
  }

  const pageNum = n === "" || n == null || n === false ? null : Number(n);
  if (pageNum != null && Number.isFinite(pageNum) && pageNum > 0) {
    text(slide, theme, String(pageNum).padStart(2, "0"), 1190, 678, 48, 18, 12, {
      color: theme.muted,
      align: "right",
    });
  }
}

export function title(slide, theme, value, sub, n, label = null, classification = null) {
  const m = titleChromeMetrics(theme, { title: value, subtitle: sub });
  text(slide, theme, value ?? "", 42, m.top, m.titleW, m.titleH, m.titleSize, {
    bold: true,
    valign: "top",
  });
  if (sub) {
    text(
      slide,
      theme,
      sub,
      42,
      m.top + m.titleH + m.titleSubGap,
      m.titleW - 20,
      m.subH,
      m.subSize ?? theme.captionPx ?? 15,
      { color: theme.muted },
    );
  }
  footer(slide, theme, n, label, { classification });
}

export function chip(slide, theme, value, x, y, w, color = null, textColor = null) {
  const fill = color ?? theme.blue;
  box(slide, theme, x, y, w, 30, fill, "none", true);
  text(slide, theme, value, x + 8, y + 6, w - 16, 18, 11, {
    color: textColor ?? theme.chipText ?? theme.onAccent ?? theme.white,
    bold: true,
    align: "center",
  });
}

export function bullet(slide, theme, value, x, y, w, color = null, opts = {}) {
  const c = color ?? theme.ink;
  const h = opts.h ?? 36;
  const font = opts.font ?? Math.min(15, Math.max(11, h - 8));
  const dot = Math.min(7, Math.max(5, Math.floor(h * 0.22)));
  box(slide, theme, x, y + Math.max(4, Math.floor((h - dot) / 2)), dot, dot, theme.accent, "none", true);
  text(slide, theme, value, x + 20, y, w - 20, h, font, { color: c, valign: "mid" });
}

/** Embed a raster/SVG image (pixel coords). */
export function image(slide, theme, path, x, y, w, h) {
  return slide.addImage({
    path,
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
  });
}

/**
 * Place image inside a box without distortion (contain + center).
 * Uses native pixel box matching image aspect (avoids pptxgenjs stretch).
 */
export function imageContain(slide, theme, path, x, y, w, h, natural = null) {
  const size = natural?.width && natural?.height ? natural : imageNaturalSize(path);
  if (!size?.width || !size?.height) {
    return image(slide, theme, path, x, y, w, h);
  }
  const fitted = containRect(size.width, size.height, w, h);
  return image(slide, theme, path, x + fitted.x, y + fitted.y, fitted.w, fitted.h);
}

export { imageNaturalSize, containRect };

export function label(slide, theme, value, x, y, w, color = null) {
  text(slide, theme, String(value).toUpperCase(), x, y, w, 18, 11, {
    color: color ?? theme.muted,
    bold: true,
  });
}

/** Top-right brand mark when theme.logoPath is set. */
export function paintLogo(slide, theme) {
  const path = theme.logoPath;
  if (!path) return null;
  const h = theme.logoHeightPx ?? 44;
  const w = theme.logoWidthPx ?? h;
  const top = theme.logoTopPx ?? 28;
  const right = theme.logoRightPx ?? 36;
  return imageContain(slide, theme, path, 1280 - right - w, top, w, h);
}

export function newSlide(pptx, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: hexNoHash(theme.bg) };
  paintLogo(slide, theme);
  return slide;
}
