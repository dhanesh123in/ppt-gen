import {
  box,
  bullet,
  chip,
  image,
  imageContain,
  imageNaturalSize,
  containRect,
  label,
  line,
  text,
  title,
  footer,
} from "../primitives.mjs";
import { registerLayout } from "../registry.mjs";
import { mediaPathOf } from "../assets.mjs";

const itemsOf = (data) => data.items ?? data.bullets ?? [];
const valueOf = (item) =>
  typeof item === "string" ? item : item?.label ?? item?.h ?? item?.name ?? "";
const detailOf = (item) =>
  typeof item === "string" ? "" : item?.detail ?? item?.d ?? item?.focus ?? "";
const colorOf = (theme, index, fallback = theme.accent) => {
  const series = theme.series ?? [];
  return series.length ? series[index % series.length] : fallback;
};
const cardText = (slide, theme, item, card, accent, font = 16) => {
  const heading = valueOf(item);
  const detail = detailOf(item);
  label(slide, theme, heading, card.x + 18, card.y + 16, card.w - 36, accent);
  if (detail) {
    text(slide, theme, detail, card.x + 18, card.y + 44, card.w - 36, card.h - 60, font, {
      color: theme.ink,
      bold: true,
    });
  }
};

export function paintCard(slide, theme, card, { accent = theme.accent } = {}) {
  box(slide, theme, card.x, card.y, card.w, card.h, theme.panel, "none", true);
  box(slide, theme, card.x, card.y, 6, card.h, accent);
  cardText(slide, theme, card.item ?? card, card, accent, card.font ?? 16);
}

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
const contentPlace = (ctx) => ({ region: ctx.fit.contentBox() });
const gridPlace = (ctx, opts) => {
  const region = ctx.fit.contentBox();
  return { region, cards: ctx.fit.fitGrid(region, itemsOf(ctx.data), opts) };
};
const paintBullets = (slide, theme, items, region, color) => {
  const rows = Math.max(1, Math.min(items.length, 7));
  const height = Math.min(56, Math.floor(region.h / rows));
  items.slice(0, 7).forEach((item, index) =>
    bullet(slide, theme, valueOf(item), region.x, region.y + index * height, region.w, color),
  );
};
const paintMedia = (slide, theme, path, region) => {
  box(slide, theme, region.x, region.y, region.w, region.h, theme.panelAlt, theme.rule, true);
  if (!path) {
    label(slide, theme, "MEDIA", region.x + 20, region.y + 20, region.w - 40, theme.muted);
    return;
  }
  const inset = 16;
  const boxW = region.w - inset * 2;
  const boxH = region.h - inset * 2;
  const size = imageNaturalSize(path);
  if (size?.width && size?.height) {
    const fitted = containRect(size.width, size.height, boxW, boxH);
    image(
      slide,
      theme,
      path,
      region.x + inset + fitted.x,
      region.y + inset + fitted.y,
      fitted.w,
      fitted.h,
    );
  } else {
    imageContain(slide, theme, path, region.x + inset, region.y + inset, boxW, boxH);
  }
};
const radialPositions = (region, count) => {
  const centerX = region.x + region.w / 2;
  const centerY = region.y + region.h / 2;
  const radiusX = Math.min(region.w * 0.37, 300);
  const radiusY = Math.min(region.h * 0.34, 150);
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return {
      x: Math.round(centerX + Math.cos(angle) * radiusX - 95),
      y: Math.round(centerY + Math.sin(angle) * radiusY - 42),
      w: 190,
      h: 84,
    };
  });
};

