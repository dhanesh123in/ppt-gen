import PptxGenJS from "pptxgenjs";
import { basename, join } from "node:path";
import { mkdir } from "node:fs/promises";

import { OUTPUT_DIR } from "../paths.mjs";
import { contentSlide } from "../constructs/content-slide.mjs";
import { newSlide } from "../constructs/primitives.mjs";
import { loadConstructTheme, SLIDE_H_IN, SLIDE_W_IN } from "../constructs/theme.mjs";
import {
  ensureLayoutsLoaded,
  runLayout,
} from "../constructs/registry.mjs";
import { normalizeLayoutData } from "../constructs/normalize.mjs";
import { resolveConstructData } from "./colors.mjs";
import { extractHeading } from "./parse.mjs";
import {
  ensureThemeCompiled,
  expandDirectives,
  loadData,
  parseContentFromExpandedMarkdown,
} from "../preprocess.mjs";
import { enrichContentWithMath, attachEquationMedia } from "../constructs/math.mjs";

function isLayoutBlock(b) {
  return b.type === "layout" || b.type === "construct";
}

function mergeMarkdownHints(blocks, layoutIndex) {
  const layout = blocks[layoutIndex];
  let title;
  let subtitle;
  for (let i = 0; i < layoutIndex; i++) {
    if (blocks[i].type === "markdown") {
      const h = extractHeading(blocks[i].text);
      if (h.title) title = h.title;
      if (h.subtitle) subtitle = h.subtitle;
    }
  }
  const data = { ...layout.data };
  if (title && !data.title) data.title = title;
  if (subtitle && !data.subtitle) data.subtitle = subtitle;
  return data;
}

async function renderMarkdownSlide(
  pptx,
  theme,
  mdText,
  page,
  footerLabel,
  tokens,
  data,
) {
  const expanded = await expandDirectives(mdText, tokens, data, {
    absolute: true,
    mermaidExt: "png",
  });
  let content = parseContentFromExpandedMarkdown(expanded);
  content = await enrichContentWithMath(content, theme);
  if (!content.title) content.title = `Slide ${page}`;
  if (footerLabel) content.footerLabel = footerLabel;
  if (theme.classification) content.classification = theme.classification;
  const s = newSlide(pptx, theme);
  contentSlide(s, theme, content, page);
}

/**
 * Render a parsed deck IR with pptxgenjs layout catalog.
 */
