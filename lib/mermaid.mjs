import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

import { MERMAID_DIR, ROOT, themeDir } from "./paths.mjs";

export function resolveChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export function browserEnv() {
  const chrome = resolveChromePath();
  const env = { ...process.env };
  if (chrome) {
    env.PUPPETEER_EXECUTABLE_PATH = chrome;
    env.CHROME_PATH = chrome;
  }
  return env;
}

export function mermaidSourcePath(name) {
  const path = join(MERMAID_DIR, `${name}.mmd`);
  if (!existsSync(path)) {
    throw new Error(`Mermaid diagram not found: ${path}`);
  }
  return path;
}

function mmdcBin() {
  const local = join(ROOT, "node_modules", ".bin", "mmdc");
  if (existsSync(local)) return local;
  return null;
}

export async function wrapMermaidSource(source, tokens) {
  const mermaidJson = join(themeDir(tokens.name), "mermaid.json");
  let config = { theme: "base", themeVariables: {} };
  if (existsSync(mermaidJson)) {
    config = JSON.parse(await readFile(mermaidJson, "utf8"));
  }
  const init = {
    theme: config.theme ?? "base",
    themeVariables: config.themeVariables ?? {},
  };
  if (source.trim().startsWith("%%{init")) return source;
  return `%%{init: ${JSON.stringify(init)}}%%\n${source}`;
}

export async function renderMermaid(name, tokens, outputPath) {
  const sourcePath = mermaidSourcePath(name);
  const wrapped = await wrapMermaidSource(
    await readFile(sourcePath, "utf8"),
    tokens,
  );
  await mkdir(dirname(outputPath), { recursive: true });

  const mmdc = mmdcBin();
  if (!mmdc) {
    throw new Error(
      "mmdc not found. Run: npm install\n(@mermaid-js/mermaid-cli is listed in package.json)",
    );
  }

  const tmp = `${outputPath}.mmd.tmp`;
  await writeFile(tmp, wrapped);
  try {
    const result = spawnSync(
      mmdc,
      ["-i", tmp, "-o", outputPath, "-b", tokens.facecolor],
      { encoding: "utf8", cwd: ROOT, env: browserEnv() },
    );
    if (result.status !== 0) {
      const stderr = (result.stderr || result.stdout || "").trim();
      throw new Error(`mmdc failed for diagram '${name}': ${stderr}`);
    }
  } finally {
    await unlink(tmp).catch(() => {});
  }

  return outputPath;
}
