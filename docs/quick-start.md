---
title: Get your first finding and fix
tag: Try it
readtime: 5 min read
---

# Get your first finding and fix

**Outcome:** Install CapyA11y, scan the demo page, preview a safe fix, and see WCAG education in the terminal.

## Prerequisites

- Node 20+
- pnpm (`packageManager` in the repo root)
- About two minutes

## 1. Install and build

```bash
pnpm install
pnpm build
pnpm capya11y init --plain
```

You should see a `.capya11y.yml` and a short tip list. That means the CLI is wired.

## 2. See broken accessibility

Open `packages/fixtures/demo/BrokenPage.tsx` — intentional HTML and PatternFly gaps.

Then scan:

```bash
pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx
```

**Success:** The Ink TUI shows findings with severity labels (`ERR` / `WRN`), WCAG tags, and rule ids such as `pf-alert-toast-live-region`.

If you prefer logs or CI-style output:

```bash
pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx --plain
```

## 3. Preview a safe fix (no file writes)

```bash
pnpm capya11y fix packages/fixtures/demo/BrokenPage.tsx --safe --dry-run
```

**Success:** You see patches for structural issues (for example `isLiveRegion` on toast `AlertGroup`). Suggest-tier label copy is listed, not applied.

## 4. Learn why a rule matters

```bash
pnpm capya11y explain pf-button-icon-only-name --plain
```

**Success:** You get severity, WCAG, remediation, and education without leaving the terminal.

## Optional: explore other ways to run it

| Goal | Command / action |
|------|------------------|
| Confirm the tool itself is accessible | `NO_COLOR=1 pnpm capya11y scan … --plain` |
| Machine-readable output | `pnpm capya11y scan … --json \| head` |
| Fix from inside Cursor | On `BrokenPage.tsx`: “Fix accessibility issues with CapyA11y.” |

## You are done when

- Scan lists real findings on the demo file.
- `--safe --dry-run` shows at least one structural patch.
- `explain` returns education for a PatternFly rule.

## Next steps

- Day-to-day workflow: [Find and fix accessibility issues](/fix-accessibility)
- Gate merges: [Ship accessibility gates in CI](/ship-in-ci)
