import { renderChartPng } from "./helpers.mjs";

function columnNames(rows) {
  return rows.length ? Object.keys(rows[0]) : [];
}

function isNumericColumn(rows, col) {
  return rows.every((r) => {
    const v = r[col];
    if (v === "" || v == null) return true;
    return typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v).trim());
  });
}

function inferX(rows, cols) {
  return cols.find((c) => !isNumericColumn(rows, c)) ?? cols[0];
}

function inferY(rows, cols, xCol) {
  return cols.filter((c) => c !== xCol && isNumericColumn(rows, c));
}

function parseYOption(yOpt) {
  if (!yOpt) return null;
  return String(yOpt)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build a Chart.js PNG from CSV rows — same simplicity as {{table:name}}.
 *
 * Options (directive pipe args):
 *   type=line|bar     default: line if ≥5 rows else bar
 *   x=column          category / axis column (default: first non-numeric)
 *   y=col1,col2       numeric series (default: all other numeric columns)
 *   slot=full         layout slot name
 */
export async function renderCsvPlot(name, rows, options, ctx) {
  if (!rows?.length) {
    throw new Error(`Plot '${name}' has no rows`);
  }

  const cols = columnNames(rows);
  const xCol = options.x ?? inferX(rows, cols);
  if (!cols.includes(xCol)) {
    throw new Error(
      `Plot '${name}': unknown x column '${xCol}'. Columns: ${cols.join(", ")}`,
    );
  }

  const yCols = parseYOption(options.y) ?? inferY(rows, cols, xCol);
  if (!yCols.length) {
    throw new Error(
      `Plot '${name}': no numeric y columns. Pass y=col or add numbers to the CSV.`,
    );
  }
  for (const y of yCols) {
    if (!cols.includes(y)) {
      throw new Error(
        `Plot '${name}': unknown y column '${y}'. Columns: ${cols.join(", ")}`,
      );
    }
  }

  const type =
    options.type ?? (rows.length >= 5 && yCols.length === 1 ? "line" : "bar");
  if (type !== "line" && type !== "bar") {
    throw new Error(`Plot '${name}': type must be line or bar (got '${type}')`);
  }

  const labels = rows.map((r) => String(r[xCol] ?? ""));
  const datasets = yCols.map((y, i) => {
    const color = ctx.color(i);
    const data = rows.map((r) => Number(r[y]));
    const base = {
      label: y,
      data,
      borderColor: color,
      backgroundColor: color,
    };
    if (type === "line") {
      const lw = ctx.tokens.plot.linewidth ?? 2;
      const ms = ctx.tokens.plot.markersize ?? 6;
      return {
        ...base,
        borderWidth: lw,
        pointRadius: ms / 2,
        pointHoverRadius: ms / 2 + 1,
        tension: 0.15,
      };
    }
    return {
      ...base,
      borderWidth: 0,
      borderRadius: 4,
      maxBarThickness: 48,
    };
  });

  return renderChartPng(ctx, () => ({
    type,
    data: { labels, datasets },
    options: {
      plugins: {
        legend: {
          display: yCols.length > 1,
          position: "top",
          align: "start",
        },
      },
      scales: {
        x: {
          title: { display: true, text: xCol },
        },
        y: {
          title: {
            display: true,
            text: yCols.length === 1 ? yCols[0] : "value",
          },
          grace: "8%",
        },
      },
    },
  }));
}
