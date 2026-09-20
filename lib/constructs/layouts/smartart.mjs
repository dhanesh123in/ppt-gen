/**
 * SmartArt-style consulting / process layouts (mjs templates).
 * Placement uses the flex stack helpers on ctx.fit (layout-flex).
 */
import {
  box,
  chevronShape,
  ellipse,
  label,
  text,
  title,
} from "../primitives.mjs";
import { registerLayout } from "../registry.mjs";

const itemsOf = (data) => data.items ?? data.bullets ?? [];
const valueOf = (item) =>
  typeof item === "string" ? item : item?.label ?? item?.h ?? item?.name ?? "";
const detailOf = (item) =>
  typeof item === "string" ? "" : item?.detail ?? item?.d ?? item?.focus ?? "";
const colorOf = (theme, index, fallback = theme.accent) => {
  const series = theme.series ?? [];
  return series.length ? series[index % series.length] : fallback;
};
const chrome = (slide, theme, data, page) => {
  if (data?._suppressChrome) return;
  title(
    slide,
    theme,
    data.title ?? "",
    data.subtitle,
    page ?? 1,
    data.footerLabel,
    data.classification,
  );
};

/** Caption card under a shape: detail when label is already on the shape */
function captionUnder(slide, theme, boxRect, item, accent = null, { labelInShape = false } = {}) {
  const pad = 10;
  box(slide, theme, boxRect.x, boxRect.y, boxRect.w, boxRect.h, theme.panel, "none", true);
  if (accent) {
    box(slide, theme, boxRect.x, boxRect.y, 5, boxRect.h, accent);
  }
  if (labelInShape) {
    const body = detailOf(item) || valueOf(item);
    text(slide, theme, body, boxRect.x + pad + 4, boxRect.y + 10, boxRect.w - pad * 2 - 4, boxRect.h - 20, 13, {
      color: theme.muted,
      valign: "mid",
    });
    return;
  }
  text(slide, theme, valueOf(item), boxRect.x + pad + 4, boxRect.y + 10, boxRect.w - pad * 2 - 4, 24, 14, {
    bold: true,
    valign: "mid",
  });
  if (detailOf(item)) {
    text(
      slide,
      theme,
      detailOf(item),
      boxRect.x + pad + 4,
      boxRect.y + 36,
      boxRect.w - pad * 2 - 4,
      Math.max(20, boxRect.h - 46),
      12,
      { color: theme.muted },
    );
  }
}

/** Process chevrons — compact shape row + caption cards (flex stack) */
registerLayout("chevron", {
  aliases: ["process", "processChevron"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const n = Math.min(Math.max(itemsOf(ctx.data).length, 1), 5);
    const gap = ctx.space.sm ?? 12;
    const nested = ctx.fit.nested || ctx.data._suppressChrome;
    const justify = resolvePanelAlign(ctx.data, nested);
    const hasCaptions = itemsOf(ctx.data).some((item) => Boolean(detailOf(item)));
    if (!hasCaptions) {
      const bands = ctx.fit.stack(
        region,
        [{ id: "shapes", basis: 96, min: 72, max: 120, grow: 0, shrink: 1 }],
        { gap: 0, justify },
      );
      return {
        region,
        cards: ctx.fit.distributeRow(bands.shapes, n, gap),
        captions: [],
        bands,
      };
    }
    // Prefer modest chevrons; captions absorb leftover height
    const bands = ctx.fit.stack(
      region,
      [
        { id: "shapes", basis: 84, min: 64, max: 96, grow: 0, shrink: 1 },
        { id: "captions", basis: 88, min: 68, max: 140, grow: 1, shrink: 1 },
      ],
      { gap: 16, justify },
    );
    const cards = ctx.fit.distributeRow(bands.shapes, n, gap);
    const captions = ctx.fit.distributeRow(bands.captions, n, gap);
    return { region, cards, captions, bands };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const items = itemsOf(data);
    const showCaptions =
      Boolean(boxes.captions?.length) &&
      items.some((item) => Boolean(detailOf(item)));
    boxes.cards.forEach((card, i) => {
      const item = items[i] ?? {};
      const fill = item.color ?? colorOf(theme, i);
      chevronShape(slide, theme, card.x, card.y, card.w, card.h, fill);
      const insetL = Math.min(28, Math.max(12, Math.floor(card.w * 0.12)));
      const insetR = Math.min(44, Math.max(18, Math.floor(card.w * 0.18)));
      const font = card.w < 120 ? 11 : 14;
      text(
        slide,
        theme,
        valueOf(item),
        card.x + insetL,
        card.y,
        Math.max(40, card.w - insetL - insetR),
        card.h,
        font,
        {
          bold: true,
          color: theme.onAccent,
          align: "center",
          valign: "mid",
        },
      );
      if (showCaptions && boxes.captions?.[i] && detailOf(item)) {
        captionUnder(slide, theme, boxes.captions[i], item, fill, { labelInShape: true });
      }
    });
  },
});

