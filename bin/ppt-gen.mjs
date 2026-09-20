#!/usr/bin/env node
import { resolve } from "node:path";

import {
  buildAll,
  compileAllThemes,
  renderDeck,
  resolveDeckInput,
} from "../lib/build.mjs";
import { buildConstructDeck } from "../lib/constructs/index.mjs";
import { ROOT } from "../lib/paths.mjs";
import { preprocessDeck } from "../lib/preprocess.mjs";

function usage() {
  console.error(`Usage:
  node bin/ppt-gen.mjs compile-themes
  node bin/ppt-gen.mjs preprocess <deck> [--theme NAME]
  node bin/ppt-gen.mjs render <deck|path.md> [--format pdf|pptx|html] [--theme NAME] [--engine marp|constructs|auto]
  node bin/ppt-gen.mjs all <deck|path.md> [--format pdf|pptx|html] [--theme NAME] [--engine marp|constructs|auto]
  node bin/ppt-gen.mjs constructs <path.md|.mjs> [--theme NAME] [--out NAME]

Shared markdown: use ::: layout <name> YAML blocks (::: construct still accepted). engine: auto|marp|constructs in frontmatter.`);
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift();
  if (!command) return { command: null };

  const positional = [];
  const flags = {};
  while (args.length) {
    const a = args.shift();
    if (a === "--format" || a === "-f") flags.format = args.shift();
    else if (a === "--theme") flags.theme = args.shift();
    else if (a === "--out") flags.out = args.shift();
    else if (a === "--engine") flags.engine = args.shift();
    else if (a.startsWith("-")) {
      throw new Error(`Unknown flag: ${a}`);
    } else positional.push(a);
  }
  return { command, positional, flags };
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    usage();
    process.exit(1);
  }

  const { command, positional = [], flags = {} } = parsed;
  try {
    if (command === "compile-themes") {
      await compileAllThemes();
      console.log("Themes compiled.");
    } else if (command === "preprocess") {
      const deck = positional[0];
      if (!deck) throw new Error("Deck name required");
      const path = await preprocessDeck(resolveDeckInput(deck), {
        themeName: flags.theme ?? null,
      });
      console.log(`Wrote ${path}`);
    } else if (command === "render") {
      const deck = positional[0];
      if (!deck) throw new Error("Deck name required");
      const out = await renderDeck(deck, {
        format: flags.format ?? "pdf",
        theme: flags.theme ?? null,
        engine: flags.engine ?? null,
      });
      console.log(`Wrote ${out}`);
    } else if (command === "all") {
      const deck = positional[0];
      if (!deck) throw new Error("Deck name required");
      const out = await buildAll(deck, {
        format: flags.format ?? "pdf",
        theme: flags.theme ?? null,
        engine: flags.engine ?? null,
      });
      console.log(`Wrote ${out}`);
    } else if (command === "constructs") {
      const deckFile = positional[0];
      if (!deckFile) throw new Error("Construct deck path required (.md or .mjs)");
      const abs = resolve(ROOT, deckFile);
      const out = await buildConstructDeck(abs, {
        themeName: flags.theme ?? "scientific",
        outName: flags.out ?? null,
      });
      console.log(`Wrote ${out}`);
    } else {
      usage();
      process.exit(command ? 1 : 0);
    }
  } catch (err) {
    console.error(`Error: ${err.message ?? err}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
