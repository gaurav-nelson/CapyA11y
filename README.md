# CapyA11y (Capy-Ally)

Automated accessibility remediation agent for React/TSX — with WCAG Core and PatternFly v6 rule packs, an accessible [Ink](https://github.com/vadimdemedes/ink) TUI, and Cursor agent skills.

## Quick start

```bash
pnpm install
pnpm build
pnpm capya11y scan packages/fixtures/demo
pnpm capya11y fix packages/fixtures/demo --safe --dry-run
pnpm capya11y explain pf-button-icon-only-name
```

## Commands

| Command | Description |
|---------|-------------|
| `capya11y scan <path>` | Find accessibility issues |
| `capya11y fix <path> --safe` | Apply safe autofixes |
| `capya11y fix <path> --dry-run` | Preview patches |
| `capya11y explain <rule-id>` | Just-in-time learning |
| `capya11y init` | Create `.capya11y.yml` |

Flags: `--json`, `--plain`, `--pack <name>`, `NO_COLOR=1`.

## Packages

- `@capya11y/core` — scan, match, fix, report
- `@capya11y/cli` — Ink TUI CLI
- `@capya11y/rules-wcag` — WCAG 2.2 AA starter pack
- `@capya11y/rules-patternfly` — PatternFly v6 starter pack
- `@capya11y/fixtures` — demo + test fixtures

## Docs

- [Architecture](docs/architecture.md)
- [Rule authoring](docs/rule-authoring.md)
- [TUI theme](docs/tui-theme.md)
- [Demo script](docs/demo-script.md)
