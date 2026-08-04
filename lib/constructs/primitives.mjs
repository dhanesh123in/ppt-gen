import { hexNoHash, px } from "./theme.mjs";

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

export function line(slide, theme, x1, y1, x2, y2, color = null, width = 1.5) {
  const c = color ?? theme.rule;
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  // pptxgenjs needs a minimum dimension for hairlines
  return slide.addShape("line", {
    x: px(left),
    y: px(top),
    w: px(Math.max(w, 1)),
    h: px(Math.max(h, 1)),
    line: { color: hexNoHash(c), width, beginArrowType: "none", endArrowType: "none" },
  });
}

export function text(slide, theme, value, x, y, w, h, size = 20, opts = {}) {
  return slide.addText(String(value), {
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
  });
}

export function footer(slide, theme, n, label = null) {
  const left = (label ?? theme.footerText ?? "ppt-gen").toUpperCase();
  text(slide, theme, left, 42, 678, 900, 18, 11, {
    color: theme.muted,
    bold: true,
  });
  text(slide, theme, String(n).padStart(2, "0"), 1190, 678, 48, 18, 12, {
    color: theme.muted,
    align: "right",
  });
}

export function title(slide, theme, value, sub, n, label = null) {
  const titleH = String(value).includes("\n") ? 84 : 56;
  text(slide, theme, value, 42, 32, 1160, titleH, 32, { bold: true });
  if (sub) {
    text(slide, theme, sub, 42, 32 + titleH + 2, 1100, 40, 16, {
      color: theme.muted,
    });
  }
  footer(slide, theme, n, label);
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

export function bullet(slide, theme, value, x, y, w, color = null) {
  const c = color ?? theme.ink;
  box(slide, theme, x, y + 9, 7, 7, theme.accent, "none", true);
  text(slide, theme, value, x + 20, y, w - 20, 36, 15, { color: c });
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

export function label(slide, theme, value, x, y, w, color = null) {
  text(slide, theme, String(value).toUpperCase(), x, y, w, 18, 11, {
    color: color ?? theme.muted,
    bold: true,
  });
}

export function newSlide(pptx, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: hexNoHash(theme.bg) };
  return slide;
}
