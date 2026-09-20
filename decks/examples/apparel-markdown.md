---
theme: scientific
engine: auto
marp: true
title: Markdown optimization for US apparel
footerLabel: "APPAREL  ·  MARKDOWN STRATEGY"
paginate: true
size: 16:9
---

::: layout cover
eyebrow: Retail strategy
title: |
  Markdown is leaking
  6–9 pts of margin
subtitle: A 12-month path to price with intent—not panic—across full-price, promo and clearance.
chip: BCG-STYLE
meta: For merchandising, planning and finance leaders
panel: grid
:::

---

::: layout section
title: The problem
subtitle: Clearance is running the P&L
:::

---

::: layout comparison
title: Reactive markdown vs intentional markdown
subtitle: Same inventory decisions; very different margin outcomes
left:
  label: Today
  headline: Late, blunt, channel-blind
  bullets:
    - Clearance rates climb after sell-through stalls
    - Promo and outlet compete with full-price
    - Planners lack a shared demand signal by SKU-size
right:
  label: Target
  headline: Early, SKU-aware, testable
  bullets:
    - Predict residual risk before week 6
    - Next-best price by cluster, not blanket %
    - Holdouts prove lift vs margin trade-off
northStar: Higher full-price mix without stranding inventory
:::

---

::: layout chart-callout
title: Clearance already destroys more margin than promo
items:
  - Clearance markdown rate ~41% of units
  - ~9.5 pts gross margin lost in that lane
  - Full-price is the only lane under control
media:
  plot: apparel_markdown
  type: bar
  x: channel
  y: margin_pts_lost
:::

---

## Full-price mix is eroding

{{plot:apparel_margin | type=line | x=month | y=full_price_mix_pct}}

Full-price mix fell from **61% → 47%** in six months—before peak holiday.

---

::: layout compose
title: Where to act — and what it buys
arrangement: cols-2
slots:
  - layout: matrix2x2
    title: Intervene first
    axes: { x: Sell-through risk, y: Unit contribution }
    quadrants: { tl: Protect, tr: Price now, bl: Exit, br: Test }
    items:
      - { label: Core basics, x: low, y: high }
      - { label: Seasonal fashion, x: high, y: high }
      - { label: Aged novelty, x: high, y: low }
      - { label: Test capsules, x: low, y: low }
  - layout: big-number
    title: Annual impact (illustrative)
    items:
      - { label: Margin recovery, value: +$18–28M, detail: Gross profit }
      - { label: Full-price mix, value: +4–6 pts, detail: Within 12 months }
      - { label: Aged inventory, value: −15–25%, detail: Weeks of supply }
:::

---

::: layout roadmap
title: Sequence the capability—not a one-off promo calendar
items:
  - horizon: 0–90 DAYS
    label: Diagnose & pilot
    color: coral
    detail: SKU risk scores + 2 categories
    outputs:
      - Residual demand model MVP
      - Markdown playbook v1
      - Holdout in 40 doors
  - horizon: 3–9 MONTHS
    label: Scale decisions
    color: blue
    detail: Planner workflow + guardrails
    outputs:
      - Next-best price service
      - Assortment linkage
      - Weekly margin readout
  - horizon: 9–18 MONTHS
    label: Optimize system
    color: lime
    detail: Cross-channel price fabric
    outputs:
      - Outlet / wholesale rules
      - Auto-clearance with caps
      - Finance-owned KPI pack
closing: Each gate requires a merchant owner and a stop / scale rule.
:::

---

::: layout swimlane
title: 90-day pilot squad
subtitle: Keep commercial ownership next to the algorithm
roles:
  - Merchandising
  - Planning
  - Data science
  - Stores / e-comm
  - Finance
phases:
  - label: Weeks 1–3
    color: cyan
  - label: Weeks 4–7
    color: blue
  - label: Weeks 8–12
    color: coral
marks:
  - { role: 0, phase: 0, label: Category charter }
  - { role: 1, phase: 0, label: Risk rules }
  - { role: 2, phase: 1, label: Model + holdout }
  - { role: 3, phase: 1, label: Execution path }
  - { role: 4, phase: 2, label: Margin gate }
criterion: A merchant owner, a price action, a measurement design, a clear stop / scale rule.
:::

---

::: layout closing
eyebrow: The decision
title: |
  Treat markdown as a
  decision system—not a fire drill.
subtitle: Start with two categories, one holdout design, and a finance co-owner.
items:
  - label: 1. Pick pilots
    detail: High-volume categories with residual risk
    color: cyan
  - label: 2. Prove incrementality
    detail: Holdouts on price depth and timing
    color: blue
  - label: 3. Scale the fabric
    detail: Reuse signals across channels
    color: coral
next: "Next step: convene the 90-day squad and lock the first two categories."
:::
