import {
  box,
  bullet,
  chip,
  image,
  label,
  line,
  text,
  title,
} from "./primitives.mjs";
import { hexNoHash, px } from "./theme.mjs";

/**
 * Three-horizon roadmap columns + timeline dots.
 * @param {object} data
 * @param {Array<{k:string,name:string,color?:string,focus:string,outs:string[]}>} data.phases
 * @param {string} [data.closing]
 */
export function roadmapPhases(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  const phases = data.phases ?? [];
  const gap = 24;
  const colW = Math.floor((1156 - gap * (phases.length - 1)) / phases.length);
  const baseX = 42;
  const y = 175;

  line(slide, theme, 70, 548, 1160, 548, theme.rule, 1.5);

  phases.forEach((p, i) => {
    const x = baseX + i * (colW + gap);
    const color = p.color ?? theme.series[i % theme.series.length];
    box(slide, theme, x, y, colW, 325, theme.panel, "none", true);
    box(slide, theme, x, y, colW, 10, color, "none", false);
    label(slide, theme, p.k, x + 24, y + 28, 180, color);
    text(slide, theme, p.name, x + 24, y + 58, colW - 48, 40, 24, {
      bold: true,
    });
    text(slide, theme, p.focus, x + 24, y + 110, colW - 48, 48, 15, {
      color: theme.muted,
    });
    (p.outs ?? []).forEach((o, j) =>
      bullet(slide, theme, o, x + 24, y + 175 + j * 40, colW - 48),
    );
    box(slide, theme, x + Math.floor(colW / 2) - 7, 541, 14, 14, color, "none", true);
  });

  if (data.closing) {
    text(slide, theme, data.closing, 42, 590, 1100, 36, 17, { bold: true });
  }
}

/**
 * Today vs Target two-column thesis.
 */
export function twoColumnThesis(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  const left = data.left ?? {};
  const right = data.right ?? {};

  box(slide, theme, 42, 160, 548, 420, theme.panel, "none", true);
  box(slide, theme, 620, 160, 578, 420, theme.panelAlt, theme.rule, true);

  label(slide, theme, left.label ?? "Today", 72, 188, 160, theme.coral);
  text(slide, theme, left.headline ?? "", 72, 226, 480, 80, 26, { bold: true });
  (left.bullets ?? []).forEach((b, i) =>
    bullet(slide, theme, b, 72, 330 + i * 48, 480),
  );

  label(slide, theme, right.label ?? "Target", 652, 188, 160, theme.blue);
  text(slide, theme, right.headline ?? "", 652, 226, 500, 80, 26, {
    bold: true,
  });
  (right.bullets ?? []).forEach((b, i) =>
    bullet(slide, theme, b, 652, 330 + i * 48, 500),
  );

  if (data.northStar) {
    text(slide, theme, "North-star", 72, 600, 140, 20, 12, {
      color: theme.muted,
      bold: true,
    });
    text(slide, theme, data.northStar, 220, 596, 900, 28, 17, { bold: true });
  }
}

/**
 * Journey / funnel stage columns.
 * Timeline line + dots sit below the cards so they never clip body text.
 * @param {Array<{head:string,color?:string,items:string[]}>} data.columns
 */
export function journeyColumns(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  const cols = data.columns ?? [];
  const gap = 20;
  const colW = Math.floor((1156 - gap * (cols.length - 1)) / cols.length);
  const y = 165;
  const cardH = 210;
  const lineY = y + cardH + 32;

  cols.forEach((c, i) => {
    const x = 42 + i * (colW + gap);
    const color = c.color ?? theme.series[i % theme.series.length];
    box(slide, theme, x, y, colW, cardH, theme.panel, "none", true);
    box(slide, theme, x, y, colW, 8, color, "none", false);
    text(slide, theme, c.head, x + 18, y + 28, colW - 36, 28, 15, {
      bold: true,
    });
    (c.items ?? []).forEach((item, j) => {
      text(slide, theme, item, x + 18, y + 78 + j * 44, colW - 36, 40, j === 0 ? 17 : 14, {
        bold: j === 0,
        color: j === 0 ? theme.ink : theme.muted,
      });
    });
  });

  line(slide, theme, 80, lineY, 1160, lineY, theme.rule, 1.5);
  cols.forEach((c, i) => {
    const x = 42 + i * (colW + gap);
    const color = c.color ?? theme.series[i % theme.series.length];
    box(
      slide,
      theme,
      x + Math.floor(colW / 2) - 11,
      lineY - 11,
      22,
      22,
      color,
      "none",
      true,
    );
  });

  if (data.signals?.length) {
    const sigLabelY = lineY + 36;
    const sigY = sigLabelY + 36;
    label(slide, theme, data.signalsLabel ?? "Shared signals", 42, sigLabelY, 320);
    const sigGap = 16;
    const sigW = Math.floor(
      (1156 - sigGap * (data.signals.length - 1)) / data.signals.length,
    );
    data.signals.forEach((v, i) => {
      const x = 42 + i * (sigW + sigGap);
      const active = i === 0;
      box(
        slide,
        theme,
        x,
        sigY,
        sigW,
        56,
        active ? theme.ink : "none",
        active ? theme.ink : theme.rule,
        true,
      );
      text(slide, theme, v, x + 12, sigY + 16, sigW - 24, 28, 14, {
        color: active ? theme.bg : theme.ink,
        bold: active,
      });
    });
  }
}

