# CI gate and evidence reports

## GitHub Actions

See [`.github/workflows/capya11y.yml`](../.github/workflows/capya11y.yml).

For a **product repository**, point the scan at your app source and fail the job on errors:

```bash
pnpm capya11y scan ./src --sarif --fail-on error --out capya11y.sarif
```

Upload `capya11y.sarif` with `github/codeql-action/upload-sarif`.

## Evidence / VPAT narrative

```bash
pnpm capya11y report ./src --out evidence.md
# after a fix run:
pnpm capya11y fix ./src --safe --evidence --out evidence.md
```

The report groups findings by WCAG criterion, lists applied vs suggest-tier items, and states clearly that this is static AST analysis (not a full ACT/runtime audit).

## Label suggestions (human approval)

```bash
pnpm capya11y suggest ./src --json
```

Every suggestion sets `requiresApproval: true`. Cursor skill `capya11y-fix` must propose refined copy and wait for approval before editing.
