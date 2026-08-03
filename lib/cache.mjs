import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export function contentHash(...parts) {
  const payload = JSON.stringify(parts, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function cacheMetaPath(cacheDir, key) {
  return join(cacheDir, `${key}.json`);
}

export async function isCacheValid(cacheDir, key, { expectedHash, outputPath }) {
  const meta = cacheMetaPath(cacheDir, key);
  if (!existsSync(meta) || !existsSync(outputPath)) return false;
  const stored = JSON.parse(await readFile(meta, "utf8"));
  return stored.hash === expectedHash;
}

export async function writeCacheMeta(cacheDir, key, { hashValue, output }) {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(
    cacheMetaPath(cacheDir, key),
    JSON.stringify({ hash: hashValue, output: String(output) }),
  );
}
