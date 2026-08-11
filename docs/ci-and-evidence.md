# CI gate and evidence reports

## GitHub Actions

See [`.github/workflows/capya11y.yml`](../.github/workflows/capya11y.yml).

For a **product repository**, point the scan at your app source and fail the job on errors:

```bash
pnpm capya11y scan ./src --sarif --fail-on error --out capya11y.sarif
```

Upload `capya11y.sarif` with `github/codeql-action/upload-sarif`.

### Multi-format (single scan)

```bash
pnpm capya11y scan ./src \
  --format plain \
  --format sarif --out capya11y.sarif \
  --format evidence --out evidence.md \
  --fail-on error
```

One AST scan; multiple emitters.

## Pre-commit

See [pre-commit.md](./pre-commit.md) for husky / pre-commit snippets (`capya11y scan --fail-on error --plain`).

## Evidence / VPAT / ACR narrative

```bash
pnpm capya11y report ./src --out evidence.md
# after a fix run:
pnpm capya11y fix ./src --safe --evidence --out evidence.md
```

The report includes:

- Findings grouped by WCAG criterion
- An **ACR-oriented WCAG snapshot** with suggested Support placeholders (`Supports` / `Partially Supports` / `Does Not Support`) derived from open findings for **enabled packs only**
- Remediation log (applied + suggest-tier)
- **Accepted exceptions** (config `ignoreRules` and `capya11y-ignore` comments with reasons)
- A static-analysis disclaimer (not a conformance claim)

### Sample ACR disclaimer (always in the report)

> This report reflects **static AST analysis** of React/TSX source. It does **not** replace runtime axe testing, manual AT verification, or full ACT rule coverage. Criteria with no rules in the enabled packs are **Not Evaluated**.

## Local Fix-PR (not a GitHub Action)

```bash
pnpm capya11y pr ./src --safe --dry-run    # print title/body
pnpm capya11y pr ./src --safe              # branch + commit + gh pr create
```

Requires a clean git tree unless `--allow-dirty`. Uses `gh` when installed; otherwise prints push/PR instructions.

## Label suggestions (human approval)

```bash
pnpm capya11y suggest ./src --json
```

Every suggestion sets `requiresApproval: true`. Cursor skill `capya11y-fix` must propose refined copy and wait for approval before editing.