/** start | center | end — nested defaults to start so compose panels share a top edge */
function resolvePanelAlign(data, nested) {
  const raw = data?.align ?? data?.vAlign ?? data?.alignY ?? data?.justify;
  if (raw != null && raw !== "") {
    const s = String(raw).toLowerCase();
    if (s === "middle" || s === "center" || s === "mid") return "center";
    if (s === "end" || s === "bottom") return "end";
    return "start";
  }
  return nested ? "start" : "center";
}

/** Ascending stair / maturity — compact copy near top of each step */
registerLayout("stair", {
  aliases: ["staircase", "ascending", "maturity"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const items = itemsOf(ctx.data).slice(0, 5);
    const n = Math.max(items.length, 1);
    const gap = 14;
    const colW = Math.floor((region.w - gap * (n - 1)) / n);
    const maxH = region.h - 4;
    const minH = Math.round(maxH * 0.48);
    const cards = items.map((item, i) => {
      const t = n === 1 ? 1 : i / (n - 1);
      const h = Math.round(minH + (maxH - minH) * t);
      return {
        x: region.x + i * (colW + gap),
        y: region.y + region.h - h,
        w: colW,
        h,
        item,
        index: i,
      };
    });
    return { region, cards };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.cards.forEach((card, i) => {
      const accent = card.item?.color ?? colorOf(theme, i);
      box(slide, theme, card.x, card.y, card.w, card.h, theme.panel, "none", true);
      box(slide, theme, card.x, card.y, card.w, 8, accent);
      text(slide, theme, String(i + 1), card.x + 14, card.y + 16, 36, 26, 18, {
        bold: true,
        color: accent,
      });
      text(slide, theme, valueOf(card.item), card.x + 14, card.y + 46, card.w - 28, 40, 15, {
        bold: true,
      });
      if (detailOf(card.item)) {
        text(
          slide,
          theme,
          detailOf(card.item),
          card.x + 14,
          card.y + 90,
          card.w - 28,
          48,
          12,
          { color: theme.muted },
        );
      }
    });
  },
});

/**
 * Two-set Venn — circles sized to region; labels stay in exclusive lobes
 * (never the overlap lens). Details live in caption row underneath.
 */
registerLayout("venn-2", {
  aliases: ["venn", "overlap"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const bands = ctx.fit.stack(
      region,
      [
        { id: "diagram", basis: 320, min: 220, max: 380, grow: 1, shrink: 1 },
        { id: "captions", basis: 78, min: 64, max: 110, grow: 0, shrink: 1 },
      ],
      { gap: 18, justify: "center" },
    );
    const diagram = bands.diagram;
    // Diameter scales with both width and height; keep overlap readable
    const d = Math.min(260, diagram.h - 8, Math.floor(diagram.w * 0.34));
    const overlap = Math.round(d * 0.38);
    const span = d * 2 - overlap;
    const mid = diagram.x + diagram.w / 2;
    const leftX = mid - span / 2;
    const cy = diagram.y + Math.round((diagram.h - d) / 2);
    const left = { x: leftX, y: cy, w: d, h: d };
    const right = { x: leftX + d - overlap, y: cy, w: d, h: d };
    // Exclusive lobes (outside the lens) for labels
    const lobeW = Math.round(d * 0.42);
    const labels = {
      left: {
        x: left.x + Math.round(d * 0.06),
        y: left.y + Math.round(d * 0.28),
        w: lobeW,
        h: Math.round(d * 0.36),
      },
      right: {
        x: right.x + d - lobeW - Math.round(d * 0.06),
        y: right.y + Math.round(d * 0.28),
        w: lobeW,
        h: Math.round(d * 0.36),
      },
      overlap: {
        x: mid - Math.round(d * 0.22),
        y: cy + Math.round(d * 0.34),
        w: Math.round(d * 0.44),
        h: Math.round(d * 0.28),
      },
    };
    const caps = ctx.fit.columns(bands.captions, 3, { gap: 12 });
    return { region, left, right, labels, captions: caps, bands };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const items = itemsOf(data);
    const left = data.left ?? items[0] ?? { label: "A" };
    const right = data.right ?? items[1] ?? { label: "B" };
    const overlap = data.overlap ?? data.center ?? items[2] ?? { label: "AND" };

    ellipse(slide, theme, boxes.left.x, boxes.left.y, boxes.left.w, boxes.left.h, theme.blue, theme.blue, 55);
    ellipse(slide, theme, boxes.right.x, boxes.right.y, boxes.right.w, boxes.right.h, theme.coral, theme.coral, 55);

    const L = boxes.labels;
    text(slide, theme, valueOf(left), L.left.x, L.left.y, L.left.w, L.left.h, 16, {
      bold: true,
      color: theme.blue,
      align: "center",
      valign: "mid",
    });
    text(slide, theme, valueOf(right), L.right.x, L.right.y, L.right.w, L.right.h, 16, {
      bold: true,
      color: theme.coral,
      align: "center",
      valign: "mid",
    });
    text(slide, theme, valueOf(overlap), L.overlap.x, L.overlap.y, L.overlap.w, L.overlap.h, 14, {
      bold: true,
      align: "center",
      valign: "mid",
      color: theme.ink,
    });

    if (boxes.captions?.length === 3) {
      captionUnder(slide, theme, boxes.captions[0], left, theme.blue, { labelInShape: true });
      captionUnder(slide, theme, boxes.captions[1], overlap, theme.accent, { labelInShape: true });
      captionUnder(slide, theme, boxes.captions[2], right, theme.coral, { labelInShape: true });
    }
  },
});

