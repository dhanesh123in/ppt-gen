import { createCanvas } from "@napi-rs/canvas";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend,
  Filler,
} from "chart.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Legend,
  Filler,
);

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function deepMerge(base, over) {
  if (!over) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      base[k] &&
      typeof base[k] === "object"
    ) {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Render a Chart.js config to PNG sized to the slide slot.
 * Renders at plot.dpi-derived devicePixelRatio (min 3×) so axis labels stay sharp in PPT.
 * @returns {Promise<Buffer>}
 */
export async function renderChartPng(ctx, buildConfig) {
  const { width, height } = ctx.canvasSize();
  const dpi = Number(ctx.tokens.dpi) || 288;
  // HiDPI decks + PowerPoint scaling need ≥3×; dpi 288 → 3, 384 → 4
  const dpr = Math.max(3, Math.round(dpi / 96));
  // Create at CSS size; Chart.js multiplies by devicePixelRatio (pre-sizing would triple it).
  const canvas = createCanvas(width, height);
  const tokens = ctx.tokens;
  const fg = tokens.foreground;
  const bg = tokens.facecolor;
  const border = tokens.colors.border ?? "#3a3a5c";
  const softBorder = hexToRgba(border, tokens.plot.grid_alpha ?? 0.25);
  const plotTypo = tokens.typography.plot;
  const fontFamily = "Helvetica Neue, Helvetica, Arial, sans-serif";
  // Extra size: axis titles are often rotated and look softer than ticks
  const tickPt = Math.max(18, Number(plotTypo.tick_pt) || 18);
  const axisTitlePt = Math.max(20, Number(plotTypo.base_pt) || 20);
  const legendPt = Math.max(16, Number(plotTypo.legend_pt) || 16);

  const userConfig = buildConfig(ctx);
  const defaults = {
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
    devicePixelRatio: dpr,
    font: { family: fontFamily },
    layout: { padding: { left: 8, right: 16, top: 10, bottom: 8 } },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "start",
        labels: {
          color: fg,
          font: { size: legendPt, family: fontFamily, weight: "500" },
          boxWidth: 14,
          padding: 10,
        },
      },
      title: {
        display: false,
        color: fg,
        font: {
          size: Number(plotTypo.title_pt) || 22,
          family: fontFamily,
          weight: "bold",
        },
        padding: { bottom: 12 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: fg,
          font: { size: tickPt, family: fontFamily, weight: "500" },
          maxTicksLimit: 6,
          padding: 10,
        },
        grid: { color: softBorder, lineWidth: 1 },
        border: { color: border },
        title: {
          display: false,
          color: fg,
          font: { size: axisTitlePt, family: fontFamily, weight: "600" },
          padding: { top: 12 },
        },
      },
      y: {
        ticks: {
          color: fg,
          font: { size: tickPt, family: fontFamily, weight: "500" },
          maxTicksLimit: 5,
          padding: 10,
        },
        grid: { color: softBorder, lineWidth: 1 },
        border: { color: border },
        title: {
          display: false,
          color: fg,
          font: { size: axisTitlePt, family: fontFamily, weight: "600" },
          padding: { bottom: 12 },
        },
      },
    },
  };

  const options = deepMerge(defaults, userConfig.options ?? {});
  if (options.plugins?.title) options.plugins.title.display = false;
  if (options.scales?.x?.title?.text) options.scales.x.title.display = true;
  if (options.scales?.y?.title?.text) options.scales.y.title.display = true;

  const chart = new Chart(canvas, {
    type: userConfig.type,
    data: userConfig.data,
    options,
    plugins: [
      {
        id: "pptBg",
        beforeDraw(c) {
          const { ctx: g, width: cw, height: ch } = c;
          g.save();
          g.globalCompositeOperation = "destination-over";
          g.fillStyle = bg;
          g.fillRect(0, 0, cw, ch);
          g.restore();
        },
      },
    ],
  });
  const buffer = canvas.toBuffer("image/png");
  chart.destroy();
  return buffer;
}

export async function savePngBuffer(buffer, path) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  return path;
}
