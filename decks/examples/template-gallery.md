---
theme: scientific
engine: constructs
title: Template gallery — consulting & scientific SmartArt
footerLabel: "PPT-GEN  ·  TEMPLATE GALLERY"
classification: Internal Only
logo: assets/brand/logo.svg
logoHeight: 40
logoWidth: 40
size: 16:9
---

::: layout cover
eyebrow: Template packs
title: |
  Smart visuals for
  consulting & science
subtitle: Fill YAML, get presentation-grade shapes that PowerPoint SmartArt rarely nails.
chip: GALLERY
panel: stats
panelCaption: LAYOUT VOCABULARY
stats:
  - { label: Consulting, value: "chevron · stair · venn · raci" }
  - { label: Scientific, value: "equation · hierarchy · KPI" }
  - { label: Chrome, value: "logo · footer · classification" }
:::

---

::: layout section
title: Consulting pack
subtitle: Argument, ownership, and action
:::

---

# items: [{ label, detail }] — max 5 steps
::: layout chevron
title: Process (chevron)
items:
  - { label: Discover, detail: Frame the problem }
  - { label: Diagnose, detail: Drivers & evidence }
  - { label: Design, detail: Options & tradeoffs }
  - { label: Deliver, detail: Pilot → scale }
:::

---

# items: [{ label, detail }] — ascending maturity
::: layout stair
title: Capability maturity
items:
  - { label: Ad hoc, detail: Heroics }
  - { label: Repeatable, detail: Playbooks }
  - { label: Managed, detail: Metrics }
  - { label: Optimized, detail: Feedback loops }
:::

---

# Prefer items: [left, right, overlap] — or left/right/overlap keys
::: layout venn-2
title: Where product and GTM must overlap
items:
  - { label: Product, detail: Surface + reliability }
  - { label: GTM, detail: Narrative + channels }
  - { label: Retention, detail: Habit loops }
:::

---

# marks use activity/role names (indices still work as legacy)
::: layout raci
title: Launch ownership
roles: [Product, Eng, Design, GTM]
activities:
  - PRD freeze
  - Architecture ADR
  - Beta cohort
  - Pricing page
marks:
  - { activity: PRD freeze, role: Product, value: A }
  - { activity: PRD freeze, role: Eng, value: C }
  - { activity: PRD freeze, role: Design, value: C }
  - { activity: Architecture ADR, role: Eng, value: A }
  - { activity: Architecture ADR, role: Product, value: C }
  - { activity: Beta cohort, role: Product, value: R }
  - { activity: Beta cohort, role: GTM, value: A }
  - { activity: Pricing page, role: GTM, value: A }
  - { activity: Pricing page, role: Product, value: C }
  - { activity: Pricing page, role: Design, value: I }
:::

---

# Place items with x/y: high|low (quadrant: tr still works)
::: layout matrix2x2
title: Prioritize the portfolio
axes: { x: Ease, y: Impact }
quadrants: { tl: Big bets, tr: Quick wins, bl: Ignore, br: Fill-ins }
items:
  - { label: Onboarding, x: high, y: high }
  - { label: Platform rewrite, x: low, y: high }
  - { label: Dark mode, x: high, y: low }
  - { label: Vanity dashboards, x: low, y: low }
:::

---

::: layout section
title: Scientific pack
subtitle: Structure, method, and results
:::

---

::: layout equation
title: Exponential smoothing
latex: "L_{t+1} = L_t + \\alpha (R_t - L_t)"
interpretation: Learning rate α trades responsiveness against noise in the experiment cadence.
:::

---

# Root item + nested items[] for children
::: layout hierarchy
title: System decomposition
items:
  - label: Inference stack
    detail: Serving path
    items:
      - { label: Router, detail: Policy + fallback }
      - { label: Experts, detail: MoE shards }
      - { label: Runtime, detail: Batching + KV }
:::

---

::: layout big-number
title: Result snapshot
items:
  - { label: Latency, value: "−38%", detail: p50 vs baseline }
  - { label: Quality, value: "+0.12", detail: Win rate }
  - { label: Cost, value: "0.7×", detail: Per 1k tokens }
:::

---

# arrangement: cols-2 | cols-3 | rows-2 | rows-3 | grid-2x2 | main-side | side-main | header-body
::: layout compose
title: Compose — two-up (columns)
arrangement: cols-2
slots:
  - layout: big-number
    title: Outcomes
    items:
      - { label: Latency, value: "−38%", detail: p50 }
      - { label: Quality, value: "+0.12", detail: Win rate }
  - layout: chevron
    title: Path
    align: start
    items:
      - { label: Frame, detail: Problem + options }
      - { label: Prove, detail: Pilot evidence }
      - { label: Scale, detail: Rollout plan }
:::

---

::: layout compose
title: Compose — side by side
arrangement: cols-2
slots:
  - layout: matrix2x2
    title: Portfolio
    axes: { x: Ease, y: Impact }
    items:
      - { label: Onboarding, x: high, y: high }
      - { label: Rewrite, x: low, y: high }
  - layout: raci
    title: Owners
    roles: [PM, Eng]
    activities: [Spec, Build]
    marks:
      - { activity: Spec, role: PM, value: A }
      - { activity: Build, role: Eng, value: R }
:::

---

::: layout compose
title: Compose — stacked (rows)
arrangement: rows-2
slots:
  - layout: banded-list
    title: Signals
    items:
      - { label: Adoption, value: "+18% WoW in pilot cohort" }
      - { label: Quality, value: "Win rate +0.12 vs control" }
      - { label: Cost, value: "p50 inference −11%" }
  - layout: steps-h
    title: Next three moves
    items:
      - { label: Lock metric, detail: One north-star }
      - { label: Expand cohort, detail: +2 segments }
      - { label: Decision gate, detail: Go / hold }
:::

---

::: layout compose
title: Compose — main + side stack
arrangement: main-side
slots:
  - layout: venn-2
    title: Overlap story
    items:
      - { label: Product, detail: Reliability }
      - { label: GTM, detail: Narrative }
      - { label: Retention, detail: Habit }
  - layout: big-number
    title: Signal
    items:
      - { label: NPS, value: "+12", detail: Trailing 90d }
  - layout: callout
    title: Decision
    body: Fund the habit-loop bet; pause vanity dashboards.
:::

---

::: layout closing
eyebrow: Next
title: Author in YAML. Render with ppt-gen.
subtitle: Pick a pack layout, fill items, regenerate — same visual language every time.
next: "See README · Template packs (consulting / scientific / core) · compose for multi-panel slides"
:::
