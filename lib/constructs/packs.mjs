/**
 * Template packs: curated layout sets for thematic decks.
 * Core = always available; consulting / scientific are focus packs.
 */

export const PACKS = {
  core: {
    label: "Core",
    description: "Cover, section, agenda, split, media, and basic lists",
    layouts: [
      "cover",
      "section",
      "agenda",
      "closing",
      "title-body",
      "split",
      "split-reverse",
      "list-cards",
      "callout",
      "quote",
      "figure-focus",
      "table-focus",
      "mermaid-focus",
      "chart-callout",
    ],
  },
  consulting: {
    label: "Consulting",
    description: "Argument & action visuals — BCG, MECE, plans, ownership",
    layouts: [
      "comparison",
      "matrix2x2",
      "matrix3x3",
      "issue-tree",
      "waterfall-story",
      "before-after",
      "roadmap",
      "swimlane",
      "big-number",
      "banded-list",
      "steps-h",
      "steps-v",
      "timeline",
      "funnel",
      "chevron",
      "stair",
      "venn-2",
      "raci",
      "hierarchy",
      "pyramid",
      "inverted-pyramid",
      "cycle",
      "radial",
    ],
  },
  scientific: {
    label: "Scientific",
    description: "Results & method visuals — equations, figures, structure",
    layouts: [
      "equation",
      "code",
      "figure-focus",
      "chart-callout",
      "table-focus",
      "mermaid-focus",
      "hierarchy",
      "radial",
      "steps-v",
      "timeline",
      "big-number",
      "banded-list",
      "comparison",
      "callout",
      "pyramid",
      "cycle",
    ],
  },
};

export function layoutsInPack(packName) {
  return PACKS[packName]?.layouts ?? [];
}

export function packsForLayout(layoutName) {
  return Object.entries(PACKS)
    .filter(([, pack]) => pack.layouts.includes(layoutName))
    .map(([name]) => name);
}
