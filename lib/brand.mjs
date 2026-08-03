import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Mulberry32 PRNG — deterministic from seed (matches Python Random enough for logo layout). */
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromTokens(tokens) {
  const digest = createHash("sha256").update(tokens.name).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

function uniform(rng, min, max) {
  return min + rng() * (max - min);
}

export function buildLogoSvg(tokens) {
  const rng = mulberry32(seedFromTokens(tokens));
  const accent = tokens.colors.accent;
  const series = tokens.seriesColors;
  const border = tokens.colors.border ?? "#3a3a5c";
  const bg = tokens.facecolor;

  const cardW = 28;
  const cardH = 34;
  const cards = [
    [series[0], 2 + uniform(rng, 0, 1.5), 12 + uniform(rng, 0, 1.5)],
    [accent, 10 + uniform(rng, 0, 1.5), 7 + uniform(rng, 0, 1.5)],
    [
      series[1] ?? accent,
      18 + uniform(rng, 0, 1.5),
      2 + uniform(rng, 0, 1.5),
    ],
  ];

  const shapes = [];
  for (const [fill, x, y] of cards) {
    shapes.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cardW}" height="${cardH}" rx="4" fill="${fill}" stroke="${border}" stroke-width="1.5"/>`,
    );
    shapes.push(
      `<line x1="${(x + 5).toFixed(1)}" y1="${(y + 8).toFixed(1)}" x2="${(x + 20).toFixed(1)}" y2="${(y + 8).toFixed(1)}" stroke="${bg}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>`,
    );
    shapes.push(
      `<line x1="${(x + 5).toFixed(1)}" y1="${(y + 14).toFixed(1)}" x2="${(x + 17).toFixed(1)}" y2="${(y + 14).toFixed(1)}" stroke="${bg}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`,
    );
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" ' +
    'aria-label="ppt-gen logo">\n' +
    `  ${shapes.join("\n  ")}\n` +
    "</svg>\n"
  );
}

export async function ensureLogo(path, tokens) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buildLogoSvg(tokens));
  return path;
}