registerLayout("cover", {
  aliases: [],
  place: () => ({ signal: { x: 850, y: 40, w: 350, h: 600 } }),
  paint(slide, theme, boxes, data, page) {
    label(slide, theme, data.eyebrow ?? "ROADMAP", 42, 40, 320, theme.accent);
    const titleLines = Math.max(
      1,
      String(data.title ?? "")
        .replace(/\n+$/, "")
        .split("\n").length,
    );
    const titleSize = Math.min(40, theme.titlePx ?? 40);
    const lineH = Math.round(titleSize * 1.15);
    const titleH = titleLines > 1 ? lineH * titleLines + 4 : 52;
    const titleSubGap = Math.max(18, Math.round(titleSize * 0.45));
    text(slide, theme, data.title ?? "", 42, 88, 760, titleH, titleSize, { bold: true });
    let y = 88 + titleH + titleSubGap;
    if (data.subtitle) {
      text(slide, theme, data.subtitle, 42, y, 720, 64, 17, { color: theme.muted });
      y += 72;
    }
    if (data.chip) {
      chip(slide, theme, data.chip, 42, y, 130, theme.white, theme.bg);
      y += 44;
    }
    if (data.meta) text(slide, theme, data.meta, 42, y, 700, 36, 15, { color: theme.muted });
    const panel = String(data.panel ?? data.coverPanel ?? "signals").toLowerCase();
    const r = boxes.signal;
    const photo = mediaPathOf(data);
    if (panel !== "none" && panel !== "false") {
      box(slide, theme, r.x, r.y, r.w, r.h, theme.panel, "none", true);
      if (panel === "signals" || panel === "dots") {
        const dots = [[895, 100, theme.coral], [1030, 90, theme.blue], [1125, 160, theme.lime], [930, 245, theme.blue], [1050, 275, theme.coral], [1140, 365, theme.cyan], [920, 445, theme.lime], [1040, 510, theme.coral]];
        dots.forEach(([x, y, color]) => box(slide, theme, x, y, 64, 64, color, "none", true));
        [[927, 132, 1062, 122], [1062, 122, 1157, 192], [962, 277, 1082, 307], [1082, 307, 1172, 397], [952, 477, 1072, 542]].forEach((coords) => line(slide, theme, ...coords, theme.rule, 2));
        (data.signalLabels ?? ["CUSTOMER", "PRODUCT", "CHANNEL"]).forEach((item, i) =>
          text(slide, theme, item, 872 + i * 100, 590, 100, 18, 10, { color: theme.muted, bold: true, align: i === 1 ? "center" : i === 2 ? "right" : "left" }),
        );
      } else if (panel === "bars" || panel === "stripes") {
        const colors = [theme.coral, theme.blue, theme.cyan, theme.lime, theme.orange];
        colors.forEach((c, i) => box(slide, theme, r.x + 36 + i * 58, r.y + 80, 42, 420 - i * 40, c, "none", true));
        text(slide, theme, data.panelCaption ?? "SIGNAL STRENGTH", r.x + 36, r.y + 540, r.w - 72, 24, 12, { color: theme.muted, bold: true });
      } else if (panel === "stats" || panel === "kpis") {
        const stats = data.stats ?? data.panelStats ?? [
          { label: "FOCUS", value: "12–18 mo" },
          { label: "OWNERS", value: "Product + Data" },
          { label: "GATE", value: "Stop / scale" },
        ];
        const n = Math.min(stats.length, 4);
        const cardH = Math.floor((r.h - 80) / n) - 12;
        stats.slice(0, n).forEach((s, i) => {
          const cy = r.y + 48 + i * (cardH + 12);
          box(slide, theme, r.x + 24, cy, r.w - 48, cardH, theme.panelAlt, theme.rule, true);
          label(slide, theme, s.label ?? s.h ?? "", r.x + 42, cy + 14, r.w - 84, theme.muted);
          text(slide, theme, String(s.value ?? s.v ?? ""), r.x + 42, cy + 38, r.w - 84, cardH - 52, 15, { bold: true });
        });
      } else if (panel === "solid" || panel === "accent") {
        box(slide, theme, r.x, r.y, r.w, r.h, theme.accent, "none", true);
        text(slide, theme, data.panelCaption ?? (data.chip ?? ""), r.x + 40, r.y + 260, r.w - 80, 80, 28, { color: theme.onAccent, bold: true, align: "center" });
      } else if (panel === "photo" || panel === "image") {
        if (photo) {
          imageContain(slide, theme, photo, r.x + 16, r.y + 16, r.w - 32, r.h - 32);
        } else {
          label(slide, theme, "IMAGE", r.x + 40, r.y + 280, r.w - 80, theme.muted);
        }
      } else if (panel === "grid") {
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 3; col++) {
            const c = [theme.blue, theme.coral, theme.cyan, theme.lime][(row + col) % 4];
            box(slide, theme, r.x + 28 + col * 100, r.y + 60 + row * 120, 84, 100, c, "none", true);
          }
        }
      }
    }
    if (data.footerLabel || theme.footerText || theme.classification || data.classification) {
      footer(slide, theme, page, data.footerLabel, {
        classification: data.classification,
      });
    }
  },
});

registerLayout("closing", {
  place: (ctx) => ({ cards: ctx.fit.distributeRow({ x: 42, y: 420, w: 1156, h: 120 }, 3, 34) }),
  paint(slide, theme, boxes, data, page) {
    label(slide, theme, data.eyebrow ?? "NEXT", 42, 48, 200, theme.accent);
    text(slide, theme, data.title ?? "", 42, 130, 1000, 140, 40, { bold: true });
    if (data.subtitle) text(slide, theme, data.subtitle, 42, 310, 900, 60, 20, { color: theme.muted });
    const photo = mediaPathOf(data);
    if (photo) {
      imageContain(slide, theme, photo, 900, 130, 280, 160);
    }
    (data.recs ?? data.items ?? []).slice(0, 3).forEach((item, i) => paintCard(slide, theme, { ...boxes.cards[i], item }, { accent: item.color ?? colorOf(theme, i) }));
    if (data.next) text(slide, theme, data.next, 42, 590, 1100, 36, 17, { bold: true });
    if (data.footerLabel || theme.footerText || theme.classification || data.classification) {
      footer(slide, theme, page, data.footerLabel, {
        classification: data.classification,
      });
    }
  },
});

registerLayout("section", {
  place: () => ({ center: { x: 160, y: 230, w: 960, h: 230 } }),
  paint(slide, theme, boxes, data, page) {
    label(slide, theme, data.eyebrow ?? "SECTION", 42, 48, 250, theme.accent);
    text(slide, theme, data.title ?? "", boxes.center.x, boxes.center.y, boxes.center.w, 110, 48, { bold: true, align: "center", valign: "mid" });
    if (data.subtitle) text(slide, theme, data.subtitle, boxes.center.x, 355, boxes.center.w, 45, 18, { color: theme.muted, align: "center" });
    const photo = mediaPathOf(data);
    if (photo) {
      imageContain(slide, theme, photo, 440, 430, 400, 180);
    }
    if (data.footerLabel || theme.footerText || theme.classification || data.classification) {
      footer(slide, theme, page, data.footerLabel, {
        classification: data.classification,
      });
    }
  },
});

