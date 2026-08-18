# CapyA11y (Capy-Ally)

Automated accessibility **remediation** agent for React/TSX — WCAG Core + PatternFly v6 rule packs, an accessible [Ink](https://github.com/vadimdemedes/ink) TUI, Cursor skills, CI SARIF, and VPAT-oriented evidence reports.

> PatternFly-native fixes developers trust. YAML rules a11y leads own. Just-in-time WCAG education — in the IDE and in CI.

## Quick start (60 seconds)

```bash
pnpm install
pnpm build
pnpm capya11y init --plain
pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx
pnpm capya11y fix packages/fixtures/demo/BrokenPage.tsx --safe --dry-run
pnpm capya11y explain pf-alert-toast-live-region --plain
pnpm capya11y suggest packages/fixtures/demo --json
pnpm capya11y report packages/fixtures/demo --out evidence.md
pnpm capya11y rules list --pack patternfly-v6
pnpm capya11y pr packages/fixtures/demo --safe --dry-run
```

## Commands

| Command | Description |
|---------|-------------|
| `capya11y scan <path>` | Find accessibility issues |
| `capya11y fix <path> --safe` | Apply safe autofixes |
| `capya11y fix <path> --dry-run` | Preview patches |
| `capya11y suggest <path>` | Propose suggest-tier labels (never auto-applies) |
| `capya11y report <path>` | Evidence / VPAT markdown report |
| `capya11y explain <rule-id>` | Just-in-time learning |
| `capya11y rules list` | Catalog loaded rules |
| `capya11y packs list` | List rule packs |
| `capya11y pr <path> --safe` | Local Fix-PR (branch + `gh pr create`) |
| `capya11y init` | Create `.capya11y.yml` + demo tips |

### CI / machine flags

| Flag | Purpose |
|------|---------|
| `--json` | Agent / script consumption |
| `--sarif` | GitHub Code Scanning |
| `--evidence` | Evidence markdown on scan |
| `--format <name>` | Repeatable: `plain`, `json`, `sarif`, `evidence`, `markdown` |
| `--fail-on error\|warning\|never` | CI gate |
| `--out <file>` | Write current `--format` output to disk |
| `--include` / `--exclude` | Rule governance (exclude wins) |
| `--pack <name>` | `wcag-core`, `patternfly-v6`, `pf`, … |
| `--patternfly-version v6` | Pack version selection |
| `--plain` / `NO_COLOR=1` | Accessible non-TUI output |
| `--runtime` | Mount TSX (Playwright CT) + axe-core + tabbable; merge with static |
| `--url <http...>` | Live app scan (axe + tabbable); path optional |
| `--at [auto\|voiceover\|nvda]` | Guidepup VoiceOver (macOS) / NVDA (Windows) |

## Why not just eslint / axe

1. **Design-system intelligence** — PatternFly props (`isLiveRegion`, `fieldId`, `navAriaLabel`), not only generic JSX.
2. **Remediation tiers** — `safe` / `suggest` / `manual` so CI can trust autofix.
3. **YAML packs a11y leads own** — Vale-style authorship without ESLint plugin PRs.
4. **Evidence export** — WCAG-mapped reports for Section 508 / VPAT engineering narratives.
5. **Hybrid agent** — deterministic core + Cursor skills for approved label copy.

## Packages

- `@capya11y/core` — scan, match, fix, SARIF, evidence, label suggest
- `@capya11y/runtime` — Playwright CT / live URL, axe-core, tabbable, Guidepup AT
- `@capya11y/cli` — Ink TUI CLI
- `@capya11y/rules-wcag` — WCAG 2.2 AA starter pack
- `@capya11y/rules-patternfly` — PatternFly v6 pack (+ Wizard, Drawer, DualList, …)
- `@capya11y/fixtures` — demo + test fixtures

Runtime setup (once): `pnpm exec playwright install chromium`  
AT setup (macOS/Windows): `npx @guidepup/setup`

## Docs site (DocsLit)

```bash
pnpm docs:dev        # http://localhost:3000
pnpm docs:validate   # links, frontmatter, sidebar
pnpm docs:build      # static site → docs-dist/
```

Source pages live under [`docs/`](docs/); site config is [`docslit.json`](docslit.json).

**Decide & try**
- [Is CapyA11y right for us?](docs/introduction.md)
- [Get your first finding and fix](docs/quick-start.md)

**Do the work**
- [Find and fix accessibility issues](docs/fix-accessibility.md)
- [Ship accessibility gates in CI](docs/ship-in-ci.md) — SARIF, evidence, pre-commit
- [Catch issues static analysis misses](docs/runtime-scanning.md) — `--runtime`, `--url`, `--at`
- [Add or change an accessibility rule](docs/author-a-rule.md)

**Understand / look up**
- [How CapyA11y decides what to flag](docs/how-it-works.md)
- [CLI reference](docs/cli-reference.md)
- [Troubleshoot scans and fixes](docs/troubleshooting.md)
