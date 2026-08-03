import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  DECKS_DIR,
  OUTPUT_DIR,
  ROOT,
  ensureDirs,
  themeDir,
} from "./paths.mjs";
import { browserEnv } from "./mermaid.mjs";
import { preprocessDeck } from "./preprocess.mjs";
import { compileTheme } from "./theme/compile.mjs";
import { listThemes } from "./theme/tokens.mjs";

export function deckPath(name) {
  const stem = name.replace(/\.md$/, "");
  const path = join(DECKS_DIR, `${stem}.md`);
  if (!existsSync(path)) {
    throw new Error(`Deck not found: ${path}`);
  }
  return path;
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

export async function renderDeck(name, { format = "pdf", theme = null } = {}) {
  await ensureDirs();
  const path = deckPath(name);
  const built = await preprocessDeck(path, { themeName: theme });
  await mkdir(OUTPUT_DIR, { recursive: true });
  const stem = basename(path, ".md");
  const out = join(OUTPUT_DIR, `${stem}.${format}`);
  const marp = marpBin();
  const themeName = theme || "scientific";
  const themeCssParent = themeDir(themeName);

  const cmd = [built, "--theme-set", themeCssParent];
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

export async function buildAll(name, { format = "pdf", theme = null } = {}) {
  await compileAllThemes();
  return renderDeck(name, { format, theme });
}