/**
 * Horizontal stage / architecture flow.
 * @param {Array<{h:string,d:string,color?:string}>} data.stages
 */
export function stageFlow(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  const stages = data.stages ?? [];
  const gap = 20;
  const colW = Math.floor((1156 - gap * (stages.length - 1)) / stages.length);
  const y = 200;

  stages.forEach((st, i) => {
    const x = 42 + i * (colW + gap);
    const color = st.color ?? theme.series[i % theme.series.length];
    box(slide, theme, x, y, colW, 215, theme.panel, "none", true);
    box(slide, theme, x, y, colW, 9, color, "none", false);
    text(slide, theme, st.h, x + 20, y + 36, colW - 40, 36, 20, { bold: true });
    text(slide, theme, st.d, x + 20, y + 90, colW - 40, 90, 15, {
      color: theme.muted,
    });
    if (i < stages.length - 1) {
      line(
        slide,
        theme,
        x + colW,
        y + 108,
        x + colW + gap,
        y + 108,
        theme.ink,
        2,
      );
    }
  });

  if (data.controls?.length) {
    label(slide, theme, data.controlsLabel ?? "Controls", 42, 470, 280);
    data.controls.forEach((v, i) => {
      const x = 42 + i * 290;
      box(slide, theme, x, 505, 270, 48, theme.panelAlt, theme.rule, true);
      text(slide, theme, v, x + 14, 520, 245, 24, 13, { bold: true });
    });
  }

  if (data.principle) {
    text(slide, theme, data.principleLabel ?? "Principle", 42, 590, 140, 20, 12, {
      color: theme.muted,
      bold: true,
    });
    text(slide, theme, data.principle, 190, 586, 960, 36, 16, { bold: true });
  }
}

/**
 * Stacked KPI bands + optional numbered steps panel.
 */
export function kpiBands(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  const bands = data.bands ?? [];
  bands.forEach((b, i) => {
    const y = 170 + i * 96;
    const color = b.color ?? theme.series[i % theme.series.length];
    box(slide, theme, 42, y, 660, 72, theme.panel, "none", true);
    box(slide, theme, 42, y, 12, 72, color, "none", false);
    text(slide, theme, b.h, 74, y + 22, 150, 28, 14, { bold: true });
    text(slide, theme, b.v, 250, y + 20, 420, 36, 17, { bold: true });
  });

  if (data.steps?.length) {
    box(slide, theme, 748, 170, 450, 380, theme.panelAlt, theme.rule, true);
    label(slide, theme, data.stepsLabel ?? "Cadence", 782, 198, 280, theme.blue);
    data.steps.forEach((v, i) => {
      const y = 250 + i * 61;
      const color =
        i < data.steps.length - 1 ? theme.blue : theme.coral;
      box(slide, theme, 782, y, 32, 32, color, "none", true);
      text(slide, theme, String(i + 1), 782, y + 6, 32, 22, 13, {
        color: theme.onAccent ?? theme.white,
        bold: true,
        align: "center",
      });
      text(slide, theme, v, 833, y + 4, 330, 28, 15, {
        bold: i === data.steps.length - 1,
      });
    });
  }

  if (data.watchout) {
    text(slide, theme, "Watchout", 42, 600, 120, 20, 12, {
      color: theme.coral,
      bold: true,
    });
    text(slide, theme, data.watchout, 165, 596, 980, 36, 16, { bold: true });
  }
}

/**
 * Numbered steps alone (compact process strip).
 */
export function numberedSteps(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  (data.steps ?? []).forEach((v, i) => {
    const y = 180 + i * 90;
    const color = theme.series[i % theme.series.length];
    box(slide, theme, 42, y, 56, 56, color, "none", true);
    text(slide, theme, String(i + 1).padStart(2, "0"), 42, y + 14, 56, 28, 18, {
      color: theme.onAccent ?? theme.white,
      bold: true,
      align: "center",
    });
    text(slide, theme, v, 120, y + 12, 1000, 40, 22, { bold: true });
  });
}

