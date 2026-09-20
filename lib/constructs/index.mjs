export { loadConstructTheme, px, SLIDE_W_IN, SLIDE_H_IN } from "./theme.mjs";
export {
  box,
  line,
  text,
  footer,
  title,
  chip,
  bullet,
  label,
  image,
  newSlide,
  ellipse,
  chevronShape,
  paintLogo,
} from "./primitives.mjs";
export { contentSlide } from "./content-slide.mjs";
export {
  registerLayout,
  getLayout,
  listLayouts,
  ensureLayoutsLoaded,
  runLayout,
  runNestedLayout,
} from "./registry.mjs";
export {
  createFitContext,
  contentBox,
  fitGrid,
  autofitFont,
} from "./fit.mjs";
export {
  flexAllocate,
  stack,
  columns,
  inset,
  placeBlock,
  titleChromeMetrics,
  partitionRegion,
  normalizeArrangement,
} from "./layout-flex.mjs";
export { normalizeLayoutData, resolveLayoutName } from "./normalize.mjs";
export { PACKS, layoutsInPack, packsForLayout } from "./packs.mjs";

import PptxGenJS from "pptxgenjs";
import { pathToFileURL } from "node:url";
import { basename, join, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

import { OUTPUT_DIR, ROOT } from "../paths.mjs";
import { loadConstructTheme, SLIDE_H_IN, SLIDE_W_IN } from "./theme.mjs";
import * as primitives from "./primitives.mjs";

/**
 * Run a construct deck module (.md via IR, or .mjs builder).
 */
export async function buildConstructDeck(
  deckModulePath,
  { themeName = "scientific", outName = null } = {},
) {
  const abs = resolve(ROOT, deckModulePath);

  if (abs.endsWith(".md")) {
    const text = await (await import("node:fs/promises")).readFile(abs, "utf8");
    const { buildConstructsFromMarkdownFile } = await import("../ir/to-constructs.mjs");
    return buildConstructsFromMarkdownFile(abs, text, {
      themeName,
      outName: outName ?? basename(abs, ".md"),
    });
  }

  const mod = await import(pathToFileURL(abs).href);
  const build = mod.default ?? mod.build;
  if (typeof build !== "function") {
    throw new Error(`Construct deck must export default async function: ${abs}`);
  }

  const theme = await loadConstructTheme(themeName);
  const pptx = new PptxGenJS();
  pptx.defineLayout({
    name: "SLIDE_16x9",
    width: SLIDE_W_IN,
    height: SLIDE_H_IN,
  });
  pptx.layout = "SLIDE_16x9";
  pptx.author = "ppt-gen";
  pptx.title = mod.title ?? basename(abs, ".mjs");

  const { ensureLayoutsLoaded, runLayout } = await import("./registry.mjs");
  await ensureLayoutsLoaded();

  const ctx = {
    pptx,
    theme,
    runLayout,
    ...primitives,
  };
  await build(ctx);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const stem = outName ?? basename(abs, ".mjs");
  const out = join(OUTPUT_DIR, `${stem}.pptx`);
  await pptx.writeFile({ fileName: out });
  return out;
}
