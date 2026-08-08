/**
 * Normalize layout YAML to the shared v2 field model.
 * Accepts legacy short keys (h/d/k/v/head/outs) as aliases.
 */

function mapItem(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") return { label: raw };
  if (typeof raw !== "object") return { label: String(raw) };
  const label =
    raw.label ?? raw.h ?? raw.head ?? raw.name ?? raw.title ?? raw.text ?? null;
  const detail =
    raw.detail ?? raw.d ?? raw.description ?? raw.focus ?? raw.subtitle ?? null;
  const value = raw.value ?? raw.v ?? null;
  const out = { ...raw };
  if (label != null) out.label = String(label);
  if (detail != null) out.detail = String(detail);
  if (value != null) out.value = String(value);
  if (raw.horizon != null || raw.k != null) {
    out.horizon = String(raw.horizon ?? raw.k);
  }
  if (raw.outputs != null || raw.outs != null) {
    out.outputs = [...(raw.outputs ?? raw.outs ?? [])].map(String);
  }
  if (Array.isArray(raw.items)) {
    out.items = raw.items.map(mapItem).filter(Boolean);
  }
  if (Array.isArray(raw.bullets)) {
    out.bullets = raw.bullets.map(String);
  }
  return out;
}

function mapGroup(raw) {
  if (!raw || typeof raw !== "object") return null;
  const g = mapItem(raw);
  if (Array.isArray(raw.items)) g.items = raw.items.map(mapItem).filter(Boolean);
  if (Array.isArray(raw.columns)) {
    // journeyColumns legacy
    g.items = raw.columns.map(mapItem).filter(Boolean);
  }
  return g;
}

/** Layout name aliases → canonical registry name */
export const LAYOUT_ALIASES = {
  construct: null, // ignore
  roadmapPhases: "roadmap",
  roadmapphases: "roadmap",
  twoColumnThesis: "comparison",
  twocolumnthesis: "comparison",
  journeyColumns: "list-cards",
  journeycolumns: "list-cards",
  stageFlow: "steps-h",
  stageflow: "steps-h",
  kpiBands: "banded-list",
  kpibands: "banded-list",
  numberedSteps: "steps-v",
  numberedsteps: "steps-v",
  contentSlide: "title-body",
  contentslide: "title-body",
  matrix2x2: "matrix2x2",
  bcg: "matrix2x2",
  quadrant: "matrix2x2",
  "list-cards": "list-cards",
  listCards: "list-cards",
  "steps-h": "steps-h",
  stepsH: "steps-h",
  "steps-v": "steps-v",
  stepsV: "steps-v",
  "big-number": "big-number",
  bigNumber: "big-number",
  "banded-list": "banded-list",
  bandedList: "banded-list",
  "before-after": "before-after",
  beforeAfter: "before-after",
  "chart-callout": "chart-callout",
  chartCallout: "chart-callout",
  "issue-tree": "issue-tree",
  issueTree: "issue-tree",
  "waterfall-story": "waterfall-story",
  waterfallStory: "waterfall-story",
  "inverted-pyramid": "inverted-pyramid",
  invertedPyramid: "inverted-pyramid",
  "split-reverse": "split-reverse",
  splitReverse: "split-reverse",
  "figure-focus": "figure-focus",
  figureFocus: "figure-focus",
  "table-focus": "table-focus",
  tableFocus: "table-focus",
  "mermaid-focus": "mermaid-focus",
  mermaidFocus: "mermaid-focus",
  "title-body": "title-body",
  titleBody: "title-body",
};

export function resolveLayoutName(name) {
  const key = String(name);
  if (LAYOUT_ALIASES[key] != null) return LAYOUT_ALIASES[key];
  const lower = key.toLowerCase();
  if (LAYOUT_ALIASES[lower] != null) return LAYOUT_ALIASES[lower];
  // kebab already canonical
  return key;
}

/**
 * Normalize raw construct/layout YAML into shared fields.
 */
export function normalizeLayoutData(name, raw = {}) {
  const data = structuredClone(raw ?? {});
  const canonical = resolveLayoutName(name);

  // footer alias
  if (!data.footerLabel && data.footer) data.footerLabel = data.footer;

  // items from various legacy shapes
  if (!data.items) {
    if (Array.isArray(data.phases)) {
      data.items = data.phases.map(mapItem).filter(Boolean);
    } else if (Array.isArray(data.stages)) {
      data.items = data.stages.map(mapItem).filter(Boolean);
    } else if (Array.isArray(data.bands)) {
      data.items = data.bands.map(mapItem).filter(Boolean);
    } else if (Array.isArray(data.steps)) {
      data.items = data.steps.map(mapItem).filter(Boolean);
    } else if (Array.isArray(data.columns)) {
      data.items = data.columns.map(mapItem).filter(Boolean);
    } else if (Array.isArray(data.recs)) {
      data.items = data.recs.map(mapItem).filter(Boolean);
    }
  } else {
    data.items = data.items.map(mapItem).filter(Boolean);
  }

  if (Array.isArray(data.groups)) {
    data.groups = data.groups.map(mapGroup).filter(Boolean);
  }

  // comparison legacy left/right
  if (data.left && typeof data.left === "object") {
    data.left = mapItem(data.left);
    if (data.left.headline && !data.left.label) {
      /* keep both */
    }
    if (data.left.headline && !data.left.detail) {
      // headline is primary; bullets stay
    }
  }
  if (data.right && typeof data.right === "object") {
    data.right = mapItem(data.right);
  }

  // swimlane marks: allow {role, phase, label} or [row, col, label]
  if (Array.isArray(data.marks)) {
    data.marks = data.marks.map((m) => {
      if (Array.isArray(m)) {
        return { role: m[0], phase: m[1], label: m[2] };
      }
      return m;
    });
  }

  // roadmap: horizon from k
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      if (it.k && !it.horizon) it.horizon = String(it.k);
      if (it.outs && !it.outputs) it.outputs = [...it.outs].map(String);
    }
  }

  data._layout = canonical;
  data._sourceName = name;
  return data;
}
