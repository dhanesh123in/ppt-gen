import { extractHeading } from "./parse.mjs";

/**
 * Turn construct blocks into readable Markdown for the Marp path.
 */
function constructFallback(name, data) {
  const lines = [`<!-- construct:${name} → Marp fallback -->`, ""];
  if (data.title) lines.push(`### ${data.title}`, "");
  if (data.subtitle) lines.push(`*${data.subtitle}*`, "");

  if (name === "roadmapPhases" && data.phases) {
    for (const p of data.phases) {
      lines.push(`**${p.k ?? ""} — ${p.name ?? ""}**`, "");
      if (p.focus) lines.push(`_${p.focus}_`, "");
      for (const o of p.outs ?? []) lines.push(`- ${o}`);
      lines.push("");
    }
  } else if (name === "twoColumnThesis") {
    if (data.left) {
      lines.push(`**${data.left.label ?? "Today"}:** ${data.left.headline ?? ""}`, "");
      for (const b of data.left.bullets ?? []) lines.push(`- ${b}`);
      lines.push("");
    }
    if (data.right) {
      lines.push(`**${data.right.label ?? "Target"}:** ${data.right.headline ?? ""}`, "");
      for (const b of data.right.bullets ?? []) lines.push(`- ${b}`);
      lines.push("");
    }
  } else if (name === "journeyColumns" && data.columns) {
    for (const c of data.columns) {
      lines.push(`**${c.head}**`, "");
      for (const item of c.items ?? []) lines.push(`- ${item}`);
      lines.push("");
    }
  } else if (name === "stageFlow" && data.stages) {
    for (const s of data.stages) {
      lines.push(`- **${s.h}** — ${s.d ?? ""}`);
    }
    lines.push("");
  } else if (name === "kpiBands" && data.bands) {
    for (const b of data.bands) {
      lines.push(`- **${b.h}:** ${b.v}`);
    }
    lines.push("");
  } else if (name === "swimlane") {
    lines.push(`Roles: ${(data.roles ?? []).join(", ")}`, "");
    for (const p of data.phases ?? []) lines.push(`- ${p.h}`);
    lines.push("");
  } else if (name === "cover" || name === "closing") {
    if (data.chip) lines.push(`\`${data.chip}\``, "");
    if (data.meta) lines.push(data.meta, "");
    if (data.next) lines.push(data.next, "");
    for (const r of data.recs ?? []) {
      lines.push(`- **${r.h}** — ${r.d ?? ""}`);
    }
  } else {
    lines.push("```yaml", JSON.stringify(data, null, 2), "```", "");
  }
  return lines.join("\n");
}

/**
 * Serialize IR back to Marp-compatible markdown (constructs → fallbacks).
 */
export function irToMarpMarkdown(ir) {
  const meta = { ...ir.meta };
  delete meta.engine;
  if (meta.marp == null) meta.marp = true;
  if (!meta.theme) meta.theme = "scientific";
  if (meta.paginate == null) meta.paginate = true;
  if (!meta.size) meta.size = "16:9";

  const yamlLines = Object.entries(meta)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      if (typeof v === "boolean" || typeof v === "number") return `${k}: ${v}`;
      if (typeof v === "string" && (v.includes(":") || v.includes("#"))) {
        return `${k}: ${JSON.stringify(v)}`;
      }
      return `${k}: ${v}`;
    });

  const slides = ir.slides.map((slide) => {
    const parts = [];
    for (const block of slide.blocks) {
      if (block.type === "markdown") {
        parts.push(block.text);
      } else if (block.type === "construct") {
        parts.push(constructFallback(block.name, block.data));
      }
    }
    return parts.filter(Boolean).join("\n\n");
  });

  return `---\n${yamlLines.join("\n")}\n---\n\n${slides.join("\n\n---\n\n")}\n`;
}

export function mergeHeadingIntoConstruct(block, markdownBefore) {
  if (!markdownBefore?.trim()) return block.data;
  const { title, subtitle } = extractHeading(markdownBefore);
  const data = { ...block.data };
  if (title && !data.title) data.title = title;
  if (subtitle && !data.subtitle) data.subtitle = subtitle;
  return data;
}
