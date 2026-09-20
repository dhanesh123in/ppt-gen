<p align="center">
  <img src="assets/brand/logo.svg" alt="ppt-gen logo" width="96">
</p>

# ppt-gen

**Standardized visual templates for complex ideas** — consulting and scientific SmartArt-style layouts as fillable YAML, rendered to native PowerPoint.

One `tokens.yaml` drives colors, type, charts, Mermaid, and pptxgenjs layouts. Author `::: layout` blocks; regenerate decks in minutes with a consistent visual language PowerPoint SmartArt rarely achieves.

The CLI is **Node ESM** (`bin/ppt-gen.mjs`). Plots come from CSV via Chart.js; equations via KaTeX + Chrome; diagrams via Mermaid CLI. Marp remains an optional PDF path — **constructs PPTX is the product**.

## Examples

| Deck | Source | Output |
|------|--------|--------|
| Product analytics roadmap (canonical) | [`decks/demo.md`](decks/demo.md) | [**demo.pptx**](examples/demo.pptx) |
| Template gallery (SmartArt packs) | [`decks/examples/template-gallery.md`](decks/examples/template-gallery.md) | [template-gallery.pptx](examples/template-gallery.pptx) |
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
classification: Confidential   # optional center badge
logo: assets/brand/acme-mark.png  # optional; logo: false to hide
# logoHeight: 48
# logoWidth: 120
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
  - { label: 1:1 chat, x: high, y: high }   # or quadrant: tr
:::

::: layout split
title: Text + chart
items: [Insight one, Insight two]
media: { plot: regions, type: bar, x: region, y: revenue_m }
:::
````

Shared item fields: `label` / `detail` / `value` (plus layout-specific keys such as `horizon`, `outputs`, `x`/`y`).

#### SmartArt-style layouts

Fill `items` (and layout-specific keys); captions and flex spacing are handled by the layout engine. Full cookbook: [`decks/examples/template-gallery.md`](decks/examples/template-gallery.md).

````markdown
::: layout chevron
title: Process
items:
  - { label: Discover, detail: Frame the problem }
  - { label: Diagnose, detail: Drivers & evidence }
  - { label: Deliver, detail: Pilot → scale }
:::

::: layout venn-2
title: Where product and GTM overlap
items:
  - { label: Product, detail: Surface + reliability }
  - { label: GTM, detail: Narrative + channels }
  - { label: Retention, detail: Habit loops }
:::

::: layout raci
title: Launch ownership
roles: [Product, Eng, Design, GTM]
activities: [PRD freeze, Beta cohort, Pricing page]
marks:
  - { activity: PRD freeze, role: Product, value: A }
  - { activity: Beta cohort, role: GTM, value: A }
:::
````

Also: `stair` (maturity steps). RACI marks prefer **names**; numeric indices still work as legacy.

#### Template packs

Layouts are grouped in [`lib/constructs/packs.mjs`](lib/constructs/packs.mjs):

| Pack | Focus |
|------|--------|
| **core** | Cover, section, split, lists, media |
| **consulting** | Matrix, issue tree, roadmap, swimlane, chevron, stair, venn-2, RACI, waterfall… |
| **scientific** | Equation, figure/chart focus, hierarchy, results KPIs, method steps |

#### Built-in layouts

| Group | Names |
|-------|--------|
| Chrome | `cover`, `section`, `agenda`, `closing`, `title-body` |
| KPIs / lists | `big-number`, `banded-list`, `list-cards`, `callout`, `quote`, `comparison` |
| Process | `steps-h`, `steps-v`, `timeline`, `funnel`, `cycle`, `swimlane`, `roadmap`, `chevron`, `stair` |
| Structure | `hierarchy`, `radial`, `pyramid`, `inverted-pyramid`, `issue-tree`, `venn-2` |
| Strategy | `matrix2x2` (aliases: `bcg`, `quadrant`), `matrix3x3`, `waterfall-story`, `before-after`, `raci` |
| Media | `split`, `split-reverse`, `figure-focus`, `table-focus`, `mermaid-focus`, `chart-callout`, `equation`, `code` |

Layouts live in [`lib/constructs/layouts/`](lib/constructs/layouts/) (`catalog.mjs`, `smartart.mjs`). Placement uses the fit + flex engines ([`fit.mjs`](lib/constructs/fit.mjs), [`layout-flex.mjs`](lib/constructs/layout-flex.mjs)).

