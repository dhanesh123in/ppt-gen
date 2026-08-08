import { parse as parseYaml } from "yaml";

/**
 * Shared deck IR: frontmatter + slides with markdown segments and ::: layout blocks.
 *
 * Preferred:
 *   ::: layout matrix2x2
 *   title: ...
 *   :::
 *
 * Legacy alias (still accepted):
 *   ::: construct roadmapPhases
 */

const LAYOUT_RE =
  /^:::[\t ]*(?:layout|construct)[\t ]+([A-Za-z][A-Za-z0-9_-]*)[\t ]*\n([\s\S]*?)^:::[\t ]*$/gm;

export function parseFrontmatter(text) {
  if (!text.startsWith("---")) {
    return { meta: {}, body: text };
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) {
    return { meta: {}, body: text };
  }
  const raw = text.slice(3, end).replace(/^\n/, "");
  let meta = {};
  try {
    meta = parseYaml(raw) ?? {};
  } catch (err) {
    throw new Error(`Invalid frontmatter YAML: ${err.message}`);
  }
  const body = text.slice(end + 4).replace(/^\n/, "");
  return { meta, body };
}

export function splitSlideBodies(body) {
  const parts = [];
  let buf = [];
  const lines = body.split(/\r?\n/);
  let inFence = false;

  for (const line of lines) {
    if (/^:::/.test(line)) {
      inFence = !inFence;
      buf.push(line);
      continue;
    }
    if (!inFence && line.trim() === "---") {
      parts.push(buf.join("\n").trim());
      buf = [];
      continue;
    }
    buf.push(line);
  }
  parts.push(buf.join("\n").trim());
  return parts.filter((p) => p.length > 0);
}

export function parseSlideBody(raw) {
  const blocks = [];
  let last = 0;
  const re = new RegExp(LAYOUT_RE.source, LAYOUT_RE.flags);
  let match;
  while ((match = re.exec(raw)) !== null) {
    const before = raw.slice(last, match.index).trim();
    if (before) blocks.push({ type: "markdown", text: before });
    let data = {};
    const yamlText = match[2].trim();
    if (yamlText) {
      try {
        data = parseYaml(yamlText) ?? {};
      } catch (err) {
        throw new Error(
          `Invalid YAML in ::: layout ${match[1]}: ${err.message}`,
        );
      }
    }
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error(`Layout ${match[1]} data must be a YAML mapping`);
    }
    // type "layout" (preferred); "construct" kept as synonym for IR consumers
    blocks.push({ type: "layout", name: match[1], data });
    last = match.index + match[0].length;
  }
  const after = raw.slice(last).trim();
  if (after) blocks.push({ type: "markdown", text: after });
  if (blocks.length === 0) {
    blocks.push({ type: "markdown", text: "" });
  }
  return { raw, blocks };
}

/**
 * Extract leading ATX heading from markdown as title (and optional following paragraph as subtitle).
 */
export function extractHeading(markdown) {
  const lines = markdown.split(/\r?\n/);
  let title = null;
  let subtitle = null;
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const h = lines[i]?.match(/^#{1,2}\s+(.+)$/);
  if (h) {
    title = h[1].trim();
    i++;
    while (i < lines.length && !lines[i].trim()) i++;
    if (lines[i] && !lines[i].startsWith("#") && !lines[i].startsWith(":::")) {
      subtitle = lines[i].trim();
      i++;
    }
  }
  const rest = lines.slice(i).join("\n").trim();
  return { title, subtitle, rest };
}

export function parseDeckMarkdown(text) {
  const { meta, body } = parseFrontmatter(text);
  const slideBodies = splitSlideBodies(body);
  const slides = slideBodies.map((raw, index) => {
    const parsed = parseSlideBody(raw);
    return { index, ...parsed };
  });
  const hasLayouts = slides.some((s) =>
    s.blocks.some((b) => b.type === "layout" || b.type === "construct"),
  );
  return {
    meta,
    slides,
    hasConstructs: hasLayouts, // backward-compatible flag name
    hasLayouts,
    sourceText: text,
  };
}

/**
 * Resolve engine: constructs | marp
 * frontmatter.engine: constructs | marp | auto (default auto)
 */
export function resolveEngine(ir, override = null) {
  if (override === "constructs" || override === "marp") return override;
  const declared = String(ir.meta.engine ?? "auto").toLowerCase();
  if (declared === "constructs" || declared === "marp") return declared;
  return ir.hasLayouts || ir.hasConstructs ? "constructs" : "marp";
}