export async function renderConstructsFromIr(
  ir,
  { themeName = null, outName = null } = {},
) {
  await ensureLayoutsLoaded();
  const branding = {
    ...(ir.meta.branding ?? {}),
  };
  if (ir.meta.classification != null) branding.classification = ir.meta.classification;
  if (ir.meta.classificationTone != null) {
    branding.classification_tone = ir.meta.classificationTone;
  }
  if (ir.meta.classification_tone != null) {
    branding.classification_tone = ir.meta.classification_tone;
  }
  const themeOverrides = {
    colors: ir.meta.colors,
    typography: ir.meta.typography,
    space: ir.meta.space,
    variant: ir.meta.variant,
    branding,
    logo: ir.meta.logo,
    logoHeight: ir.meta.logoHeight ?? ir.meta.logo_height_px,
    logoWidth: ir.meta.logoWidth ?? ir.meta.logo_width_px,
    logoTop: ir.meta.logoTop ?? ir.meta.logo_top_px,
    logoRight: ir.meta.logoRight ?? ir.meta.logo_right_px,
    classification: ir.meta.classification,
    classificationTone:
      ir.meta.classificationTone ?? ir.meta.classification_tone,
  };
  const theme = await loadConstructTheme(
    themeName || ir.meta.theme || "scientific",
    themeOverrides,
  );
  const tokens = await ensureThemeCompiled(
    themeName || ir.meta.theme || "scientific",
  );
  const data = await loadData();

  const pptx = new PptxGenJS();
  pptx.defineLayout({
    name: "SLIDE_16x9",
    width: SLIDE_W_IN,
    height: SLIDE_H_IN,
  });
  pptx.layout = "SLIDE_16x9";
  pptx.author = "ppt-gen";
  pptx.title = ir.meta.title ?? outName ?? "Deck";

  let page = 0;
  for (const slideIr of ir.slides) {
    const layoutBlocks = slideIr.blocks
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => isLayoutBlock(b));

    if (layoutBlocks.length === 0) {
      page += 1;
      const md = slideIr.blocks
        .filter((b) => b.type === "markdown")
        .map((b) => b.text)
        .join("\n\n");
      await renderMarkdownSlide(
        pptx,
        theme,
        md,
        page,
        ir.meta.footerLabel ?? null,
        tokens,
        data,
      );
      continue;
    }

    for (const { b, i } of layoutBlocks) {
      page += 1;
      let layoutData = mergeMarkdownHints(slideIr.blocks, i);
      layoutData = normalizeLayoutData(b.name, layoutData);
      layoutData = resolveConstructData(theme, layoutData);
      if (!layoutData.footerLabel && ir.meta.footerLabel) {
        layoutData.footerLabel = ir.meta.footerLabel;
      }
      if (!layoutData.classification && ir.meta.classification) {
        layoutData.classification = ir.meta.classification;
      }
      // Resolve media plot/table paths for split / figure layouts
      layoutData = await resolveMediaSlots(layoutData, tokens, data);
      const layoutName = layoutData._layout ?? b.name;
      if (String(layoutName).toLowerCase() === "equation" || b.name === "equation") {
        layoutData = await attachEquationMedia(layoutData, theme);
      }

      const s = newSlide(pptx, theme);
      runLayout(s, theme, b.name, layoutData, page);
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const fileStem = outName ?? "deck";
  const out = join(OUTPUT_DIR, `${fileStem}.pptx`);
  await pptx.writeFile({ fileName: out });
  return out;
}

async function resolveMediaSlots(layoutData, tokens, data) {
  const { expandDirectives } = await import("../preprocess.mjs");
  const { resolveAssetPath } = await import("../constructs/assets.mjs");
  const out = { ...layoutData };
  const themeName = tokens?.name ?? null;

  async function expandRef(ref) {
    if (!ref) return null;
    if (typeof ref === "string") {
      if (ref.startsWith("plot:") || ref.startsWith("table:") || ref.startsWith("mermaid:")) {
        const md = `{{${ref}}}`;
        const expanded = await expandDirectives(md, tokens, data, {
          absolute: true,
          mermaidExt: "png",
        });
        const m = expanded.match(/!\[[^\]]*\]\(([^)]+)\)/);
        return m ? m[1] : null;
      }
      return resolveAssetPath(ref, { themeName }) ?? ref;
    }
    if (typeof ref === "object") {
      if (ref.path) return resolveAssetPath(ref.path, { themeName }) ?? ref.path;
      if (ref.plot) {
        const opts = [
          ref.type ? `type=${ref.type}` : null,
          ref.x ? `x=${ref.x}` : null,
          ref.y ? `y=${ref.y}` : null,
        ]
          .filter(Boolean)
          .join(" | ");
        const inner = opts ? `plot:${ref.plot} | ${opts}` : `plot:${ref.plot}`;
        return expandRef(inner);
      }
      if (ref.table) return expandRef(`table:${ref.table}`);
      if (ref.mermaid) return expandRef(`mermaid:${ref.mermaid}`);
      if (ref.image) return expandRef(ref.image);
      if (ref.picture) return expandRef(ref.picture);
      if (ref.photo) return expandRef(ref.photo);
    }
    return null;
  }

  for (const key of ["media", "image", "picture", "photo"]) {
    if (out[key] == null) continue;
    const path = await expandRef(out[key]);
    if (!path) continue;
    if (key === "media") {
      out.media = { ...(typeof out.media === "object" ? out.media : {}), path };
    } else {
      out[key] = path;
      if (!out.media?.path) out.media = { ...(out.media ?? {}), path };
    }
  }

  if (out.slots) {
    out.slots = { ...out.slots };
    for (const key of ["left", "right", "main", "aside"]) {
      if (out.slots[key] != null && typeof out.slots[key] !== "string") {
        const path = await expandRef(out.slots[key]);
        if (path) out.slots[key] = { ...out.slots[key], path };
      } else if (typeof out.slots[key] === "string") {
        const path = await expandRef(out.slots[key]);
        if (path) {
          out.slots[`${key}Path`] = path;
          out.slots[key] = { path };
        }
      }
    }
  }

  // Per-item images (list-cards etc.)
  if (Array.isArray(out.items)) {
    out.items = await Promise.all(
      out.items.map(async (item) => {
        if (!item || typeof item !== "object") return item;
        const next = { ...item };
        for (const key of ["image", "picture", "photo"]) {
          if (next[key]) {
            const path = await expandRef(next[key]);
            if (path) next[key] = path;
          }
        }
        return next;
      }),
    );
  }

  return out;
}

export async function buildConstructsFromMarkdownFile(
  absPath,
  text,
  { themeName = null, outName = null } = {},
) {
  const { parseDeckMarkdown } = await import("./parse.mjs");
  const ir = parseDeckMarkdown(text);
  const stem = outName ?? basename(absPath, ".md");
  return renderConstructsFromIr(ir, { themeName, outName: stem });
}
