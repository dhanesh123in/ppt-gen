/**
 * Deprecated entry point — use decks/demo.md (shared markdown IR).
 *
 *   node bin/ppt-gen.mjs constructs decks/demo.md
 *   npm run build:constructs
 */
export const title = "Product data roadmap";

export default async function build() {
  throw new Error(
    "roadmap-demo.mjs is deprecated. Use decks/demo.md with:\n" +
      "  node bin/ppt-gen.mjs constructs decks/demo.md",
  );
}
