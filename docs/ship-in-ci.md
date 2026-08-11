---
title: Ship accessibility gates in CI
tag: Do this
readtime: 6 min read
---

# Ship accessibility gates in CI

**Outcome:** Fail merges on accessibility errors, publish SARIF, and produce an evidence markdown file useful for VPAT/ACR *engineering* drafts.

## Prerequisites

- CapyA11y available in CI (`pnpm install` + `pnpm build`, or packaged CLI)
- Path to app source
- Decision: fail on `error` only, or also `warning`

## 1. Gate the pull request

```bash
pnpm capya11y scan ./src --sarif --fail-on error --out capya11y.sarif
```

Upload `capya11y.sarif` with `github/codeql-action/upload-sarif`.

This repository’s example workflow: `.github/workflows/capya11y.yml`.

**Success:** PRs that introduce `error`-severity findings fail the job; SARIF appears in Code Scanning.

## 2. Emit several formats from one scan

```bash
pnpm capya11y scan ./src \
  --format plain \
  --format sarif --out capya11y.sarif \
  --format evidence --out evidence.md \
  --fail-on error
```

One AST pass; multiple emitters. Prefer `--plain` / `--json` / `--sarif` in CI so color is not required.

## 3. Produce evidence after remediation

```bash
pnpm capya11y report ./src --out evidence.md
# or after fixes:
pnpm capya11y fix ./src --safe --evidence --out evidence.md
```

The report includes:

- Findings grouped by WCAG criterion
- An **ACR-oriented WCAG snapshot** with suggested Support placeholders for **enabled packs only**
- Remediation log (applied + suggest-tier)
- **Accepted exceptions** (`ignoreRules` and `capya11y-ignore` with reasons)
- A static-analysis disclaimer (not a conformance claim)

<wc-callout type="warning" title="Disclaimer (always treat as true)">
  Evidence reflects analysis of React/TSX (and optional runtime layers you enable). It does not replace runtime axe, manual AT verification, or full ACT coverage. Criteria with no rules in enabled packs are Not Evaluated.
</wc-callout>

## 4. Block bad commits on the laptop

### husky + lint-staged

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

`.husky/pre-commit`:

```sh
#!/usr/bin/env sh
pnpm exec lint-staged
```

`package.json`:

```json
{
  "lint-staged": {
    "*.{tsx,jsx}": "capya11y scan --fail-on error --plain"
  }
}
```

Whole-tree gate (slower):

```sh
#!/usr/bin/env sh
pnpm capya11y scan ./src --fail-on error --plain
```

### pre-commit framework

```yaml
repos:
  - repo: local
    hooks:
      - id: capya11y
        name: capya11y a11y scan
        entry: pnpm capya11y scan . --fail-on error --plain
        language: system
        pass_filenames: false
        types_or: [tsx, jsx]
```

## 5. Govern noise without hiding debt

- Prefer `checks.exclude` for permanently out-of-scope rules (document why in PR).
- Prefer `ignoreRules` / `capya11y-ignore` with a ticket reason for temporary waivers.
- Prefer `capya11y fix --safe` or `capya11y pr --safe --dry-run` before merging structural remediations.

## Optional: runtime in CI

```bash
pnpm exec playwright install chromium
pnpm capya11y scan ./src --runtime --format evidence --out evidence.md --fail-on error
```

Real `--at` (VoiceOver/NVDA) needs macOS or Windows runners plus `npx @guidepup/setup` — see [Catch issues static analysis misses](/runtime-scanning).

## You are done when

- CI fails on the severity you chose.
- SARIF (and optionally evidence.md) is an artifact of the job.
- Pre-commit catches the same class of errors locally.

## Next steps

- Local Fix-PR: `pnpm capya11y pr ./src --safe --dry-run`
- Flag lookup: [CLI reference](/cli-reference)