registerLayout("agenda", {
  aliases: ["toc"],
  place: (ctx) => ({ region: ctx.fit.contentBox(), rows: ctx.fit.distributeCol(ctx.fit.contentBox(), Math.min(itemsOf(ctx.data).length || 1, 6), 12) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    itemsOf(data).slice(0, 6).forEach((item, i) => {
      const row = boxes.rows[i];
      text(slide, theme, String(i + 1).padStart(2, "0"), row.x, row.y + 6, 58, 32, 18, { color: colorOf(theme, i), bold: true });
      text(slide, theme, valueOf(item), row.x + 76, row.y, row.w - 76, 38, 20, { bold: true });
      line(slide, theme, row.x + 76, row.y + row.h - 4, row.x + row.w, row.y + row.h - 4);
    });
  },
});

registerLayout("title-body", {
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const hasMedia = Boolean(mediaPathOf(ctx.data));
    if (!hasMedia) return { region, text: region, media: null };
    const panes = ctx.fit.splitPane(region, 28, 0.52);
    return { region, text: panes.left, media: panes.right };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const textBox = boxes.text ?? boxes.region;
    if (data.body) text(slide, theme, data.body, textBox.x, textBox.y, textBox.w, 80, 18, { color: theme.muted });
    paintBullets(slide, theme, itemsOf(data), {
      ...textBox,
      y: textBox.y + (data.body ? 100 : 0),
      h: textBox.h - (data.body ? 100 : 0),
    });
    if (boxes.media) paintMedia(slide, theme, mediaPathOf(data), boxes.media);
  },
});

for (const [name, reverse] of [["split", false], ["split-reverse", true]]) {
  registerLayout(name, {
    place: (ctx) => {
      const region = ctx.fit.contentBox();
      const panes = ctx.fit.splitPane(region, 32, 0.46);
      return { region, text: reverse ? panes.right : panes.left, media: reverse ? panes.left : panes.right };
    },
    paint(slide, theme, boxes, data, page) {
      chrome(slide, theme, data, page);
      if (data.body) text(slide, theme, data.body, boxes.text.x, boxes.text.y, boxes.text.w, 76, 17, { color: theme.muted });
      paintBullets(slide, theme, itemsOf(data), { ...boxes.text, y: boxes.text.y + (data.body ? 90 : 0), h: boxes.text.h - (data.body ? 90 : 0) });
      paintMedia(slide, theme, mediaPathOf(data) ?? data.media?.path ?? data.slots?.right?.path ?? data.slots?.left?.path ?? data.slots?.main?.path ?? boxes.mediaPath, boxes.media);
    },
  });
}

registerLayout("big-number", {
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const n = Math.max(itemsOf(ctx.data).length, 1);
    const cols = Math.min(n, 4);
    const gap = Math.max(ctx.space.cardGap ?? 20, 24);
    // Fixed card height with room for label / value / detail bands
    const cardH = Math.min(300, Math.max(220, region.h - 24));
    const cards = ctx.fit.distributeRow(
      { ...region, h: cardH, y: region.y + Math.max(0, Math.floor((region.h - cardH) / 2)) },
      cols,
      gap,
    ).slice(0, n).map((c, i) => ({
      ...c,
      item: itemsOf(ctx.data)[i],
      index: i,
    }));
    return { region, cards };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.cards.forEach((card, i) => {
      const item = card.item ?? {};
      const accent = item.color ?? colorOf(theme, i);
      const padX = 20;
      const padY = 18;
      const barH = 8;
      const labelH = 28;
      const detailH = 40;
      const gap = 14;
      const valueY = card.y + barH + padY + labelH + gap;
      const valueH = Math.max(
        56,
        card.h - barH - padY - labelH - gap - (detailOf(item) ? detailH + gap : padY) - padY,
      );
      const valueStr = String(item.value ?? item.v ?? "");
      const valueFont = Math.min(
        40,
        Math.max(22, Math.floor((card.w - padX * 2) / Math.max(1, valueStr.length * 0.58))),
      );

      box(slide, theme, card.x, card.y, card.w, card.h, theme.panel, "none", true);
      box(slide, theme, card.x, card.y, card.w, barH, accent, "none", false);
      label(
        slide,
        theme,
        valueOf(item),
        card.x + padX,
        card.y + barH + padY,
        card.w - padX * 2,
        theme.muted,
      );
      text(slide, theme, valueStr, card.x + padX, valueY, card.w - padX * 2, valueH, valueFont, {
        bold: true,
        color: accent,
        align: "left",
        valign: "mid",
        wrap: false,
      });
      const detail = detailOf(item);
      if (detail) {
        text(
          slide,
          theme,
          detail,
          card.x + padX,
          card.y + card.h - padY - detailH,
          card.w - padX * 2,
          detailH,
          13,
          { color: theme.muted },
        );
      }
    });
  },
});

registerLayout("callout", {
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    if (!mediaPathOf(ctx.data)) return { region, text: region, media: null };
    const panes = ctx.fit.splitPane(region, 28, 0.58);
    return { region, text: panes.left, media: panes.right };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const textBox = boxes.text ?? boxes.region;
    box(slide, theme, textBox.x, textBox.y, 12, textBox.h, theme.accent);
    text(slide, theme, data.body ?? valueOf(itemsOf(data)[0]), textBox.x + 42, textBox.y + 36, textBox.w - 80, textBox.h - 72, 28, {
      bold: true,
      valign: "mid",
    });
    if (boxes.media) paintMedia(slide, theme, mediaPathOf(data), boxes.media);
  },
});

