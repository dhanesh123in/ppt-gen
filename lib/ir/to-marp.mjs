import { extractHeading } from "./parse.mjs";
import { resolveLayoutName } from "../constructs/normalize.mjs";

/**
 * Turn layout blocks into readable Markdown for the Marp path.
 */
function layoutFallback(name, data) {
  const canonical = resolveLayoutName(name);
  const lines = [`<!-- layout:${canonical} → Marp fallback -->`, ""];
  if (data.title) lines.push(`### ${data.title}`, "");
  if (data.subtitle) lines.push(`*${data.subtitle}*`, "");

  const items = data.items ?? [];
  if (canonical === "comparison" || data.left || data.right) {
    if (data.left) {
      lines.push(
        `**${data.left.label ?? "Today"}:** ${data.left.headline ?? data.left.label ?? ""}`,
        "",
      );
      for (const b of data.left.bullets ?? []) lines.push(`- ${b}`);
      lines.push("");
    }
    if (data.right) {
      lines.push(
        `**${data.right.label ?? "Target"}:** ${data.right.headline ?? data.right.label ?? ""}`,
        "",
      );
      for (const b of data.right.bullets ?? []) lines.push(`- ${b}`);
      lines.push("");
    }
  } else if (canonical === "roadmap" || data.phases) {
    for (const p of data.items ?? data.phases ?? []) {
      lines.push(
        `**${p.horizon ?? p.k ?? ""} — ${p.label ?? p.name ?? ""}**`,
        "",
      );
      if (p.detail ?? p.focus) lines.push(`_${p.detail ?? p.focus}_`, "");
      for (const o of p.outputs ?? p.outs ?? []) lines.push(`- ${o}`);
      lines.push("");
    }
  } else if (canonical === "matrix2x2" || canonical === "matrix3x3") {
    if (data.axes) {
      lines.push(`Axes: ${data.axes.x ?? "?"} × ${data.axes.y ?? "?"}`, "");
    }
    for (const it of items) {
      lines.push(
        `- **${it.label}**${it.quadrant ? ` (${it.quadrant})` : ""}`,
      );
    }
    lines.push("");
  } else if (items.length) {
    for (const it of items) {
      const head = it.label ?? it.h ?? "";
      const detail = it.detail ?? it.d ?? it.value ?? "";
      lines.push(detail ? `- **${head}** — ${detail}` : `- ${head}`);
    }
    lines.push("");
  } else if (canonical === "cover" || canonical === "closing") {
    if (data.chip) lines.push(`\`${data.chip}\``, "");
    if (data.meta) lines.push(data.meta, "");
    if (data.next) lines.push(data.next, "");
  } else if (data.body) {
    lines.push(data.body, "");
  } else if (data.equation || data.latex) {
    lines.push(`$$${data.equation ?? data.latex}$$`, "");
  } else if (data.code) {
    lines.push("```", data.code, "```", "");
  }

  return lines.join("\n");
}

/**
 * Serialize IR back to Marp-compatible markdown (layouts → fallbacks).
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
      } else if (block.type === "layout" || block.type === "construct") {
        parts.push(layoutFallback(block.name, block.data));
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
