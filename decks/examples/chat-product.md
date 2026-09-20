---
theme: scientific
engine: auto
marp: true
title: Chat product — WhatsApp-class messaging
footerLabel: "PRODUCT  ·  REALTIME CHAT"
paginate: true
size: 16:9
---

::: layout cover
eyebrow: Product brief
title: |
  A messaging product
  built for trust at scale
subtitle: Requirements and architecture for a WhatsApp-class chat experience.
chip: PRD
meta: For product, engineering and design
panel: stats
panelStats:
  - { label: TARGET, value: "10M MAU" }
  - { label: SLO, value: "<150ms ack" }
  - { label: CRYPTO, value: "E2EE 1:1" }
:::

---

::: layout section
title: Problem & goals
subtitle: What we must nail on day one
:::

---

::: layout comparison
title: Why users stay (and leave)
left:
  label: Must-win
  headline: Reliability + privacy feel
  bullets:
    - Messages arrive in order, fast, offline-safe
    - End-to-end encryption by default on 1:1
    - Media that just works on weak networks
right:
  label: Nice-later
  headline: Differentiate after parity
  bullets:
    - Channels / communities at massive fanout
    - Rich business APIs
    - Multi-device without breaking E2EE story
northStar: Become the default private inbox for friends and family
:::

---

::: layout compose
title: Targets and journeys (v1)
arrangement: cols-2
slots:
  - layout: big-number
    title: Experience targets
    items:
      - label: Send→ack
        value: <150ms
        detail: p50 same region
      - label: Sync catch-up
        value: <2s
        detail: 24h offline
      - label: Group size
        value: 1k
        detail: Members v1
  - layout: list-cards
    title: Core journeys
    items:
      - label: 1:1 chat
        detail: Text, react, reply, delete
        color: cyan
      - label: Groups
        detail: Admin roles, mentions, invites
        color: blue
      - label: Media
        detail: Images, video, voice, docs
        color: coral
:::

---

::: layout banded-list
title: Non-functional requirements
items:
  - label: Security
    value: E2EE 1:1; group E2EE roadmap; device verification
  - label: Availability
    value: 99.95% message API; multi-AZ
  - label: Scale
    value: 10M MAU year-1; horizontal message plane
  - label: Compliance
    value: Age gates, report/block, regional data controls
:::

---

::: layout compose
title: Scope and message path
arrangement: cols-2
slots:
  - layout: matrix2x2
    title: v1 scope cut
    axes: { x: User value, y: Build cost }
    quadrants: { tl: Defer, tr: Build now, bl: Skip, br: Partner }
    items:
      - { label: 1:1 + receipts, x: high, y: high }
      - { label: Groups 1k, x: high, y: high }
      - { label: Status/stories, x: low, y: high }
      - { label: Payments, x: low, y: low }
  - layout: steps-h
    title: Message path
    items:
      - { label: Client, detail: Encrypt + queue }
      - { label: Gateway, detail: Auth + WS }
      - { label: Message svc, detail: Persist + fanout }
      - { label: Devices, detail: Sync + receipts }
:::

---

::: layout hierarchy
title: System ownership
items:
  - label: Chat platform
    items:
      - label: Messaging
      - label: Media
      - label: Presence / push
      - label: Identity / keys
:::

---

::: layout swimlane
title: 12-week build plan
roles:
  - Product
  - Client
  - Messaging
  - Media
  - SRE / security
phases:
  - label: Weeks 1–4
    color: cyan
  - label: Weeks 5–8
    color: blue
  - label: Weeks 9–12
    color: coral
marks:
  - { role: 0, phase: 0, label: PRD freeze }
  - { role: 1, phase: 0, label: Sync protocol }
  - { role: 2, phase: 1, label: Persist + fanout }
  - { role: 3, phase: 1, label: Upload pipeline }
  - { role: 4, phase: 2, label: Threat model sign-off }
criterion: Dogfood 1:1+groups E2EE on internal fleet with p99 send ack under SLO.
:::

---

::: layout chart-callout
title: Surface priority from comps
items:
  - 1:1 and groups dominate retention
  - Calls matter but trail chat DAU
  - Stories are growth—not retention—first
media:
  plot: chat_surfaces
  type: bar
  x: surface
  y: retention_d30
:::

---

::: layout funnel
title: Activation funnel (north-star)
items:
  - label: Install
  - label: Verify phone
  - label: Import contacts
  - label: First message sent
  - label: D7 return
:::

---

::: layout closing
eyebrow: Decision
title: |
  Ship private, reliable chat—
  then earn the right to expand.
subtitle: v1 = 1:1 + groups + media + receipts under clear SLOs and E2EE.
items:
  - label: 1. Freeze scope
    detail: Cut stories and payments from v1
    color: cyan
  - label: 2. Instrument SLOs
    detail: Ack latency, sync time, drop rate
    color: blue
  - label: 3. Dogfood hard
    detail: Internal fleet before public beta
    color: coral
next: "Next: approve architecture ADR and staff the 12-week squad."
:::
