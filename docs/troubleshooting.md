---
title: Troubleshoot scans and fixes
tag: Unblock
readtime: 4 min read
---

# Troubleshoot scans and fixes

**Outcome:** Diagnose a stuck or surprising CapyA11y run and get back to a green scan or an intentional waiver.

## Scan finds nothing (but you expect issues)

1. Confirm the path includes `.tsx` / `.jsx` files.
2. Check `.capya11y.yml` — `checks.exclude`, empty `include` with `--do-not-auto-add-defaults`, or `ignoreRules`.
3. Search for `capya11y-ignore` above the element (reason after `--` is required or the ignore does not apply).
4. Run with `--plain` and no include filter: `pnpm capya11y scan ./src --plain`.

## Exit code is 0 in CI but Code Scanning is empty

- You need `--sarif` and `--out` (or `--format sarif --out …`), then upload the file.
- `--fail-on never` will not fail the job; use `error` or `warning`.

## `fix --safe` did not change a label

Expected: suggest-tier copy is never applied by `--safe`. Use `capya11y suggest` / Cursor approval, or edit manually.

## Runtime errors on stderr

Messages like `runtime: <file>: …` mean Playwright/CT/URL setup failed for that target; AST findings may still be present.

| Symptom | Likely fix |
|---------|------------|
| Browser not found | `pnpm exec playwright install chromium` |
| URL hang / timeout | App not listening; or wait for a ready selector via `--url-wait-for` |
| Module / JSX mount failure | File is not a mountable component; try `--url` against the running app instead |

## `--at` says unsupported or setup failed

| OS | Expectation |
|----|-------------|
| Linux | Real AT not supported — use `--url` / `--runtime` |
| macOS | Run `npx @guidepup/setup` (VoiceOver TCC) |
| Windows | Run `npx @guidepup/setup` (NVDA automation) |

AT failures are soft: other layers should still run. For opt-in tests, set `CAPYA11Y_AT=1` where the repo expects it.

## Live URL findings point at the URL, not a source file

Expected when the page lacks `data-capya11y-source`. Confidence is lower; fix in the component that rendered the node, or use `--runtime` on the TSX file.

## Rule missing from `rules list`

- Pack not enabled in `.capya11y.yml` / `--pack`.
- PatternFly version mismatch (`--patternfly-version`).
- Rebuild after editing YAML: `pnpm build`.

## Pre-commit too slow or too noisy

- Prefer lint-staged on `*.{tsx,jsx}` instead of whole-tree scan.
- Exclude known-noisy rules in config with a documented reason.
- Use temporary `ignoreRules` with a ticket id, not silent deletion of the check.

## Still stuck?

1. Reproduce with `--plain` and paste the command + last 30 lines of output.
2. Compare against the demo: `pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx --plain`.
3. Confirm mental model: [How CapyA11y decides what to flag](/how-it-works).

## You are unblocked when

- You can name the layer that failed (AST, runtime, AT, CI upload).
- You either have a green scan or a documented exception with a reason.
