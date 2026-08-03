import { createCanvas } from "@napi-rs/canvas";
import {
  Chart,
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
 * Render a Chart.js config to PNG using token colors / slot size.
 * @returns {Promise<Buffer>}
 */
export async function renderChartPng(ctx, buildConfig) {
  const { width, height } = ctx.canvasSize();
  const canvas = createCanvas(width, height);
  const tokens = ctx.tokens;
  const fg = tokens.foreground;
  const bg = tokens.facecolor;
  const border = tokens.colors.border ?? "#3a3a5c";
  const softBorder = hexToRgba(border, tokens.plot.grid_alpha ?? 0.25);
  const plotTypo = tokens.typography.plot;

  const userConfig = buildConfig(ctx);
  const defaults = {
    responsive: false,
    animation: false,
    devicePixelRatio: 2,
    layout: { padding: { left: 8, right: 16, top: 8, bottom: 8 } },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "start",
        labels: {
          color: fg,
          font: { size: plotTypo.legend_pt },
          boxWidth: 12,
        },
      },
      title: {
        display: false,
        color: fg,
        font: { size: plotTypo.title_pt, weight: "bold" },
        padding: { bottom: 12 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: fg,
          font: { size: plotTypo.tick_pt },
          maxTicksLimit: 6,
        },
        grid: { color: softBorder, lineWidth: 1 },
        border: { color: border },
        title: {
          display: false,
          color: fg,
          font: { size: plotTypo.base_pt },
        },
      },
      y: {
        ticks: {
          color: fg,
          font: { size: plotTypo.tick_pt },
          maxTicksLimit: 5,
          callback: (v) => (typeof v === "number" ? v.toFixed(1) : String(v)),
        },
        grid: { color: softBorder, lineWidth: 1 },
        border: { color: border },
        title: {
          display: false,
          color: fg,
          font: { size: plotTypo.base_pt },
        },
      },
    },
  };

  const options = deepMerge(defaults, userConfig.options ?? {});
  if (options.plugins?.title?.text) options.plugins.title.display = true;
  if (options.scales?.x?.title?.text) options.scales.x.title.display = true;
  if (options.scales?.y?.title?.text) options.scales.y.title.display = true;

  const g = canvas.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);

  const chart = new Chart(canvas, {
    type: userConfig.type,
    data: userConfig.data,
    options,
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
