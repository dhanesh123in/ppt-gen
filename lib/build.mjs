import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import {
  DECKS_DIR,
  OUTPUT_DIR,
  ROOT,
  ensureDirs,
  themeDir,
} from "./paths.mjs";
import { browserEnv } from "./mermaid.mjs";
import { parseDeckMarkdown, resolveEngine } from "./ir/parse.mjs";
import { buildConstructsFromMarkdownFile } from "./ir/to-constructs.mjs";
import { preprocessDeck } from "./preprocess.mjs";
import { compileTheme } from "./theme/compile.mjs";
import { listThemes } from "./theme/tokens.mjs";
import { buildConstructDeck } from "./constructs/index.mjs";

export function deckPath(name) {
  const stem = name.replace(/\.md$/, "");
  const path = join(DECKS_DIR, `${stem}.md`);
  if (!existsSync(path)) {
    throw new Error(`Deck not found: ${path}`);
  }
  return path;
}

/**
 * Resolve a deck argument to an absolute path.
 * Accepts: quarterly-report | decks/foo.md | absolute path | constructs/*.mjs
 */
export function resolveDeckInput(input) {
  if (!input) throw new Error("Deck name or path required");
  if (existsSync(input)) return resolve(input);
  const fromRoot = resolve(ROOT, input);
  if (existsSync(fromRoot)) return fromRoot;
  if (input.endsWith(".mjs") || input.endsWith(".md")) {
    throw new Error(`Deck not found: ${input}`);
  }
  return deckPath(input);
}

function marpBin() {
  const local = join(ROOT, "node_modules", ".bin", "marp");
  if (existsSync(local)) return local;
  throw new Error(
    "Marp CLI not found. Run: npm install\nPDF/PPTX export also requires Chrome, Edge, or Firefox.",
  );
}

export async function compileAllThemes() {
  for (const name of listThemes()) {
    await compileTheme(name);
  }
}

async function renderMarp(builtPath, { format, themeName }) {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const stem = basename(builtPath, ".md");
  const out = join(OUTPUT_DIR, `${stem}.${format}`);
  const marp = marpBin();
  const themeCssParent = themeDir(themeName);

  const cmd = [builtPath, "--theme-set", themeCssParent];
  if (format === "pdf") cmd.push("--pdf");
  else if (format === "pptx") cmd.push("--pptx");
  cmd.push("-o", out, "--allow-local-files", "--no-stdin");

  const result = spawnSync(marp, cmd, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit",
    env: browserEnv(),
  });
  if (result.status !== 0) {
    throw new Error(`Marp failed with exit code ${result.status}`);
  }
  return out;
}

export async function renderDeck(
  name,
  { format = "pdf", theme = null, engine = null } = {},
) {
  await ensureDirs();
  const path = resolveDeckInput(name);

  if (path.endsWith(".mjs")) {
    return buildConstructDeck(path, {
      themeName: theme ?? "scientific",
      outName: basename(path, ".mjs"),
    });
  }

  const text = await readFile(path, "utf8");
  const ir = parseDeckMarkdown(text);
  const eng = resolveEngine(ir, engine);

  if (eng === "constructs") {
    return buildConstructsFromMarkdownFile(path, text, {
      themeName: theme || ir.meta.theme || "scientific",
      outName: basename(path, ".md"),
    });
  }

  const built = await preprocessDeck(path, { themeName: theme });
  const themeName = theme || ir.meta.theme || "scientific";
  return renderMarp(built, { format, themeName });
}

export async function buildAll(
  name,
  { format = "pdf", theme = null, engine = null } = {},
) {
  await compileAllThemes();
  return renderDeck(name, { format, theme, engine });
}