/**
 * Markdown / data content slide: title, optional images, native table, bullets.
 * @param {object} data
 * @param {Array<{path:string,w?:number,h?:number}>} [data.images]
 * @param {{headers:string[],rows:string[][]}} [data.table]
 * @param {string[]} [data.bullets]
 * @param {string} [data.body]
 */
export function contentSlide(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  let y = data.subtitle ? 150 : 118;
  const pad = 20;

  for (const img of data.images ?? []) {
    const hasExtra = Boolean(data.body || data.bullets?.length || data.table);
    const panelW = 1156;
    const drawH = img.h ?? (hasExtra ? 380 : 460);
    const panelH = drawH + pad * 2;
    const imgW = img.w ?? panelW - pad * 2;
    const imgX = 42 + Math.round((panelW - imgW) / 2);

    box(slide, theme, 42, y, panelW, panelH, theme.panel, "none", true);
    image(slide, theme, img.path, imgX, y + pad, imgW, drawH);
    y += panelH + 18;
  }

  if (data.table?.headers?.length) {
    const headers = data.table.headers;
    const rows = data.table.rows ?? [];
    const numeric = headers.map((_, ci) =>
      rows.every((r) => {
        const v = String(r[ci] ?? "").trim();
        return v === "" || /^-?\d+(\.\d+)?%?$/.test(v);
      }),
    );
    const colCount = headers.length;
    const firstW = numeric[0] ? 1156 / colCount : Math.max(320, 1156 * 0.38);
    const restW = (1156 - firstW) / Math.max(colCount - 1, 1);
    const colWidths = headers.map((_, i) => (i === 0 ? firstW : restW));

    const tableH = 48 + rows.length * 52;
    box(slide, theme, 42, y, 1156, tableH + 8, theme.panel, "none", true);

    slide.addTable(
      [
        headers.map((h) => ({
          text: String(h),
          options: {
            bold: true,
            color: hexNoHash(theme.white),
            fill: { color: hexNoHash(theme.ink) },
            align: "left",
          },
        })),
        ...rows.map((row, ri) =>
          row.map((cell, ci) => ({
            text: String(cell ?? ""),
            options: {
              color: hexNoHash(theme.ink),
              bold: ci === 0,
              fill: {
                color: hexNoHash(ri % 2 ? theme.panelSoft : theme.panelAlt),
              },
              align: numeric[ci] ? "right" : "left",
            },
          })),
        ),
      ],
      {
        x: px(50),
        y: px(y + 4),
        w: px(1140),
        colW: colWidths.map((w) => px(w * (1140 / 1156))),
        rowH: px(48),
        border: [
          { type: "solid", pt: 0, color: hexNoHash(theme.panel) },
          { type: "solid", pt: 0, color: hexNoHash(theme.panel) },
          { type: "solid", pt: 0.75, color: hexNoHash(theme.rule) },
          { type: "solid", pt: 0, color: hexNoHash(theme.panel) },
        ],
        fontFace: theme.sans,
        fontSize: 16,
        valign: "middle",
      },
    );
    y += tableH + 24;
  }

  (data.bullets ?? []).forEach((b, i) => {
    bullet(slide, theme, b, 42, y + i * 40, 1100);
  });
  if (data.bullets?.length) y += data.bullets.length * 40 + 8;

  if (data.body) {
    text(slide, theme, data.body, 62, y, 1100, 48, 17, {
      color: theme.ink,
      bold: true,
    });
  }
}

/**
 * Swimlane / launch grid: roles × phases with marks.
 * @param {string[]} data.roles
 * @param {Array<{h:string,color?:string,w?:number}>} data.phases
 * @param {Array<[number,number,string]>} data.marks — [roleIndex, phaseIndex, label]
 */
