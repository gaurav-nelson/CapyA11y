---
title: Architecture
tag: Guide
readtime: 3 min read
---

# CapyA11y architecture

CapyA11y (Capy-Ally) is a hybrid accessibility remediation agent:

1. **Declarative YAML rule packs** (WCAG Core + PatternFly v6)
2. **Shared TypeScript core** (`@capya11y/core`) — AST scan, match, fix, report
3. **Runtime engine** (`@capya11y/runtime`) — Playwright CT-style mount + axe-core + tabbable
4. **Ink React TUI CLI** (`@capya11y/cli`) — accessible interactive UX
5. **Cursor skills** — agent-driven fix / review / rule authoring

```
Developer → Ink TUI / Cursor skill → core.scan [--runtime] / core.applyFixes → YAML packs + runtime
```

## Runtime mode (`--runtime`)

When enabled, CapyA11y mounts each TSX/JSX component in headless Chromium (component isolation, no full app server), then:

| Open-source engine | What it covers |
|--------------------|----------------|
| axe-core / `@axe-core/playwright` | Computed color contrast, ARIA, WCAG 2.2 AA tags |
| tabbable + Playwright keyboard | Focus order + visible focus indicators |

CapyA11y injects `data-capya11y-source` on JSX nodes so runtime hits map back to source lines, then merges with static findings and PatternFly-aware remediation hints. Guidepup (VO/NVDA) is deferred.

```bash
pnpm exec playwright install chromium   # once
pnpm capya11y scan packages/fixtures/demo/RuntimeBroken.tsx --runtime --plain
```

## Autofix tiers

| Tier | Behavior |
|------|----------|
| `safe` | Structural props with known-correct values (`isLiveRegion`, `aria-hidden` on decorative icons) |
| `suggest` | Needs human copy (`aria-label` text); shown but not auto-applied in `--safe` |
| `manual` | Flag only |

## Packs

- `wcag-core` — plain HTML/JSX mapped to [WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/)
- `patternfly-v6` — PatternFly React component APIs and a11y docs
- `runtime` — findings from axe / tabbable when `--runtime` is set

## CI / agents

Prefer `capya11y scan . --json` / `--sarif` and `capya11y fix . --safe --plain` so output is machine-readable and color-independent.

See [CI and evidence](/ci-and-evidence) for GitHub Code Scanning, `--fail-on`, and VPAT evidence reports.

## Moat layers

1. PatternFly pack + `pack.json` version metadata (`patternflyVersion`)
2. Safe / suggest / manual remediation tiers
3. YAML packs authored by a11y leads
4. SARIF + evidence reports for 508/VPAT narratives
5. `capya11y suggest` + Cursor skill approval loop (never silent label writes)
