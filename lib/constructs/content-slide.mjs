import {
  box,
  bullet,
  imageContain,
  text,
  title,
} from "./primitives.mjs";
import { paintRegionTable } from "./paint-table.mjs";
import { containRect, imageNaturalSize } from "./image-fit.mjs";

/**
 * Markdown / data content slide: title, images, tables, bullets, math images.
 */
export function contentSlide(slide, theme, data, page = 1) {
  title(
    slide,
    theme,
    data.title,
    data.subtitle,
    page,
    data.footerLabel,
    data.classification,
  );
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
    const rowCount = (data.table.rows ?? []).length;
    const rowH = 48;
    const tableH = rowH * (rowCount + 1);
    paintRegionTable(slide, theme, data.table, {
      x: 42,
      y,
      w: 1156,
      h: tableH + 8,
    });
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
