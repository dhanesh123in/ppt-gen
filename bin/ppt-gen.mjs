#!/usr/bin/env node
import {
  buildAll,
  compileAllThemes,
  deckPath,
  renderDeck,
} from "../lib/build.mjs";
import { preprocessDeck } from "../lib/preprocess.mjs";

function usage() {
  console.error(`Usage:
  node bin/ppt-gen.mjs compile-themes
  node bin/ppt-gen.mjs preprocess <deck> [--theme NAME]
  node bin/ppt-gen.mjs render <deck> [--format pdf|pptx|html] [--theme NAME]
  node bin/ppt-gen.mjs all <deck> [--format pdf|pptx|html] [--theme NAME]`);
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
      const path = await preprocessDeck(deckPath(deck), {
        themeName: flags.theme ?? null,
      });
      console.log(`Wrote ${path}`);
    } else if (command === "render") {
      const deck = positional[0];
      if (!deck) throw new Error("Deck name required");
      const out = await renderDeck(deck, {
        format: flags.format ?? "pdf",
        theme: flags.theme ?? null,
      });
      console.log(`Wrote ${out}`);
    } else if (command === "all") {
      const deck = positional[0];
      if (!deck) throw new Error("Deck name required");
      const out = await buildAll(deck, {
        format: flags.format ?? "pdf",
        theme: flags.theme ?? null,
      });
      console.log(`Wrote ${out}`);
    } else {
      usage();
      process.exit(command ? 1 : 0);
    }
  } catch (err) {
    console.error(`Error: ${err.message ?? err}`);
    process.exit(1);
  }
}

main();
