# CapyA11y architecture

CapyA11y (Capy-Ally) is a hybrid accessibility remediation agent:

1. **Declarative YAML rule packs** (WCAG Core + PatternFly v6)
2. **Shared TypeScript core** (`@capya11y/core`) — AST scan, match, fix, report
3. **Ink React TUI CLI** (`@capya11y/cli`) — accessible interactive UX
4. **Cursor skills** — agent-driven fix / review / rule authoring

```
Developer → Ink TUI / Cursor skill → core.scan / core.applyFixes → YAML packs
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

## CI / agents

Prefer `capya11y scan . --json` and `capya11y fix . --safe --plain` so output is machine-readable and color-independent.
