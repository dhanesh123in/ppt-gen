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
  color: ${fg};
  padding: 0.4em 0.6em;
}
table td {
  border: 1px solid ${border};
  padding: 0.35em 0.6em;
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