export function swimlane(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  const roles = data.roles ?? [];
  const phases = data.phases ?? [];
  const marks = data.marks ?? [];

  const laneTop = 165;
  const laneH = 68;
  const phaseStart = 286;

  roles.forEach((r, i) => {
    text(slide, theme, r, 42, 205 + i * laneH, 220, 28, 14, { bold: true });
    line(
      slide,
      theme,
      264,
      216 + i * laneH,
      1195,
      216 + i * laneH,
      theme.rule,
      1,
    );
  });

  let x = phaseStart;
  phases.forEach((p) => {
    const w = p.w ?? 250;
    const color = p.color ?? theme.blue;
    const h = Math.max(roles.length * laneH + 40, 360);
    box(slide, theme, x, laneTop, w, h, theme.panel, "none", true);
    box(slide, theme, x, laneTop, w, 42, color, "none", false);
    text(slide, theme, p.h, x + 16, laneTop + 10, w - 32, 24, 14, {
      color: theme.onAccent ?? theme.white,
      bold: true,
    });
    p._x = x;
    p._w = w;
    x += w + 24;
  });

  marks.forEach(([row, col, v]) => {
    const p = phases[col];
    if (!p) return;
    const y = 224 + row * laneH;
    box(slide, theme, p._x + 16, y, p._w - 32, 38, theme.panelAlt, "none", true);
    text(slide, theme, v, p._x + 28, y + 8, p._w - 50, 24, 13, { bold: true });
  });

  if (data.criterion) {
    text(slide, theme, data.criterionLabel ?? "Criterion", 42, 600, 140, 20, 12, {
      color: theme.muted,
      bold: true,
    });
    text(slide, theme, data.criterion, 190, 596, 960, 36, 16, { bold: true });
  }
}

/**
 * Cover / idea slide with optional signal panel.
 */
export function cover(slide, theme, data) {
  label(slide, theme, data.eyebrow ?? "ROADMAP", 42, 48, 320, theme.accent);
  text(slide, theme, data.title, 42, 120, 760, 220, 46, { bold: true });
  if (data.subtitle) {
    text(slide, theme, data.subtitle, 42, 360, 720, 70, 20, {
      color: theme.muted,
    });
  }
  if (data.chip) {
    // High-contrast chip: light fill + dark text on dark theme (matches reference ROADMAP pill)
    chip(slide, theme, data.chip, 42, 460, 130, theme.white, theme.bg);
  }
  if (data.meta) {
    text(slide, theme, data.meta, 42, 512, 700, 36, 15, { color: theme.muted });
  }

  if (data.signalDots !== false) {
    box(slide, theme, 850, 40, 350, 600, theme.panel, "none", true);
    const dots = [
      [895, 100, theme.coral],
      [1030, 90, theme.blue],
      [1125, 160, theme.lime],
      [930, 245, theme.blue],
      [1050, 275, theme.coral],
      [1140, 365, theme.cyan],
      [920, 445, theme.lime],
      [1040, 510, theme.coral],
    ];
    for (const [dx, dy, c] of dots) {
      box(slide, theme, dx, dy, 64, 64, c, "none", true);
    }
    line(slide, theme, 927, 132, 1062, 122, theme.rule, 2);
    line(slide, theme, 1062, 122, 1157, 192, theme.rule, 2);
    line(slide, theme, 962, 277, 1082, 307, theme.rule, 2);
    line(slide, theme, 1082, 307, 1172, 397, theme.rule, 2);
    line(slide, theme, 952, 477, 1072, 542, theme.rule, 2);
    const labels = data.signalLabels ?? ["CUSTOMER", "PRODUCT", "CHANNEL"];
    labels.forEach((lab, i) => {
      text(slide, theme, lab, 872 + i * 100, 590, 100, 18, 10, {
        color: theme.muted,
        bold: true,
        align: i === 1 ? "center" : i === 2 ? "right" : "left",
      });
    });
  }

  if (data.footerLabel || theme.footerText) {
    text(
      slide,
      theme,
      (data.footerLabel ?? theme.footerText).toUpperCase(),
      42,
      678,
      900,
      18,
      11,
      { color: theme.muted, bold: true },
    );
  }
}

/**
 * Closing slide with recommendation cards.
 */
export function closing(slide, theme, data) {
  label(slide, theme, data.eyebrow ?? "Next", 42, 48, 200, theme.accent);
  text(slide, theme, data.title, 42, 130, 1000, 140, 40, { bold: true });
  if (data.subtitle) {
    text(slide, theme, data.subtitle, 42, 310, 900, 60, 20, {
      color: theme.muted,
    });
  }
  (data.recs ?? []).forEach((r, i) => {
    const x = 42 + i * 374;
    const color = r.color ?? theme.series[i % theme.series.length];
    box(slide, theme, x, 420, 340, 120, theme.panel, "none", true);
    box(slide, theme, x, 420, 340, 8, color, "none", false);
    text(slide, theme, r.h, x + 20, 450, 300, 28, 18, { bold: true });
    text(slide, theme, r.d, x + 20, 490, 300, 36, 14, { color: theme.muted });
  });
  if (data.next) {
    text(slide, theme, data.next, 42, 590, 1100, 36, 17, { bold: true });
  }
  text(
    slide,
    theme,
    (data.footerLabel ?? theme.footerText ?? "").toUpperCase(),
    42,
    674,
    900,
    18,
    11,
    { color: theme.muted, bold: true },
  );
}
