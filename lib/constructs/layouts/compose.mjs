/**
 * Compose — multiple layouts on one slide.
 *
 * arrangements:
 *   cols-2 | cols-3 | rows-2 | rows-3 | grid-2x2 |
 *   main-side | side-main | header-body
 */
import { label, title } from "../primitives.mjs";
import { normalizeLayoutData } from "../normalize.mjs";
import {
  partitionRegion,
  normalizeArrangement,
  layoutWidthWeight,
} from "../layout-flex.mjs";
import { registerLayout, runNestedLayout, getLayout } from "../registry.mjs";

function slotsOf(data) {
  const raw = data.slots ?? data.panels ?? data.children ?? [];
  return Array.isArray(raw) ? raw : [];
}

function slotLayoutName(slot) {
  return slot?.layout ?? slot?.type ?? slot?.name ?? null;
}

registerLayout("compose", {
  aliases: ["multi", "grid-compose", "split-layouts"],
  place: (ctx) => {
    const region = ctx.fit.contentBox();
    const slots = slotsOf(ctx.data).slice(0, 4);
    const arrangement = normalizeArrangement(
      ctx.data.arrangement ?? ctx.data.mode ?? ctx.data.compose,
      slots.length,
    );
    const gap = ctx.data.gap ?? ctx.space?.lg ?? 24;
    const hasTitles = slots.some((s) => s.title || s.eyebrow);
    const titleBand = hasTitles ? 34 : 0;
    const inner = {
      x: region.x,
      y: region.y + titleBand,
      w: region.w,
      h: Math.max(40, region.h - titleBand),
    };
    const weights = slots.map((s) => layoutWidthWeight(slotLayoutName(s)));
    const cells = partitionRegion(inner, arrangement, Math.max(slots.length, 1), {
      gap,
      weights,
    });
    return { region, inner, cells, slots, arrangement, titleBand };
  },
  paint(slide, theme, boxes, data, page) {
    if (!data._suppressChrome) {
      title(
        slide,
        theme,
        data.title ?? "",
        data.subtitle,
        page ?? 1,
        data.footerLabel,
        data.classification,
      );
    }

    const slots = boxes.slots ?? slotsOf(data);
    boxes.cells.forEach((cell, i) => {
      const slot = slots[i];
      if (!slot) return;
      const name = slotLayoutName(slot);
      if (!name) {
        label(slide, theme, "MISSING LAYOUT", cell.x + 8, cell.y + 8, cell.w - 16, theme.muted);
        return;
      }
      if (!getLayout(name)) {
        label(
          slide,
          theme,
          `UNKNOWN: ${name}`,
          cell.x + 8,
          cell.y + 8,
          cell.w - 16,
          theme.coral ?? theme.accent,
        );
        return;
      }

      let region = cell;
      const slotTitle = slot.title ?? slot.eyebrow ?? null;
      if (slotTitle) {
        const labelY = boxes.titleBand
          ? cell.y - Math.min(28, boxes.titleBand - 4)
          : cell.y;
        label(slide, theme, slotTitle, cell.x, labelY, cell.w, theme.muted);
        if (!boxes.titleBand) {
          region = {
            x: cell.x,
            y: cell.y + 28,
            w: cell.w,
            h: Math.max(20, cell.h - 28),
          };
        }
      }

      const { layout: _l, type: _t, name: _n, eyebrow: _e, ...rest } = slot;
      const childData = normalizeLayoutData(name, {
        ...rest,
        // Prefer parent chrome; drop slot title from child content title
        title: boxes.titleBand || slotTitle ? undefined : rest.title,
        ...(slot.align != null || slot.vAlign != null || slot.alignY != null
          ? { align: slot.align ?? slot.vAlign ?? slot.alignY }
          : {}),
      });

      runNestedLayout(slide, theme, name, childData, page, region);
    });
  },
});