/** RACI matrix — flex-sized rows, vertically centered in content band */
registerLayout("raci", {
  aliases: ["responsibility"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const roles = ctx.data.roles ?? [];
    const activities = ctx.data.activities ?? itemsOf(ctx.data);
    const headerH = 28;
    const legendH = ctx.data.legend === false ? 0 : 22;
    const rows = Math.max(activities.length, 1);
    // Table body gets remaining height; justify center so short matrices aren't stuck at top
    const bands = ctx.fit.stack(
      region,
      [
        { id: "header", basis: headerH, min: 24, max: 32, grow: 0, shrink: 0 },
        {
          id: "body",
          // Prefer comfortable row height; don't stretch rows to fill the slide
          basis: rows * 52,
          min: rows * 40,
          max: rows * 60,
          grow: 0,
          shrink: 1,
        },
        ...(legendH
          ? [{ id: "legend", basis: legendH, min: 18, max: 24, grow: 0, shrink: 0 }]
          : []),
      ],
      { gap: 10, justify: "center" },
    );
    return { region, bands, roles, activities };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const roles = (data.roles ?? []).map((r) => (typeof r === "string" ? r : valueOf(r)));
    const activities = data.activities ?? itemsOf(data);
    const marks = data.marks ?? data.cells ?? [];
    const header = boxes.bands.header;
    const body = boxes.bands.body;
    const legend = boxes.bands.legend;
    const labelW = Math.min(280, Math.floor(body.w * 0.28));
    const colW = (body.w - labelW) / Math.max(roles.length, 1);
    const rowH = Math.floor(body.h / Math.max(activities.length, 1));

    roles.forEach((role, i) => {
      text(
        slide,
        theme,
        String(role).toUpperCase(),
        header.x + labelW + i * colW + 8,
        header.y,
        colW - 16,
        header.h,
        11,
        { color: theme.muted, bold: true, align: "center", valign: "mid" },
      );
    });

    activities.forEach((act, ri) => {
      const y = body.y + ri * rowH;
      const cellH = rowH - 6;
      box(slide, theme, body.x, y, body.w, cellH, ri % 2 ? theme.panelAlt : theme.panel, theme.rule);
      text(slide, theme, valueOf(act), body.x + 14, y, labelW - 24, cellH, 13, {
        bold: true,
        valign: "mid",
      });
      roles.forEach((_, ci) => {
        const hit = marks.find((m) => {
          const a =
            typeof m.activity === "number"
              ? m.activity === ri
              : String(valueOf(m.activity ?? m.row)).toLowerCase() ===
                String(valueOf(act)).toLowerCase();
          const b =
            typeof m.role === "number"
              ? m.role === ci
              : String(valueOf(m.role ?? m.col)).toLowerCase() ===
                String(roles[ci]).toLowerCase();
          return a && b;
        });
        const code = hit ? String(hit.value ?? hit.code ?? hit.raci ?? "R").toUpperCase().slice(0, 1) : "·";
        const accent =
          code === "A"
            ? theme.accent
            : code === "R"
              ? theme.blue
              : code === "C"
                ? theme.cyan
                : code === "I"
                  ? theme.muted
                  : theme.rule;
        text(slide, theme, code, body.x + labelW + ci * colW, y, colW, cellH, 16, {
          bold: true,
          align: "center",
          valign: "mid",
          color: accent,
        });
      });
    });

    if (legend && data.legend !== false) {
      text(
        slide,
        theme,
        "R Responsible · A Accountable · C Consulted · I Informed",
        legend.x,
        legend.y,
        legend.w,
        legend.h,
        11,
        { color: theme.muted, valign: "mid" },
      );
    }
  },
});
