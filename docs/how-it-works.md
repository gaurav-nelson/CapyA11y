---
title: How CapyA11y decides what to flag
tag: Understand
readtime: 4 min read
---

# How CapyA11y decides what to flag

**Outcome:** Form a correct mental model of static packs, autofix tiers, and optional runtime layers so results and false positives make sense.

## The pipeline in one sentence

You ask the CLI (or a Cursor skill) → `@capya11y/core` loads YAML packs → matches React/TSX AST → optionally `@capya11y/runtime` adds axe/tabbable/Guidepup → emitters format findings for humans or CI.

```
Developer → Ink TUI / Cursor skill → core.scan [--runtime|--url|--at] → YAML packs + runtime
```

## Three layers of truth

| Layer | Trust it for… | Do not expect… |
|-------|---------------|----------------|
| AST + YAML packs | PatternFly props, missing names, structural WCAG-shaped issues in source | Computed contrast, real focus rings, spoken AT output |
| `--runtime` / `--url` | axe-core (contrast, ARIA) and tabbable focus order in a browser | Real screen-reader phrasing |
| `--at` | VoiceOver / NVDA cursor walk + spoken phrases (macOS / Windows) | Running on Linux CI |

CT mounts inject `data-capya11y-source` so runtime hits can map back to files. Live URL findings use that attribute when present; otherwise they record against the page URL (`confidence: low`).

## Autofix tiers (why CI stays safe)

| Tier | Behavior |
|------|----------|
| `safe` | Structural props with known-correct values |
| `suggest` | Needs human copy; never silent auto-apply in `--safe` |
| `manual` | Flag only |

## Packs

- `wcag-core` — plain HTML/JSX mapped to [WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/)
- `patternfly-v6` — PatternFly React component APIs and a11y docs
- `runtime` — findings from axe / tabbable / Guidepup when runtime flags are set

## Why the TUI uses labels, not color alone

Severity always includes text (`ERR` / `WRN` / `INF`) and a symbol. Honor `NO_COLOR`, `FORCE_COLOR=0`, and `--plain`. Theme tokens live in `packages/cli/src/theme/tokens.ts`; `--theme high-contrast` brightens semantics for low-vision terminals.

## Product “moat” (for appraisers)

1. PatternFly pack + `pack.json` version metadata
2. Safe / suggest / manual remediation tiers
3. YAML packs owned by a11y leads
4. SARIF + evidence for 508/VPAT *engineering* narratives
5. `capya11y suggest` + Cursor approval loop (never silent label writes)

## You understand it when

- You can predict whether a contrast bug needs `--runtime`/`--url`.
- You know why a suggest-tier finding survived `fix --safe`.
- You treat evidence markdown as engineering input, not a signed ACR.

## Next steps

- Daily work: [Find and fix accessibility issues](/fix-accessibility)
- Runtime choices: [Catch issues static analysis misses](/runtime-scanning)
