---
theme: scientific
engine: constructs
title: Product data roadmap
footerLabel: "PRODUCT  ·  DATA ROADMAP"
paginate: true
size: 16:9
---

::: layout cover
eyebrow: Strategy
title: |
  A practical roadmap
  for product analytics
subtitle: Connect discovery, delivery and measurement into one learning system over 12–18 months.
chip: ROADMAP
meta: For product, data and engineering leaders
panel: signals
signalLabels: [CUSTOMER, PRODUCT, CHANNEL]
:::

---

::: layout comparison
title: Every release should make the next decision sharper
subtitle: Move from fragmented metrics to a shared decision fabric.
left:
  label: Today
  headline: Signals live in silos
  bullets:
    - Product, growth and support dashboards disagree
    - Experiments optimize local KPIs, not portfolio outcomes
    - Roadmap bets lack a shared measurement design
right:
  label: Target
  headline: One decision loop
  bullets:
    - Shared identity and event taxonomy
    - Next-best action for surface and lifecycle
    - Incrementality tied to retention and margin
northStar: Faster learning with fewer wasted bets
:::

---

::: layout list-cards
title: Prioritize use cases that compound across the journey
subtitle: Start where decisions are frequent, measurable and owned.
items:
  - label: DISCOVER
    detail: Audience insight · Opportunity sizing
    color: cyan
  - label: CONSIDER
    detail: Personalized content · Fit / intent scoring
    color: blue
  - label: ACTIVATE
    detail: Next-best offer · In-product guidance
    color: coral
  - label: RETAIN
    detail: Churn early warning · Expansion plays
    color: lime
signalsLabel: Shared decision signals
signals:
  - Identity
  - Product context
  - Channel state
  - Inventory / capacity
  - Experiment exposure
:::

---

::: layout roadmap
title: "Sequence: prove the signal, scale decisions, then optimize"
subtitle: Each phase ships a production decision and a measurement design.
items:
  - horizon: 0–90 DAYS
    label: Prove the signal
    color: coral
    detail: Identity, baseline, 2–3 pilot use cases
    outputs:
      - Event taxonomy MVP
      - Measurement baseline
      - Pilot: reactivation
  - horizon: 3–9 MONTHS
    label: Scale the decisions
    color: blue
    detail: Reusable models and activation paths
    outputs:
      - Next-best-action service
      - CRM + in-product hooks
      - Always-on test engine
  - horizon: 9–18 MONTHS
    label: Optimize the system
    color: lime
    detail: Cross-surface optimization at scale
    outputs:
      - Budget via incrementality
      - Capacity-aware offers
      - Guarded automation
closing: Each phase ends with a stop / scale gate owned by a commercial lead.
:::

---

::: layout steps-h
title: Build a decision fabric—not one-off models
subtitle: Reusable foundations let new use cases launch in weeks.
items:
  - label: Collect
    detail: Shared events + identity
  - label: Decide
    detail: Models + policies
  - label: Act
    detail: Surface + CRM hooks
  - label: Learn
    detail: Holdouts + readout
:::

---

::: layout banded-list
title: Measure incremental value, not vanity engagement
subtitle: Every use case needs a test design before production.
items:
  - label: Reactivation
    value: Incremental retained revenue vs holdout
  - label: Next-best offer
    value: Margin-aware conversion lift
  - label: Guidance
    value: Time-to-value / activation rate
  - label: Churn warning
    value: Saved accounts net of outreach cost
:::

---

::: layout swimlane
title: Start with a 90-day launch team that can ship and learn
subtitle: Keep accountability close to commercial owners
roles:
  - Product
  - Data / ML
  - Eng
  - Growth
  - Finance
phases:
  - label: Weeks 1–3
    color: cyan
  - label: Weeks 4–7
    color: blue
  - label: Weeks 8–12
    color: coral
marks:
  - { role: 0, phase: 0, label: Use-case charter }
  - { role: 1, phase: 1, label: Model + holdout }
  - { role: 2, phase: 1, label: Hooks live }
  - { role: 3, phase: 2, label: Readout }
  - { role: 4, phase: 2, label: Stop / scale }
criterion: A commercial owner, a measurement design, and a clear stop / scale rule.
:::

---

::: layout closing
eyebrow: The decision
title: |
  Invest in a decision system—
  not isolated dashboards.
subtitle: Start with two journeys, one shared taxonomy, and a finance co-owner.
items:
  - label: 1. Pick pilots
    detail: High-frequency decisions with owners
    color: cyan
  - label: 2. Prove lift
    detail: Holdouts before scale
    color: blue
  - label: 3. Productize
    detail: Playbooks + coverage goals
    color: coral
next: "Next step: lock the 90-day squad and the first two journeys."
:::
