<p align="center">
  <img src="assets/brand/logo.svg" alt="ppt-gen logo" width="96">
</p>

# ppt-gen

Unified design-system layer for [Marp](https://marp.app/) decks. One `tokens.yaml` drives Marpit CSS, Chart.js plots, Mermaid diagrams, and tables.

The default CLI is **Node ESM** (`bin/ppt-gen.mjs`). The Python package under `ppt_gen/` remains in the tree but is unused by the npm scripts on this branch.

The logo is generated from theme colors when you compile a theme (`lib/brand.mjs`) and appears on every slide.

## Example

The [quarterly-report](decks/quarterly-report.md) deck shows what one `tokens.yaml` can produce: themed charts, pandas-style tables from CSV, and Mermaid diagrams in a single PDF.

**[Download quarterly-report.pdf](examples/quarterly-report.pdf)** · [Source markdown](decks/quarterly-report.md)

| Revenue trend | Regional breakdown | Pipeline architecture |
| :---: | :---: | :---: |
| ![Revenue trend slide](examples/quarterly-report.002.png) | ![Regional breakdown slide](examples/quarterly-report.003.png) | ![Pipeline architecture slide](examples/quarterly-report.004.png) |

## Requirements

- Node.js 18+
- Chrome, Edge, or Firefox (required by Marp CLI for PDF/PPTX export)

## Quick start

```bash
npm install

# Compile theme from tokens
npm run theme:compile

# Build example deck (preprocess + PDF)
npm run build:pdf
```

Or: `node bin/ppt-gen.mjs all quarterly-report`

Output: `output/quarterly-report.pdf` (a committed copy lives in `examples/`)

## Workflow

1. Edit `themes/scientific/tokens.yaml` for colors, fonts, layout, and branding
2. Run `npm run theme:compile`
3. Author slides in `decks/*.md` with directives:
   - `{{plot:revenue_trend}}` — Chart.js plot in `charts/`
   - `{{table:regions | max_rows=8}}`
   - `{{mermaid:architecture}}`
4. Run `npm run build:pdf` (or `node bin/ppt-gen.mjs all <deck-name>`)

Slides get a top-right logo and a license footer from `branding` in `tokens.yaml` (injected at preprocess time unless the deck sets its own `footer:`).

## Project layout

```
themes/scientific/tokens.yaml   # single source of truth
assets/brand/logo.svg           # generated project logo
decks/quarterly-report.md       # slide source
examples/quarterly-report.pdf   # built example for README / demos
charts/revenue_trend.mjs        # Chart.js plot modules
bin/ppt-gen.mjs                 # CLI entry
lib/                            # theme compile, preprocess, build
data/                           # CSV data for tables/plots
ppt_gen/                        # legacy Python (unused by npm scripts)
```

## New theme

```bash
cp -r themes/scientific themes/acme
# edit themes/acme/tokens.yaml
node bin/ppt-gen.mjs compile-themes
```

Set `theme: acme` in deck frontmatter.

## License

- **Code:** [MIT](LICENSE)
- **Slide decks:** [CC BY-SA 4.0](decks/SLIDES_LICENSE)
