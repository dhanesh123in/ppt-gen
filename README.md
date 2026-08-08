<p align="center">
  <img src="assets/brand/logo.svg" alt="ppt-gen logo" width="96">
</p>

# ppt-gen

Unified design-system layer for [Marp](https://marp.app/) decks and native PowerPoint output. One `tokens.yaml` drives Marpit CSS, Chart.js plots, Mermaid diagrams, tables, and pptxgenjs layouts.

The CLI is **Node ESM** (`bin/ppt-gen.mjs`). Plots come from CSV via Chart.js; equations render through KaTeX + headless Chrome; diagrams use Mermaid CLI.

The logo is generated from theme colors when you compile a theme (`lib/brand.mjs`) and appears on every slide.

## Examples

| Deck | Source | Output |
|------|--------|--------|
| Product analytics roadmap (canonical) | [`decks/demo.md`](decks/demo.md) | [**demo.pptx**](examples/demo.pptx) |
| WhatsApp-class chat PRD | [`decks/examples/chat-product.md`](decks/examples/chat-product.md) | [chat-product.pptx](examples/chat-product.pptx) |
| Mixture-of-Experts LLMs | [`decks/examples/moe-llms.md`](decks/examples/moe-llms.md) | [moe-llms.pptx](examples/moe-llms.pptx) |
| Apparel retail markdown | [`decks/examples/apparel-markdown.md`](decks/examples/apparel-markdown.md) | [apparel-markdown.pptx](examples/apparel-markdown.pptx) |

```bash
npm run build:constructs
# or a specific deck:
node bin/ppt-gen.mjs constructs decks/examples/chat-product.md
```

Outputs land in `output/` (gitignored). Committed copies live under `examples/`.

## Requirements

- Node.js 18+
- Chrome (or Chromium) for:
  - Marp PDF/PPTX export
  - Mermaid diagrams (`mmdc`)
  - KaTeX equation screenshots

Optional: set `PUPPETEER_EXECUTABLE_PATH` if Chrome is not on the default path.

## Quick start

```bash
npm install
npm run theme:compile
npm run build:constructs          # demo → output/demo.pptx
open output/demo.pptx
```

Other commands:

```bash
node bin/ppt-gen.mjs compile-themes
node bin/ppt-gen.mjs all decks/demo.md --engine marp --format pdf
node bin/ppt-gen.mjs constructs decks/examples/moe-llms.md --theme light
```

## Authoring

### Frontmatter

```yaml
---
theme: scientific          # or light (see themes/)
engine: auto               # auto | constructs | marp
title: My deck
footerLabel: "PRODUCT  ·  DATA"
paginate: true
size: 16:9
# Optional overrides (merged onto the theme):
# colors: { background: "#1a1a2e", foreground: "#eaeaea", accent: "#e94560" }
# typography: { slide: { title_px: 48, heading_px: 30, body_px: 18 } }
# space: { cardGap: 24, titleBand: 100 }
---
```

`engine: auto` uses **pptxgenjs layouts** when the deck has any `::: layout` / `::: construct` block; otherwise Marp.

### Directives (plots, tables, diagrams, math)

```markdown
{{plot:quarterly | type=line | x=month | y=revenue_m}}
{{table:regions | max_rows=8}}
{{mermaid:architecture}}

$$L_{t+1} = L_t + \alpha (R_t - L_t)$$
```

- Plots: `data/<name>.csv` → Chart.js PNG (`type=line|bar`, `x=`, `y=`, `slot=full|half|square`)
- Tables: CSV → markdown / PPTX tables
- Mermaid: `mermaid/<name>.mmd`
- Display/inline math: `$$…$$` / `$…$` (KaTeX → PNG)

### Layout blocks

Fenced **layout** blocks (legacy `::: construct` still works):

````markdown
::: layout cover
eyebrow: Strategy
title: |
  A practical roadmap
  for product analytics
subtitle: Connect discovery, delivery and measurement.
chip: ROADMAP
panel: stats                 # signals | bars | stats | solid | photo | grid | none
panelStats:
  - { label: FOCUS, value: "12–18 mo" }
:::

::: layout big-number
title: Experience targets
items:
  - { label: Send→ack, value: "<150ms", detail: p50 }
:::

::: layout equation
title: Gating objective
latex: "p_i(x) = \\mathrm{softmax}(W_r x)_i"
interpretation: Top-k experts receive token x.
:::

::: layout matrix2x2
title: v1 scope cut
axes: { x: User value, y: Build cost }
quadrants: { tl: Defer, tr: Build now, bl: Skip, br: Partner }
items:
  - { label: 1:1 chat, quadrant: tr }
:::

::: layout split
title: Text + chart
items: [Insight one, Insight two]
media: { plot: regions, type: bar, x: region, y: revenue_m }
:::
````

Shared item fields: `label` / `detail` / `value` (plus layout-specific keys such as `horizon`, `outputs`, `quadrant`).

#### Built-in layouts

| Group | Names |
|-------|--------|
| Chrome | `cover`, `section`, `agenda`, `closing`, `title-body` |
| KPIs / lists | `big-number`, `banded-list`, `list-cards`, `callout`, `quote`, `comparison` |
| Process | `steps-h`, `steps-v`, `timeline`, `funnel`, `cycle`, `swimlane`, `roadmap` |
| Structure | `hierarchy`, `radial`, `pyramid`, `inverted-pyramid`, `issue-tree` |
| Strategy | `matrix2x2` (aliases: `bcg`, `quadrant`), `matrix3x3`, `waterfall-story`, `before-after` |
| Media | `split`, `split-reverse`, `figure-focus`, `table-focus`, `mermaid-focus`, `chart-callout`, `equation`, `code` |

Layouts live in [`lib/constructs/layouts/catalog.mjs`](lib/constructs/layouts/catalog.mjs) and register through the fit engine ([`lib/constructs/fit.mjs`](lib/constructs/fit.mjs)).

Images (plots, Mermaid, equations) are **contain-fitted** to keep native aspect ratio.

## Themes

Bundled themes:

- [`themes/scientific`](themes/scientific/tokens.yaml) — dark default
- [`themes/light`](themes/light/tokens.yaml) — light variant

Edit tokens (colors, typography, plot fonts, spacing, branding), then:

```bash
npm run theme:compile
```

### New theme

```bash
cp -r themes/scientific themes/acme
# edit themes/acme/tokens.yaml
node bin/ppt-gen.mjs compile-themes
```

Set `theme: acme` in deck frontmatter (or pass `--theme acme`).

## Workflow

1. Edit `themes/<name>/tokens.yaml` (and optional frontmatter overrides)
2. `npm run theme:compile`
3. Author `decks/*.md` with layouts + `{{plot}}` / `{{table}}` / `{{mermaid}}` / math
4. Build:
   - `npm run build:constructs` — hybrid PPTX (layouts + plots)
   - `npm run build:pdf` — Marp PDF path

Slides get a top-right logo and a license footer from `branding` in `tokens.yaml` (unless the deck sets its own `footer:`).

## Project layout

```
themes/scientific/tokens.yaml   # design tokens (also themes/light/)
assets/brand/logo.svg           # generated logo
decks/demo.md                   # canonical demo
decks/examples/                 # extra example decks
data/*.csv                      # plot + table sources
mermaid/*.mmd                   # diagram sources
lib/ir/                         # markdown → IR → marp | pptxgenjs
lib/constructs/                 # layouts, fit engine, KaTeX math, primitives
lib/charts/                     # Chart.js CSV plots
bin/ppt-gen.mjs                 # CLI
examples/                       # committed PPTX / PDF previews
output/                         # local builds (gitignored)
assets/plots|diagrams|math/     # generated (gitignored)
```

## License

- **Code:** [MIT](LICENSE)
- **Slide decks:** [CC BY-SA 4.0](decks/SLIDES_LICENSE)
