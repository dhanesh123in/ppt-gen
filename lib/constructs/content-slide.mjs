import {
  box,
  bullet,
  imageContain,
  text,
  title,
} from "./primitives.mjs";
import { hexNoHash, px } from "./theme.mjs";
import { containRect, imageNaturalSize } from "./image-fit.mjs";

/**
 * Markdown / data content slide: title, images, tables, bullets, math images.
 */
export function contentSlide(slide, theme, data, page = 1) {
  title(slide, theme, data.title, data.subtitle, page, data.footerLabel);
  let y = data.subtitle ? 150 : 118;
  const pad = 20;
  const panelW = 1156;
  const maxImgH = data.body || data.bullets?.length || data.table ? 400 : 500;

  for (const img of data.images ?? []) {
    const natural = imageNaturalSize(img.path) ?? {
      width: img.w ?? panelW - pad * 2,
      height: img.h ?? maxImgH,
    };
    const isMath = /[/\\]math[/\\]|math-/.test(String(img.path));
    // Display math was filling the slide; target ~half width and avoid huge upscales
    const boxW = isMath ? Math.round((panelW - pad * 2) * 0.5) : panelW - pad * 2;
    const boxH = isMath ? Math.min(180, maxImgH) : maxImgH;
    let { w: drawW, h: drawH } = containRect(natural.width, natural.height, boxW, boxH);
    if (isMath) {
      const maxScale = 1.25;
      if (drawW > natural.width * maxScale) {
        drawW = Math.round(natural.width * maxScale);
        drawH = Math.round(natural.height * maxScale);
      }
    }
    const panelH = drawH + pad * 2;
    const imgX = 42 + Math.round((panelW - drawW) / 2);

    box(slide, theme, 42, y, panelW, panelH, theme.panel, "none", true);
    imageContain(slide, theme, img.path, imgX, y + pad, drawW, drawH, natural);
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
    text(slide, theme, data.body, 62, y, 1100, 80, 17, {
      color: theme.ink,
      bold: true,
    });
  }
}
