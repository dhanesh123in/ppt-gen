import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import { ASSETS_DIR, ROOT, THEMES_DIR } from "../paths.mjs";

/**
 * Resolve a user-supplied asset path (logo, photo, etc.).
 * Tries absolute, CWD-relative, repo-root, assets/, and optional theme dir.
 */
export function resolveAssetPath(ref, { themeName = null, baseDir = null } = {}) {
  if (ref == null || ref === false) return null;
  if (typeof ref === "object") {
    return resolveAssetPath(ref.path ?? ref.image ?? ref.file ?? ref.src, {
      themeName,
      baseDir,
    });
  }
  const raw = String(ref).trim();
  if (!raw) return null;

  const candidates = [];
  if (isAbsolute(raw)) candidates.push(raw);
  if (baseDir) candidates.push(resolve(baseDir, raw));
  candidates.push(resolve(ROOT, raw));
  candidates.push(join(ASSETS_DIR, raw));
  candidates.push(join(ASSETS_DIR, "brand", raw));
  candidates.push(join(ROOT, "assets", "brand", raw));
  if (themeName) {
    candidates.push(join(THEMES_DIR, themeName, raw));
    candidates.push(join(THEMES_DIR, themeName, "brand", raw));
  }

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/** First usable media path from layout YAML. */
export function mediaPathOf(data) {
  if (!data || typeof data !== "object") return null;
  const direct =
    data.media?.path ??
    data.image ??
    data.picture ??
    data.photo ??
    (typeof data.media === "string" ? data.media : null);
  if (direct) return direct;
  for (const key of ["right", "left", "main", "aside"]) {
    const slot = data.slots?.[key];
    if (typeof slot === "string") return slot;
    if (slot?.path) return slot.path;
  }
  return null;
}
