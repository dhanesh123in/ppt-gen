---
theme: scientific
engine: auto
marp: true
title: Mixture of Experts in LLMs
footerLabel: "ML SYSTEMS  ·  MIXTURE OF EXPERTS"
paginate: true
size: 16:9
---

::: layout cover
eyebrow: Architecture
title: |
  Mixture of Experts
  for large language models
subtitle: Sparse activation, dense capacity—how routing, load balance and capacity interact at scale.
chip: RESEARCH
meta: For ML engineers and research leads
panel: bars
panelCaption: EXPERT ACTIVATION
:::

---

::: layout section
title: Motivation
subtitle: Scale parameters without scaling FLOPs linearly
:::

---

::: layout comparison
title: Dense vs sparse activation
subtitle: Same peak capacity; different compute per token
left:
  label: Dense Transformer
  headline: Every parameter on every token
  bullets:
    - Compute grows with all layers × width
    - Simple training dynamics
    - Hard to add capacity without cost
right:
  label: Mixture of Experts
  headline: Few experts fire per token
  bullets:
    - Top-k routing selects specialists
    - Parameters grow faster than FLOPs
    - New failure modes — collapse & imbalance
northStar: More capacity per watt when routing is healthy
:::

---

::: layout hierarchy
title: Canonical MoE block
items:
  - label: MoE layer
    items:
      - label: Router (gating net)
      - label: Expert FFNs
      - label: Combine / residual
:::

---

## Expert load is uneven in practice

{{plot:moe_routing | type=bar | x=expert | y=tokens_pct}}

Without balancing, a few experts absorb most tokens—others starve.

---

::: layout equation
title: Gating and load-balance objective
latex: "p_i(x) = \\mathrm{softmax}(W_r x)_i"
interpretation: Top-k experts receive token x; auxiliary load-balance loss penalizes deviation from uniform expert usage.
:::

---

## Router → experts → train constraints

{{mermaid:moe}}

---

::: layout steps-h
title: Forward pass (simplified)
items:
  - label: Embed
    detail: Token → hidden state
    color: cyan
  - label: Route
    detail: Softmax over experts
    color: blue
  - label: Expert FFN
    detail: Top-k compute
    color: coral
  - label: Merge
    detail: Weighted sum + residual
    color: lime
:::

---

::: layout banded-list
title: Failure modes to monitor
items:
  - label: Collapse
    value: Router picks 1–2 experts always
  - label: Imbalance
    value: Capacity overflow / dropped tokens
  - label: Under-train
    value: Rare experts never specialize
  - label: Latency tails
    value: Hot experts dominate p99
:::

---

::: layout matrix2x2
title: Design choices
axes:
  x: Routing complexity
  y: Capacity efficiency
quadrants:
  tl: Hash / static
  tr: Learned top-k
  bl: Dense baseline
  br: Soft MoE / expert choice
items:
  - label: Switch / GShard
    quadrant: tr
  - label: Expert Choice
    quadrant: br
  - label: Dense LLaMA-style
    quadrant: bl
  - label: Token hashing
    quadrant: tl
:::

---

::: layout big-number
title: Typical operating points (illustrative)
items:
  - label: Experts
    value: 8–64
    detail: Per MoE layer
  - label: Top-k
    value: 1–2
    detail: Active per token
  - label: Params
    value: 4–10×
    detail: vs dense iso-FLOP
  - label: Aux loss
    value: λ≈0.01
    detail: Load balance weight
:::

---

::: layout pyramid
title: Stack to get right (bottom → top)
items:
  - label: Serving
    detail: Batching + expert parallelism
  - label: Training recipe
    detail: Aux loss, capacity factor
  - label: Router design
    detail: Top-k, noise, z-loss
  - label: Expert FFN
    detail: Width, specialization
:::

---

::: layout closing
eyebrow: Takeaway
title: |
  MoE buys capacity—
  only if routing stays healthy.
subtitle: Instrument expert usage, capacity drops and latency tails as first-class metrics.
items:
  - label: 1. Start sparse carefully
    detail: Few layers, strong aux loss
    color: cyan
  - label: 2. Watch balance
    detail: Per-expert token share dashboards
    color: blue
  - label: 3. Scale experts later
    detail: After collapse is controlled
    color: coral
next: "Next: reproduce a 8-expert top-2 layer and plot token share over training."
:::
