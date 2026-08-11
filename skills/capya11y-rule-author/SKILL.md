---
name: capya11y-rule-author
description: >-
  Author or refine CapyA11y YAML accessibility rules for WCAG or PatternFly.
  Use when accessibility leads want new detect/fix rules, pack updates, or
  help translating PatternFly a11y docs into Vale-style YAML.
---

# CapyA11y rule author

## Workflow

1. Read [docs/rule-authoring.md](../../docs/rule-authoring.md) and an existing similar rule under `packages/rules-wcag/rules/` or `packages/rules-patternfly/rules/`.
2. Gather component guidance from PatternFly docs (MCP `searchPatternFlyDocs` / `usePatternFlyDocs` when available) or WCAG Understanding pages.
3. Draft a YAML rule with:
   - Stable `id` (`wcag-…` or `pf-…`)
   - `pack`: `wcag-core` or `patternfly-v6`
   - `wcag` criteria ids
   - `autofix` tier chosen conservatively (`safe` only for unambiguous props)
   - `detect` + optional `fix`
   - `education` + `helpUrl` + before/after `example`
4. Place the file in the correct pack directory.
5. Add or update a fixture under `packages/fixtures/` and run:

```bash
pnpm --filter @capya11y/core test
pnpm capya11y scan packages/fixtures/demo --plain
```

6. Prefer PF component props over hand-rolled ARIA when PF already exposes the accessible API.