Images (plots, Mermaid, equations) are **contain-fitted** to keep native aspect ratio.

## Themes

Bundled themes:

- [`themes/scientific`](themes/scientific/tokens.yaml) — dark default
- [`themes/light`](themes/light/tokens.yaml) — light variant

Edit tokens (colors, typography, plot fonts, spacing, branding), then:

```bash
npm run theme:compile
```

### Custom logo

Put a mark in `assets/brand/` (or the theme folder) and point tokens at it:

```yaml
# themes/acme/tokens.yaml
branding:
  logo: acme-mark.png          # also: ../assets/brand/acme-mark.png
  logo_height_px: 48
  logo_width_px: 120           # optional; defaults to height (square)
  logo_top_px: 28
  logo_right_px: 36
  footer: "Acme · Q3 Strategy"
  classification: Confidential # center footer badge
  classification_tone: warn    # warn | muted | accent
```

Or override per deck (constructs PPTX):

```yaml
---
theme: scientific
logo: assets/brand/acme-mark.png
logoHeight: 48
logoWidth: 120
# logo: false                  # hide the mark
footerLabel: "ACME  ·  Q3 STRATEGY"
classification: Internal Only
---
```

Footer chrome is three parts: **left** deck label · **center** classification badge (when set) · **right** page number.

Omit `logo` to keep the generated ppt-gen mark. After changing theme logos, re-run `npm run theme:compile` for Marp CSS; constructs PPTX picks the file up at build time.

### New theme

```bash
cp -r themes/scientific themes/acme
# edit themes/acme/tokens.yaml
node bin/ppt-gen.mjs compile-themes
```

Set `theme: acme` in deck frontmatter (or pass `--theme acme`).

## Images in layouts

Use any of `image`, `picture`, `photo`, or `media` (string path or `{ path | plot | mermaid }`). Paths resolve from the repo root, `assets/`, `assets/brand/`, or the active theme directory.

| Layout | How to attach a picture |
|--------|-------------------------|
| `cover` | `panel: photo` + `image: assets/hero.png` |
| `split` / `split-reverse` | `media: assets/photo.jpg` or `media: { plot: regions, type: bar, … }` |
| `title-body` | optional `image:` → text left / picture right |
| `callout` | optional `image:` beside the quote |
| `section` | optional `image:` under the title |
| `figure-focus` / `chart-callout` | `media:` / `image:` fills the content area |
| `list-cards` | per-item `image:` thumbnail |

Example:

````markdown
::: layout cover
title: Launch day
panel: photo
image: assets/brand/hero.jpg
:::

::: layout title-body
title: Field notes
items:
  - Latency under load
  - Error budget burn
image: assets/screenshots/dashboard.png
:::

::: layout list-cards
title: Surfaces
items:
  - label: Mobile
    detail: iOS + Android
    image: assets/icons/mobile.png
:::
````

## Workflow

1. Edit `themes/<name>/tokens.yaml` (and optional frontmatter overrides)
2. `npm run theme:compile`
3. Author `decks/*.md` with layouts + `{{plot}}` / `{{table}}` / `{{mermaid}}` / math
4. Build:
   - `npm run build:constructs` — hybrid PPTX (layouts + plots)
   - `npm run build:pdf` — Marp PDF path

Slides get a top-right logo and a three-part footer (deck label · optional classification badge · page) from `branding` / frontmatter.

## Project layout

```
themes/scientific/tokens.yaml   # design tokens (also themes/light/)
assets/brand/logo.svg           # generated logo
decks/demo.md                   # canonical demo
decks/examples/                 # extra example decks (+ template-gallery)
data/*.csv                      # plot + table sources
mermaid/*.mmd                   # diagram sources
lib/ir/                         # markdown → IR → marp | pptxgenjs
lib/constructs/                 # layouts, fit, flex spacing, KaTeX, primitives
lib/constructs/layouts/         # catalog + smartart packs
lib/constructs/layout-flex.mjs  # responsive stack / flex allocate
lib/constructs/packs.mjs        # core / consulting / scientific packs
lib/charts/                     # Chart.js CSV plots
bin/ppt-gen.mjs                 # CLI
examples/                       # committed PPTX / PDF previews
output/                         # local builds (gitignored)
assets/plots|diagrams|math/     # generated (gitignored)
```

## License

- **Code:** [MIT](LICENSE)
- **Slide decks:** [CC BY-SA 4.0](decks/SLIDES_LICENSE)