registerLayout("quote", {
  place: contentPlace,
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    text(slide, theme, "“", boxes.region.x, boxes.region.y - 15, 80, 100, 72, { color: theme.accent, bold: true });
    text(slide, theme, data.quote ?? valueOf(itemsOf(data)[0]), boxes.region.x + 78, boxes.region.y + 42, boxes.region.w - 140, 190, 30, { bold: true, valign: "mid" });
    if (data.attribution) label(slide, theme, data.attribution, boxes.region.x + 78, boxes.region.y + 270, boxes.region.w - 140, theme.muted);
  },
});

registerLayout("comparison", {
  aliases: ["twoColumnThesis"],
  place: (ctx) => ({ panes: ctx.fit.splitPane(ctx.fit.contentBox(), 24, 0.5) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const columns = [data.left ?? itemsOf(data)[0] ?? {}, data.right ?? itemsOf(data)[1] ?? {}];
    columns.forEach((item, i) => {
      const pane = i ? boxes.panes.right : boxes.panes.left;
      const accent = item.color ?? colorOf(theme, i);
      box(slide, theme, pane.x, pane.y, pane.w, pane.h, theme.panel, "none", true);
      box(slide, theme, pane.x, pane.y, pane.w, 8, accent);
      label(slide, theme, item.label ?? item.headline ?? (i ? "RIGHT" : "LEFT"), pane.x + 22, pane.y + 24, pane.w - 44, accent);
      text(slide, theme, item.headline ?? item.label ?? "", pane.x + 22, pane.y + 55, pane.w - 44, 50, 22, { bold: true });
      paintBullets(slide, theme, item.bullets ?? item.items ?? [], { x: pane.x + 22, y: pane.y + 126, w: pane.w - 44, h: pane.h - 146 });
    });
  },
});

registerLayout("table-focus", {
  place: contentPlace,
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    box(slide, theme, boxes.region.x, boxes.region.y, boxes.region.w, boxes.region.h, theme.panel, "none", true);
    const rows = data.table?.rows ?? data.table ?? [];
    if (!rows.length) {
      text(slide, theme, "Use a markdown table in the content path.", boxes.region.x + 28, boxes.region.y + 30, boxes.region.w - 56, 40, 18, { color: theme.muted });
      return;
    }
    const normalized = rows.map((row) => Array.isArray(row) ? row : Object.values(row));
    const cols = Math.max(...normalized.map((row) => row.length));
    const rowH = Math.floor(boxes.region.h / normalized.length);
    normalized.forEach((row, r) => row.forEach((cell, c) => {
      const x = boxes.region.x + (c * boxes.region.w) / cols;
      const w = boxes.region.w / cols;
      box(slide, theme, x, boxes.region.y + r * rowH, w, rowH, r === 0 ? theme.panelAlt : theme.panel, theme.rule);
      text(slide, theme, cell, x + 10, boxes.region.y + r * rowH + 10, w - 20, rowH - 20, 13, { bold: r === 0 });
    }));
  },
});

for (const name of ["figure-focus", "mermaid-focus"]) {
  registerLayout(name, {
    place: contentPlace,
    paint(slide, theme, boxes, data, page) {
      chrome(slide, theme, data, page);
      paintMedia(slide, theme, mediaPathOf(data), boxes.region);
    },
  });
}

registerLayout("equation", {
  place: contentPlace,
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const r = boxes.region;
    const note = data.interpretation ?? data.body ?? data.detail;
    const noteBand = note ? 72 : 20;
    const path = data.media?.path ?? data.mathPath;
    const padX = 48;
    const padY = 32;
    // Cap formula width at half the content box — full-bleed upscale looked blown up
    const maxW = Math.round((r.w - padX * 2) * 0.5);
    const maxH = r.h - noteBand - padY * 2;
    let drawW = maxW;
    let drawH = Math.min(140, maxH);
    if (path) {
      const size = data.mathSize ?? imageNaturalSize(path);
      if (size?.width && size?.height) {
        const fitted = containRect(size.width, size.height, maxW, maxH);
        // Never upscale past ~1.25× native raster
        const upscale = Math.min(1.25, fitted.w / size.width);
        drawW = Math.round(size.width * upscale);
        drawH = Math.round(size.height * upscale);
      }
    }
    const panelH = drawH + noteBand + padY * 2;
    const panelY = r.y + Math.max(0, Math.floor((r.h - panelH) / 2));
    box(slide, theme, r.x, panelY, r.w, panelH, theme.panel, "none", true);
    const imgX = r.x + Math.round((r.w - drawW) / 2);
    const imgY = panelY + padY;
    if (path) {
      // Exact pixel box matching image aspect — no stretch
      image(slide, theme, path, imgX, imgY, drawW, drawH);
    } else {
      text(slide, theme, data.latex ?? data.equation ?? "", r.x + padX, imgY, maxW, drawH, 26, {
        color: theme.ink,
        valign: "mid",
        align: "center",
      });
    }
    if (note) {
      text(slide, theme, note, r.x + padX, panelY + panelH - noteBand, r.w - padX * 2, noteBand - 16, 17, {
        color: theme.muted,
      });
    }
  },
});

registerLayout("code", {
  place: contentPlace,
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    box(slide, theme, boxes.region.x, boxes.region.y, boxes.region.w, boxes.region.h, theme.panel, "none", true);
    text(slide, theme, data.code ?? "", boxes.region.x + 26, boxes.region.y + 30, boxes.region.w - 52, boxes.region.h - 90, 16, { color: theme.ink });
    if (data.detail) {
      text(slide, theme, data.detail, boxes.region.x + 26, boxes.region.y + boxes.region.h - 50, boxes.region.w - 52, 28, 14, { color: theme.muted });
    }
  },
});

