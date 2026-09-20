import { existsSync } from "node:fs";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

import { ASSETS_DIR, CACHE_DIR, ROOT } from "../paths.mjs";
import { contentHash, isCacheValid, writeCacheMeta } from "../cache.mjs";
import { resolveChromePath, browserEnv } from "../mermaid.mjs";
import { imageNaturalSize } from "./image-fit.mjs";

const require = createRequire(import.meta.url);
const MATH_DIR = join(ASSETS_DIR, "math");
const DISPLAY_RE = /\$\$([\s\S]+?)\$\$/g;
const INLINE_RE = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g;
const MATH_CACHE_TAG = "katex-v3-crop";

function katexPaths() {
  try {
    const katexMain = require.resolve("katex");
    const katexRoot = dirname(dirname(katexMain));
    return {
      katex: require("katex"),
      css: join(katexRoot, "dist", "katex.min.css"),
      fonts: join(katexRoot, "dist", "fonts"),
    };
  } catch {
    return null;
  }
}

function parseHex(hex) {
  const h = String(hex ?? "#1a1a2e").replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Crop screenshot to ink bounds so equations aren't letterboxed in a wide frame.
 */
async function cropMathPng(path, bgHex, pad = 28) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const src = await loadImage(path);
  const probe = createCanvas(src.width, src.height);
  const g = probe.getContext("2d");
  g.drawImage(src, 0, 0);
  const { data } = g.getImageData(0, 0, src.width, src.height);
  const bg = parseHex(bgHex);
  const tol = 28;
  let minX = src.width;
  let minY = src.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + x) * 4;
      const a = data[i + 3];
      if (a < 8) continue;
      const dr = Math.abs(data[i] - bg.r);
      const dg = Math.abs(data[i + 1] - bg.g);
      const db = Math.abs(data[i + 2] - bg.b);
      if (dr + dg + db <= tol) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return path;

  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(src.width, maxX + pad + 1);
  const y1 = Math.min(src.height, maxY + pad + 1);
  const w = x1 - x0;
  const h = y1 - y0;
  const out = createCanvas(w, h);
  const og = out.getContext("2d");
  og.fillStyle = bgHex;
  og.fillRect(0, 0, w, h);
  og.drawImage(src, x0, y0, w, h, 0, 0, w, h);
  await writeFile(path, out.toBuffer("image/png"));
  return path;
}

/**
 * Render LaTeX to PNG via KaTeX HTML + headless Chrome screenshot (cropped).
 */
export async function renderMathPng(latex, theme, { display = true } = {}) {
  const expr = String(latex).trim();
  const bg = theme.panel ?? theme.bg ?? "#1a1a2e";
  const fg = theme.ink ?? "#eaeaea";
  const hash = createHash("sha256")
    .update(expr)
    .update(bg)
    .update(fg)
    .update(String(display))
    .update(MATH_CACHE_TAG)
    .digest("hex")
    .slice(0, 16);
  const outPath = join(MATH_DIR, `math-${hash}.png`);
  const expectedHash = contentHash(expr, bg, fg, display, MATH_CACHE_TAG);

  if (
    await isCacheValid(CACHE_DIR, `math-${hash}`, {
      expectedHash,
      outputPath: outPath,
    })
  ) {
    return outPath;
  }

  await mkdir(MATH_DIR, { recursive: true });
  const kx = katexPaths();
  const chrome = resolveChromePath();

  if (kx && chrome) {
    let htmlBody;
    try {
      htmlBody = kx.katex.renderToString(expr, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      });
    } catch {
      htmlBody = `<code>${expr}</code>`;
    }

    const cssHref = `file://${kx.css}`;
    const winW = display ? 1400 : 900;
    const winH = display ? 360 : 220;
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<link rel="stylesheet" href="${cssHref}"/>
<style>
  html, body { margin: 0; padding: 0; background: ${bg}; color: ${fg}; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: ${winH}px;
    padding: 48px 64px;
    box-sizing: border-box;
  }
  .katex { color: ${fg}; font-size: ${display ? "2.75em" : "1.75em"}; }
  .katex-display { margin: 0; }
</style>
</head><body>${htmlBody}</body></html>`;

    const htmlPath = join(MATH_DIR, `math-${hash}.html`);
    await writeFile(htmlPath, html);
    try {
      const result = spawnSync(
        chrome,
        [
          "--headless=new",
          "--disable-gpu",
          "--hide-scrollbars",
          "--force-device-scale-factor=1",
          "--default-background-color=00000000",
          `--window-size=${winW},${winH}`,
          `--screenshot=${outPath}`,
          `file://${htmlPath}`,
        ],
        { encoding: "utf8", env: browserEnv(), cwd: ROOT },
      );
      if (result.status === 0 && existsSync(outPath)) {
        await cropMathPng(outPath, bg, display ? 36 : 20);
        await writeCacheMeta(CACHE_DIR, `math-${hash}`, {
          hashValue: expectedHash,
          output: outPath,
        });
        return outPath;
      }
    } finally {
      await unlink(htmlPath).catch(() => {});
    }
  }

  // Fallback: plain canvas text if katex/chrome unavailable
  const { createCanvas } = await import("@napi-rs/canvas");
  const fontSize = display ? 36 : 22;
  const padding = 32;
  const probe = createCanvas(10, 10).getContext("2d");
  probe.font = `italic ${fontSize}px ${theme.sans ?? "Helvetica Neue"}`;
  const textW = Math.ceil(probe.measureText(expr).width);
  const w = Math.min(1100, Math.max(240, textW + padding * 2));
  const h = display ? 120 : 64;
  const out = createCanvas(w, h);
  const g = out.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = `italic ${fontSize}px ${theme.sans ?? "Helvetica Neue"}`;
  g.textBaseline = "middle";
  g.fillText(expr, padding, h / 2);
  await writeFile(outPath, out.toBuffer("image/png"));
  await writeCacheMeta(CACHE_DIR, `math-${hash}`, {
    hashValue: expectedHash,
    output: outPath,
  });
  return outPath;
}

/**
 * Pull $$...$$ / $...$ from body text, render to images.
 */
export async function enrichContentWithMath(content, theme) {
  const images = [...(content.images ?? [])];
  let working = content.body ?? "";

  const replaceAll = async (re, display) => {
    const matches = [...working.matchAll(re)];
    for (const m of matches) {
      const path = await renderMathPng(m[1], theme, { display });
      const size = imageNaturalSize(path);
      images.push({
        path,
        w: size?.width ?? (display ? 900 : 600),
        h: size?.height ?? (display ? 160 : 72),
      });
      working = working.replace(m[0], "");
    }
  };

  await replaceAll(DISPLAY_RE, true);
  await replaceAll(INLINE_RE, false);
  working = working.replace(/\n{3,}/g, "\n\n").trim();

  return {
    ...content,
    images,
    body: working || null,
  };
}

/** Resolve equation layout latex field to a PNG path on data.media */
export async function attachEquationMedia(data, theme) {
  const latex = data.latex ?? data.equation;
  if (!latex) return data;
  const path = await renderMathPng(latex, theme, { display: true });
  const mathSize = imageNaturalSize(path);
  return {
    ...data,
    media: { ...(data.media ?? {}), path },
    mathPath: path,
    mathSize,
  };
}
