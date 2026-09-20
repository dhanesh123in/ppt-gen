/**
 * Resolve color tokens in construct YAML (coral, blue, series.0, #hex, …).
 */
export function resolveColor(theme, value) {
  if (value == null) return undefined;
  if (typeof value !== "string") return value;
  const v = value.trim();
  if (v.startsWith("#")) return v;
  const named = {
    coral: theme.coral,
    accent: theme.accent,
    blue: theme.blue,
    cyan: theme.cyan,
    lime: theme.lime,
    orange: theme.orange,
    ink: theme.ink,
    muted: theme.muted,
    bg: theme.bg,
    panel: theme.panel,
    rule: theme.rule,
    white: theme.white,
  };
  if (v in named) return named[v];
  const series = v.match(/^series\.?(\d+)$/i) || v.match(/^series\[(\d+)\]$/i);
  if (series) {
    const i = Number(series[1]);
    return theme.series[i] ?? theme.accent;
  }
  return v;
}

function mapDeep(theme, node) {
  if (Array.isArray(node)) return node.map((x) => mapDeep(theme, x));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (
        (k === "color" || k.endsWith("Color") || k === "c") &&
        typeof v === "string"
      ) {
        out[k] = resolveColor(theme, v);
      } else if (k === "phases" || k === "columns" || k === "stages" || k === "bands" || k === "recs") {
        out[k] = mapDeep(theme, v);
      } else {
        out[k] = mapDeep(theme, v);
      }
    }
    return out;
  }
  return node;
}

/** Apply theme color name resolution across construct data. */
export function resolveConstructData(theme, data) {
  return mapDeep(theme, structuredClone(data));
}