registerLayout("steps-h", {
  aliases: ["stageFlow"],
  place: (ctx) => ({ cards: ctx.fit.distributeRow(ctx.fit.contentBox(), Math.min(itemsOf(ctx.data).length || 1, 5), 18) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.cards.forEach((card, i) => {
      if (i) line(slide, theme, boxes.cards[i - 1].x + boxes.cards[i - 1].w, card.y + card.h / 2, card.x, card.y + card.h / 2, theme.rule, 2);
      paintCard(slide, theme, { ...card, item: itemsOf(data)[i] }, { accent: colorOf(theme, i) });
    });
  },
});

registerLayout("steps-v", {
  aliases: ["numberedSteps"],
  place: (ctx) => ({ rows: ctx.fit.distributeCol(ctx.fit.contentBox(), Math.min(itemsOf(ctx.data).length || 1, 6), 12) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.rows.forEach((row, i) => {
      box(slide, theme, row.x, row.y, 42, 42, colorOf(theme, i), "none", true);
      text(slide, theme, i + 1, row.x, row.y + 9, 42, 20, 14, { bold: true, align: "center", color: theme.onAccent });
      text(slide, theme, valueOf(itemsOf(data)[i]), row.x + 64, row.y + 2, row.w - 64, 28, 18, { bold: true });
      if (detailOf(itemsOf(data)[i])) text(slide, theme, detailOf(itemsOf(data)[i]), row.x + 64, row.y + 30, row.w - 64, row.h - 30, 14, { color: theme.muted });
    });
  },
});

registerLayout("timeline", {
  place: (ctx) => ({ region: ctx.fit.contentBox(), points: ctx.fit.distributeRow({ ...ctx.fit.contentBox(), y: ctx.fit.contentBox().y + 140, h: 1 }, Math.min(itemsOf(ctx.data).length || 1, 6), 0) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const y = boxes.region.y + 140;
    line(slide, theme, boxes.region.x + 20, y, boxes.region.x + boxes.region.w - 20, y, theme.rule, 2);
    boxes.points.forEach((point, i) => {
      const item = itemsOf(data)[i];
      const x = point.x + point.w / 2;
      box(slide, theme, x - 10, y - 10, 20, 20, colorOf(theme, i), "none", true);
      label(slide, theme, valueOf(item), point.x + 8, y + 28, point.w - 16, colorOf(theme, i));
      if (detailOf(item)) text(slide, theme, detailOf(item), point.x + 8, y + 54, point.w - 16, 70, 14, { color: theme.muted, align: "center" });
    });
  },
});

registerLayout("cycle", {
  place: (ctx) => ({ region: ctx.fit.contentBox(), cards: ctx.fit.fitGrid(ctx.fit.contentBox(), itemsOf(ctx.data), { preferCols: 2, maxCols: 2 }) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.cards.forEach((card, i) => paintCard(slide, theme, card, { accent: colorOf(theme, i) }));
  },
});

registerLayout("funnel", {
  place: (ctx) => ({ region: ctx.fit.contentBox(), rows: ctx.fit.distributeCol(ctx.fit.contentBox(), Math.min(itemsOf(ctx.data).length || 1, 6), 10) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.rows.forEach((row, i) => {
      const ratio = 1 - i * 0.1;
      const w = row.w * Math.max(0.45, ratio);
      const x = row.x + (row.w - w) / 2;
      box(slide, theme, x, row.y, w, row.h, colorOf(theme, i), "none", true);
      text(slide, theme, valueOf(itemsOf(data)[i]), x + 16, row.y + row.h / 2 - 11, w - 32, 24, 16, { bold: true, align: "center", color: theme.onAccent, valign: "mid" });
    });
  },
});

registerLayout("hierarchy", {
  aliases: ["org"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const root = itemsOf(ctx.data)[0] ?? {};
    const children = root.items ?? itemsOf(ctx.data).slice(1);
    const rootH = 88;
    const childH = 110;
    const stem = 36;
    const drop = 36;
    const rootBox = {
      x: region.x + region.w * 0.32,
      y: region.y + 8,
      w: region.w * 0.36,
      h: rootH,
    };
    const childY = rootBox.y + rootH + stem + drop;
    const childRow = ctx.fit.distributeRow(
      { x: region.x, y: childY, w: region.w, h: childH },
      Math.max(1, children.length),
      20,
    );
    return {
      region,
      root: rootBox,
      children: childRow,
      childItems: children,
      connectors: { stem, drop },
    };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const all = itemsOf(data);
    const root = all[0] ?? data.root ?? { label: "ROOT" };
    const children = boxes.childItems ?? root.items ?? all.slice(1);
    paintCard(slide, theme, { ...boxes.root, item: root }, { accent: theme.accent });

    // Org-chart T-connectors via thin rects (axis-aligned; no line flip bugs)
    if (boxes.children.length) {
      const ink = theme.rule;
      const thick = 3;
      const rootCx = boxes.root.x + boxes.root.w / 2;
      const stemTop = boxes.root.y + boxes.root.h;
      const railY = stemTop + (boxes.connectors?.stem ?? 36);
      box(slide, theme, rootCx - thick / 2, stemTop, thick, railY - stemTop, ink);
      const first = boxes.children[0];
      const last = boxes.children[boxes.children.length - 1];
      const railLeft = first.x + first.w / 2;
      const railRight = last.x + last.w / 2;
      if (boxes.children.length > 1) {
        box(slide, theme, railLeft, railY - thick / 2, railRight - railLeft, thick, ink);
      }
      boxes.children.forEach((card) => {
        const cx = card.x + card.w / 2;
        box(slide, theme, cx - thick / 2, railY, thick, card.y - railY, ink);
      });
    }

    boxes.children.forEach((card, i) => {
      paintCard(slide, theme, { ...card, item: children[i] }, { accent: colorOf(theme, i) });
    });
  },
});

registerLayout("radial", {
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    return { region, hub: { x: region.x + region.w / 2 - 110, y: region.y + region.h / 2 - 50, w: 220, h: 100 }, nodes: radialPositions(region, Math.min(Math.max(itemsOf(ctx.data).length - 1, 1), 6)) };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const all = itemsOf(data);
    boxes.nodes.forEach((node, i) => line(slide, theme, boxes.hub.x + boxes.hub.w / 2, boxes.hub.y + boxes.hub.h / 2, node.x + node.w / 2, node.y + node.h / 2));
    paintCard(slide, theme, { ...boxes.hub, item: all[0] ?? data.hub ?? { label: "HUB" } }, { accent: theme.accent });
    boxes.nodes.forEach((node, i) => paintCard(slide, theme, { ...node, item: all[i + 1] }, { accent: colorOf(theme, i) }));
  },
});

for (const [name, inverted] of [["pyramid", false], ["inverted-pyramid", true]]) {
  registerLayout(name, {
    place: (ctx) => ({ region: ctx.fit.contentBox(), rows: ctx.fit.distributeCol(ctx.fit.contentBox(), Math.min(itemsOf(ctx.data).length || 1, 6), 8) }),
    paint(slide, theme, boxes, data, page) {
      chrome(slide, theme, data, page);
      const n = boxes.rows.length;
      boxes.rows.forEach((row, i) => {
        const step = inverted ? n - i : i + 1;
        const w = row.w * (0.35 + (step / n) * 0.65);
        const x = row.x + (row.w - w) / 2;
        box(slide, theme, x, row.y, w, row.h, colorOf(theme, i), "none", true);
        text(slide, theme, valueOf(itemsOf(data)[i]), x + 12, row.y + row.h / 2 - 10, w - 24, 22, 15, { bold: true, align: "center", color: theme.onAccent });
      });
    },
  });
}

registerLayout("list-cards", {
  aliases: ["journeyColumns"],
  place: (ctx) => gridPlace(ctx, { maxCols: 4 }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.cards.forEach((card, i) => {
      const item = card.item ?? {};
      paintCard(slide, theme, card, { accent: colorOf(theme, i) });
      const thumb = item.image ?? item.picture ?? item.photo;
      let bulletY = card.y + 88;
      if (thumb) {
        const th = Math.min(72, Math.floor(card.h * 0.28));
        imageContain(slide, theme, thumb, card.x + 18, card.y + 52, card.w - 36, th);
        bulletY = card.y + 52 + th + 12;
      }
      (item.bullets ?? []).slice(0, 3).forEach((b, j) =>
        bullet(slide, theme, valueOf(b), card.x + 18, bulletY + j * 30, card.w - 36, theme.ink),
      );
    });
  },
});

registerLayout("banded-list", {
  aliases: ["kpiBands"],
  place: (ctx) => ({ rows: ctx.fit.distributeCol(ctx.fit.contentBox(), Math.min(itemsOf(ctx.data).length || 1, 6), 10) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.rows.forEach((row, i) => {
      const item = itemsOf(data)[i];
      box(slide, theme, row.x, row.y, row.w, row.h, theme.panel, "none", true);
      box(slide, theme, row.x, row.y, 12, row.h, item?.color ?? colorOf(theme, i));
      text(slide, theme, valueOf(item), row.x + 32, row.y + 12, row.w * 0.45, 28, 18, { bold: true });
      text(slide, theme, item?.value ?? detailOf(item), row.x + row.w * 0.42, row.y + 13, row.w * 0.52, 28, 16, { color: theme.muted, align: "right" });
    });
  },
});

registerLayout("matrix2x2", {
  aliases: ["bcg", "quadrant"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    return {
      region,
      grid: {
        x: region.x + 120,
        y: region.y + 12,
        w: region.w - 150,
        h: region.h - 70,
      },
    };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const { grid } = boxes;
    const halfW = grid.w / 2;
    const halfH = grid.h / 2;
    const gap = 10;
    const cells = [
      { key: "tl", x: grid.x, y: grid.y, w: halfW - gap / 2, h: halfH - gap / 2 },
      { key: "tr", x: grid.x + halfW + gap / 2, y: grid.y, w: halfW - gap / 2, h: halfH - gap / 2 },
      { key: "bl", x: grid.x, y: grid.y + halfH + gap / 2, w: halfW - gap / 2, h: halfH - gap / 2 },
      { key: "br", x: grid.x + halfW + gap / 2, y: grid.y + halfH + gap / 2, w: halfW - gap / 2, h: halfH - gap / 2 },
    ];
    cells.forEach((cell) => {
      box(slide, theme, cell.x, cell.y, cell.w, cell.h, theme.panel, theme.rule, true);
    });
    text(slide, theme, data.axes?.y ?? data.yAxis ?? "HIGH", boxes.region.x, grid.y, 110, 28, 14, {
      color: theme.muted,
      bold: true,
    });
    text(slide, theme, data.axes?.x ?? data.xAxis ?? "LOW → HIGH", grid.x, grid.y + grid.h + 16, grid.w, 28, 14, {
      color: theme.muted,
      bold: true,
      align: "center",
    });
    const qLabels = data.quadrants ?? {};
    const cellByKey = Object.fromEntries(cells.map((c) => [c.key, c]));
    for (const [key, lab] of Object.entries(qLabels)) {
      const cell = cellByKey[key];
      if (!cell || !lab) continue;
      label(slide, theme, lab, cell.x + 16, cell.y + 14, cell.w - 32, theme.muted);
    }
    const byQuad = { tl: [], tr: [], bl: [], br: [] };
    itemsOf(data).forEach((item) => {
      const q =
        item.quadrant ??
        (item.x === "high"
          ? item.y === "high"
            ? "tr"
            : "br"
          : item.y === "high"
            ? "tl"
            : "bl");
      const map = {
        tl: "tl",
        tr: "tr",
        bl: "bl",
        br: "br",
        star: "tr",
        "cash-cow": "br",
        "question-mark": "tl",
        dog: "bl",
      };
      const key = map[q] ?? "tl";
      byQuad[key].push(item);
    });
    Object.entries(byQuad).forEach(([key, items]) => {
      const cell = cellByKey[key];
      if (!cell || !items.length) return;
      const top = cell.y + (qLabels[key] ? 44 : 18);
      const availH = cell.y + cell.h - top - 14;
      const rowH = Math.min(48, Math.floor(availH / items.length));
      items.forEach((item, i) => {
        const y = top + i * rowH;
        const h = Math.max(36, rowH - 8);
        const accent = colorOf(theme, i);
        box(slide, theme, cell.x + 16, y, cell.w - 32, h, theme.panelAlt, accent, true);
        text(slide, theme, valueOf(item), cell.x + 28, y, cell.w - 56, h, 16, {
          bold: true,
          color: theme.ink,
          valign: "mid",
        });
      });
    });
  },
});

registerLayout("matrix3x3", {
  place: (ctx) => ({ grid: { x: ctx.fit.contentBox().x + 100, y: ctx.fit.contentBox().y, w: ctx.fit.contentBox().w - 140, h: ctx.fit.contentBox().h } }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const { grid } = boxes;
    box(slide, theme, grid.x, grid.y, grid.w, grid.h, theme.panel, theme.rule);
    for (let i = 1; i < 3; i++) {
      line(slide, theme, grid.x + (grid.w * i) / 3, grid.y, grid.x + (grid.w * i) / 3, grid.y + grid.h);
      line(slide, theme, grid.x, grid.y + (grid.h * i) / 3, grid.x + grid.w, grid.y + (grid.h * i) / 3);
    }
    itemsOf(data).forEach((item, i) => {
      const x = grid.x + ((item.col ?? 1) + 0.5) * grid.w / 3 - 55;
      const y = grid.y + ((item.row ?? 1) + 0.5) * grid.h / 3 - 15;
      chip(slide, theme, valueOf(item), x, y, 110, colorOf(theme, i), theme.onAccent);
    });
  },
});

registerLayout("waterfall-story", {
  place: (ctx) => ({ cards: ctx.fit.distributeRow(ctx.fit.contentBox(), 3, 24) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const zones = [{ label: "FROM", detail: data.from }, { label: "DRIVERS", detail: data.drivers ?? itemsOf(data).map(valueOf).join("\n") }, { label: "TO", detail: data.to }];
    boxes.cards.forEach((card, i) => {
      paintCard(slide, theme, { ...card, item: zones[i] }, { accent: colorOf(theme, i) });
      if (i < 2) text(slide, theme, "→", card.x + card.w + 2, card.y + card.h / 2 - 18, 20, 36, 22, { color: theme.accent, bold: true });
    });
  },
});

registerLayout("issue-tree", {
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const root = itemsOf(ctx.data)[0] ?? {};
    const branches = root.items ?? itemsOf(ctx.data).slice(1);
    return {
      root: { x: region.x + region.w * 0.35, y: region.y, w: region.w * 0.3, h: 80 },
      branches: ctx.fit.distributeRow(
        { x: region.x, y: region.y + 160, w: region.w, h: region.h - 160 },
        Math.min(Math.max(branches.length, 1), 4),
        18,
      ),
      branchItems: branches,
      rootItem: root,
    };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const root = boxes.rootItem ?? data.root ?? itemsOf(data)[0] ?? { label: "CORE ISSUE" };
    const branches = boxes.branchItems ?? root.items ?? itemsOf(data).slice(1);
    paintCard(slide, theme, { ...boxes.root, item: root }, { accent: theme.accent });
    boxes.branches.forEach((card, i) => {
      line(slide, theme, boxes.root.x + boxes.root.w / 2, boxes.root.y + boxes.root.h, card.x + card.w / 2, card.y, theme.rule);
      paintCard(slide, theme, { ...card, item: branches[i] }, { accent: colorOf(theme, i) });
    });
  },
});

registerLayout("before-after", {
  place: (ctx) => ({ panes: ctx.fit.splitPane(ctx.fit.contentBox(), 90, 0.5) }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    [["BEFORE", data.before ?? itemsOf(data)[0]], ["AFTER", data.after ?? itemsOf(data)[1]]].forEach(([heading, item], i) => {
      const pane = i ? boxes.panes.right : boxes.panes.left;
      paintCard(slide, theme, { ...pane, item: typeof item === "object" ? item : { label: heading, detail: item } }, { accent: i ? theme.lime : theme.coral });
      label(slide, theme, heading, pane.x + 18, pane.y + pane.h - 34, pane.w - 36, i ? theme.lime : theme.coral);
    });
    text(slide, theme, "→", boxes.panes.left.x + boxes.panes.left.w + 25, boxes.panes.left.y + boxes.panes.left.h / 2 - 24, 40, 48, 30, { color: theme.accent, bold: true, align: "center" });
  },
});

registerLayout("swimlane", {
  place: (ctx) => ({ region: ctx.fit.contentBox() }),
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    const roles = data.roles ?? [];
    const phases = data.phases ?? [];
    const labelW = 150;
    const headerH = 36;
    const laneH = (boxes.region.h - headerH) / Math.max(roles.length, 1);
    const phaseW = (boxes.region.w - labelW) / Math.max(phases.length, 1);
    phases.forEach((phase, i) =>
      label(
        slide,
        theme,
        valueOf(phase),
        boxes.region.x + labelW + i * phaseW + 8,
        boxes.region.y,
        phaseW - 16,
        theme.muted,
      ),
    );
    roles.forEach((role, i) => {
      const y = boxes.region.y + headerH + i * laneH;
      const laneInnerH = laneH - 8;
      text(slide, theme, valueOf(role), boxes.region.x, y, labelW - 18, laneInnerH, 13, {
        bold: true,
        valign: "mid",
      });
      box(
        slide,
        theme,
        boxes.region.x + labelW,
        y,
        boxes.region.w - labelW,
        laneInnerH,
        i % 2 ? theme.panelAlt : theme.panel,
        theme.rule,
      );
    });
    (data.marks ?? []).forEach((mark, i) => {
      let role =
        typeof mark.role === "number"
          ? mark.role
          : roles.findIndex((item) => valueOf(item) === mark.role);
      let phase =
        typeof mark.phase === "number"
          ? mark.phase
          : phases.findIndex((item) => valueOf(item) === mark.phase);
      if (role < 0 || phase < 0) return;
      const laneY = boxes.region.y + headerH + role * laneH;
      const laneInnerH = laneH - 8;
      const markH = Math.min(40, Math.max(28, laneInnerH - 16));
      const markY = laneY + (laneInnerH - markH) / 2;
      const markX = boxes.region.x + labelW + phase * phaseW + 10;
      const markW = phaseW - 20;
      box(slide, theme, markX, markY, markW, markH, colorOf(theme, i), "none", true);
      text(slide, theme, mark.label, markX + 8, markY, markW - 16, markH, 12, {
        bold: true,
        color: theme.onAccent,
        align: "center",
        valign: "mid",
      });
    });
  },
});

registerLayout("roadmap", {
  aliases: ["roadmapPhases"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const closingBand = ctx.data.closing ? 48 : 0;
    const cardsRegion = {
      ...region,
      h: Math.max(160, region.h - closingBand),
    };
    return {
      region,
      closingBand,
      cards: ctx.fit.fitGrid(cardsRegion, itemsOf(ctx.data), { preferCols: 3, maxCols: 3 }),
    };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    boxes.cards.forEach((card, i) => {
      const item = card.item ?? {};
      const accent = item.color ?? colorOf(theme, i);
      const pad = 18;
      box(slide, theme, card.x, card.y, card.w, card.h, theme.panel, "none", true);
      box(slide, theme, card.x, card.y, 6, card.h, accent);

      let y = card.y + pad;
      if (item.horizon) {
        label(slide, theme, item.horizon, card.x + pad, y, card.w - pad * 2, accent);
        y += 26;
      }
      text(slide, theme, valueOf(item), card.x + pad, y, card.w - pad * 2, 40, 18, {
        bold: true,
        color: theme.ink,
      });
      y += 44;
      const detail = detailOf(item);
      if (detail) {
        text(slide, theme, detail, card.x + pad, y, card.w - pad * 2, 48, 14, {
          color: theme.muted,
        });
        y += 52;
      }
      const outputs = item.outputs ?? [];
      const outH = Math.max(20, card.y + card.h - pad - y);
      const lineH = Math.min(24, Math.floor(outH / Math.max(outputs.length, 1)));
      outputs.slice(0, 4).forEach((out, j) => {
        bullet(slide, theme, String(out), card.x + pad, y + j * lineH, card.w - pad * 2, theme.ink);
      });
    });
    if (data.closing) {
      const y = boxes.region.y + boxes.region.h - (boxes.closingBand || 48) + 8;
      text(slide, theme, data.closing, boxes.region.x, y, boxes.region.w, 36, 15, {
        color: theme.muted,
        bold: true,
      });
    }
  },
});

registerLayout("chart-callout", {
  place: (ctx) => {
    const panes = ctx.fit.splitPane(ctx.fit.contentBox(), 30, 0.62);
    return { chart: panes.left, insights: panes.right };
  },
  paint(slide, theme, boxes, data, page) {
    chrome(slide, theme, data, page);
    paintMedia(slide, theme, mediaPathOf(data), boxes.chart);
    label(slide, theme, data.insightLabel ?? "KEY INSIGHTS", boxes.insights.x, boxes.insights.y, boxes.insights.w, theme.accent);
    paintBullets(slide, theme, data.insights ?? itemsOf(data), { ...boxes.insights, y: boxes.insights.y + 36, h: boxes.insights.h - 36 });
  },
});
