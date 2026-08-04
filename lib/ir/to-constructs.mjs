import PptxGenJS from "pptxgenjs";
import { basename, join } from "node:path";
import { mkdir } from "node:fs/promises";

import { OUTPUT_DIR } from "../paths.mjs";
import {
  closing,
  contentSlide,
  cover,
  journeyColumns,
  kpiBands,
  numberedSteps,
  roadmapPhases,
  stageFlow,
  swimlane,
  twoColumnThesis,
} from "../constructs/layouts.mjs";
import { newSlide } from "../constructs/primitives.mjs";
import { loadConstructTheme, SLIDE_H_IN, SLIDE_W_IN } from "../constructs/theme.mjs";
import { resolveConstructData } from "./colors.mjs";
import { extractHeading } from "./parse.mjs";
import {
  ensureThemeCompiled,
  expandDirectives,
  loadData,
  parseContentFromExpandedMarkdown,
} from "../preprocess.mjs";

const LAYOUTS = {
  cover,
  closing,
  contentSlide,
  twoColumnThesis,
  journeyColumns,
  roadmapPhases,
  stageFlow,
  kpiBands,
  numberedSteps,
  swimlane,
};

function mergeMarkdownHints(blocks, constructIndex) {
  const construct = blocks[constructIndex];
  let title;
  let subtitle;
  for (let i = 0; i < constructIndex; i++) {
    if (blocks[i].type === "markdown") {
      const h = extractHeading(blocks[i].text);
      if (h.title) title = h.title;
      if (h.subtitle) subtitle = h.subtitle;
    }
  }
  const data = { ...construct.data };
  if (title && !data.title) data.title = title;
  if (subtitle && !data.subtitle) data.subtitle = subtitle;
  return data;
}

async function renderMarkdownSlide(pptx, theme, mdText, page, footerLabel, tokens, data) {
  const expanded = await expandDirectives(mdText, tokens, data, {
    absolute: true,
    mermaidExt: "png",
  });
  const content = parseContentFromExpandedMarkdown(expanded);
  if (!content.title) content.title = `Slide ${page}`;
  if (footerLabel) content.footerLabel = footerLabel;
  const s = newSlide(pptx, theme);
  contentSlide(s, theme, content, page);
}

/**
 * Render a parsed deck IR with pptxgenjs constructs.
 */
export async function renderConstructsFromIr(ir, { themeName = null, outName = null } = {}) {
  const theme = await loadConstructTheme(
    themeName || ir.meta.theme || "scientific",
  );
  const tokens = await ensureThemeCompiled(themeName || ir.meta.theme || "scientific");
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
    const constructBlocks = slideIr.blocks
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.type === "construct");

    if (constructBlocks.length === 0) {
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

    for (const { b, i } of constructBlocks) {
      page += 1;
      const layout = LAYOUTS[b.name];
      if (!layout) {
        throw new Error(
          `Unknown construct '${b.name}'. Available: ${Object.keys(LAYOUTS).join(", ")}`,
        );
      }
      let layoutData = mergeMarkdownHints(slideIr.blocks, i);
      layoutData = resolveConstructData(theme, layoutData);
      if (!layoutData.footerLabel && ir.meta.footerLabel) {
        layoutData.footerLabel = ir.meta.footerLabel;
      }
      const s = newSlide(pptx, theme);
      if (b.name === "cover" || b.name === "closing") {
        layout(s, theme, layoutData);
      } else {
        layout(s, theme, layoutData, page);
      }
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const fileStem = outName ?? "deck";
  const out = join(OUTPUT_DIR, `${fileStem}.pptx`);
  await pptx.writeFile({ fileName: out });
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
