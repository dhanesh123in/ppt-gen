export function renderTableMarkdown(rows, tokens, { maxRows = null } = {}) {
  let data = rows;
  if (maxRows != null) data = rows.slice(0, maxRows);
  if (data.length === 0) {
    throw new Error("Cannot render empty table");
  }

  const headerBg = tokens.tableHeaderBg();
  const zebraBg = tokens.tableZebraBg();
  const border = tokens.colors.border ?? "#3a3a5c";
  const fontPx = tokens.table.font_px;
  const fg = tokens.foreground;
  const onAccent = tokens.colors.onAccent ?? "#FFFFFF";
  // Prefer explicit header_fg; else contrast against header fill (not raw body fg —
  // dark themes used near-white fg on a light-looking fill and became unreadable).
  const headerFgRaw = tokens.table?.header_fg;
  const headerFg = headerFgRaw
    ? tokens.resolveRef(headerFgRaw)
    : (() => {
        const h = String(headerBg).replace(/^#/, "");
        const full =
          h.length === 3
            ? h
                .split("")
                .map((c) => c + c)
                .join("")
            : h.padStart(6, "0").slice(0, 6);
        const n = Number.parseInt(full, 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luma > 0.55 ? fg : onAccent;
      })();

  const columns = Object.keys(data[0]);
  const aligns = columns.map((col) => {
    const sample = data.find((r) => r[col] !== "" && r[col] != null)?.[col];
    return typeof sample === "number" || /^-?\d+(\.\d+)?$/.test(String(sample))
      ? "right"
      : "left";
  });

  const header = `| ${columns.join(" | ")} |`;
  const sep = `| ${aligns
    .map((a) => (a === "right" ? "---:" : ":---"))
    .join(" | ")} |`;
  const body = data
    .map(
      (row) =>
        `| ${columns.map((c) => String(row[c] ?? "")).join(" | ")} |`,
    )
    .join("\n");

  const mdTable = `${header}\n${sep}\n${body}`;

  return `<style scoped>
table {
  font-size: ${fontPx}px;
  border-collapse: collapse;
  width: 100%;
}
table th {
  background: ${headerBg};
  color: ${headerFg};
  padding: 0.4em 0.6em;
}
table td {
  border: 1px solid ${border};
  padding: 0.35em 0.6em;
  color: ${fg};
}
table tr:nth-child(even) {
  background: ${zebraBg};
}
</style>

${mdTable}
`;
}

export function getTableData(name, data) {
  if (!(name in data)) {
    throw new Error(
      `Unknown table data '${name}'. Available: ${Object.keys(data).sort().join(", ")}`,
    );
  }
  return data[name];
}

/**
 * Convert CSV row objects into PPTX-friendly { headers, rows } (string cells).
 */
export function csvRowsToTable(rows, { maxRows = null } = {}) {
  if (!rows?.length) return { headers: [], rows: [] };
  const data = maxRows != null ? rows.slice(0, maxRows) : rows;
  const headers = Object.keys(data[0]);
  return {
    headers,
    rows: data.map((row) => headers.map((h) => String(row[h] ?? ""))),
  };
}
