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
  newSlide,
} from "./primitives.mjs";
export {
  cover,
  closing,
  contentSlide,
  roadmapPhases,
  twoColumnThesis,
  journeyColumns,
  stageFlow,
  kpiBands,
  numberedSteps,
  swimlane,
} from "./layouts.mjs";

import PptxGenJS from "pptxgenjs";
import { pathToFileURL } from "node:url";
import { basename, join, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

import { OUTPUT_DIR, ROOT } from "../paths.mjs";
import { loadConstructTheme, SLIDE_H_IN, SLIDE_W_IN } from "./theme.mjs";
import * as primitives from "./primitives.mjs";
import * as layouts from "./layouts.mjs";

/**
 * Run a construct deck module.
 * Module default export: async function build(ctx)
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

  const ctx = {
    pptx,
    theme,
    ...primitives,
    ...layouts,
  };
  await build(ctx);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const stem = outName ?? basename(abs, ".mjs");
  const out = join(OUTPUT_DIR, `${stem}.pptx`);
  await pptx.writeFile({ fileName: out });
  return out;
}
