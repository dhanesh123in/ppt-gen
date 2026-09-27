/**
 * Native PPTX table paint into a pixel region.
 */
import { box } from "./primitives.mjs";
import { hexNoHash, px } from "./theme.mjs";

/**
 * @param {{ headers: string[], rows: string[][] }} table
 * @param {{ x:number, y:number, w:number, h:number }} region
 */
export function paintRegionTable(slide, theme, table, region) {
  const headers = table?.headers ?? [];
  const rows = table?.rows ?? [];
  if (!headers.length) return;

  const numeric = headers.map((_, ci) =>
    rows.every((r) => {
      const v = String(r[ci] ?? "").trim();
      return v === "" || /^-?\d+(\.\d+)?%?$/.test(v);
    }),
  );
  const colCount = headers.length;
  const firstW = numeric[0] ? region.w / colCount : Math.max(region.w * 0.28, region.w / colCount);
  const restW = (region.w - firstW) / Math.max(colCount - 1, 1);
  const colWidths = headers.map((_, i) => (i === 0 ? firstW : restW));

  const maxRows = Math.max(1, Math.min(rows.length, Math.floor((region.h - 8) / 40) - 1));
  const visible = rows.slice(0, maxRows);
  const rowH = Math.min(48, Math.floor((region.h - 8) / (visible.length + 1)));
  const tableH = rowH * (visible.length + 1);

  const headerBg = theme.tableHeaderBg ?? theme.blue ?? theme.ink;
  const headerFg = theme.tableHeaderFg ?? theme.onAccent ?? theme.white;
  const zebraA = theme.panelAlt;
  const zebraB = theme.panelSoft;

  box(slide, theme, region.x, region.y, region.w, Math.min(region.h, tableH + 8), theme.panel, "none", true);

  slide.addTable(
    [
      headers.map((h) => ({
        text: String(h),
        options: {
          bold: true,
          color: hexNoHash(headerFg),
          fill: { color: hexNoHash(headerBg) },
          align: "left",
        },
      })),
      ...visible.map((row, ri) =>
        row.map((cell, ci) => ({
          text: String(cell ?? ""),
          options: {
            color: hexNoHash(theme.ink),
            bold: ci === 0,
            fill: {
              color: hexNoHash(ri % 2 ? zebraB : zebraA),
            },
            align: numeric[ci] ? "right" : "left",
          },
        })),
      ),
    ],
    {
      x: px(region.x + 4),
      y: px(region.y + 4),
      w: px(region.w - 8),
      colW: colWidths.map((w) => px(w * ((region.w - 8) / region.w))),
      rowH: px(rowH),
      border: [
        { type: "solid", pt: 0, color: hexNoHash(theme.panel) },
        { type: "solid", pt: 0, color: hexNoHash(theme.panel) },
        { type: "solid", pt: 0.75, color: hexNoHash(theme.rule) },
        { type: "solid", pt: 0, color: hexNoHash(theme.panel) },
      ],
      fontFace: theme.sans,
      fontSize: Math.min(15, Math.max(11, rowH - 20)),
      valign: "middle",
    },
  );
}
