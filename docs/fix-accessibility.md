---
title: Find and fix accessibility issues
tag: Do this
readtime: 5 min read
---

# Find and fix accessibility issues

**Outcome:** Run the daily scan → fix → suggest loop on your app source with confidence about what is auto-applied vs human-approved.

## Prerequisites

- CapyA11y built (`pnpm build`) or installed as a CLI dependency
- Your app’s React/TSX path (for example `./src`)
- Optional: `.capya11y.yml` from `capya11y init`

## 1. Scan your tree

```bash
pnpm capya11y scan ./src
# CI / logs:
pnpm capya11y scan ./src --plain
pnpm capya11y scan ./src --json
```

**Success:** Findings list file, line, rule id, severity, and message. Exit non-zero only when you add `--fail-on` (see [Ship accessibility gates in CI](/ship-in-ci)).

### Narrow what runs

```bash
# Only these checks (if configured)
pnpm capya11y scan ./src --include pf-button-icon-only-name,img-alt

# Skip noisy checks
pnpm capya11y scan ./src --exclude pf-example-noisy
```

Or put `checks.include` / `checks.exclude` in `.capya11y.yml` (exclude wins).

## 2. Apply safe structural fixes

```bash
pnpm capya11y fix ./src --safe --dry-run   # review first
pnpm capya11y fix ./src --safe             # write files
```

| Tier | What happens with `--safe` |
|------|----------------------------|
| `safe` | Applied (known-correct props / structure) |
| `suggest` | Shown only — needs human copy |
| `manual` | Flagged only |

**Success:** Diff shows only structural remediations; label text was not invented silently.

## 3. Handle suggest-tier labels with approval

```bash
pnpm capya11y suggest ./src --json
```

Every suggestion sets `requiresApproval: true`. In Cursor, use the `capya11y-fix` skill: propose refined copy, wait for approval, then edit.

## 4. Explain a finding to yourself or a reviewer

```bash
pnpm capya11y explain <ruleId> --plain
```

Or open the finding in the TUI and use the education / remediation lines.

## 5. Temporarily waive with a reason

In config (reason required):

```yaml
ignoreRules:
  - ruleId: pf-example
    reason: Tracked in JIRA-123; decorative in this layout
```

Or in source:

```tsx
// capya11y-ignore pf-example -- Tracked in JIRA-123
```

Waivers appear in evidence reports as accepted exceptions.

## 6. Open a Fix-PR locally (optional)

```bash
pnpm capya11y pr ./src --safe --dry-run
pnpm capya11y pr ./src --safe
```

Requires a clean git tree unless `--allow-dirty`. Uses `gh` when available.

## You are done when

- Scan results match the issues you care about (include/exclude tuned).
- Safe fixes land without silent label invention.
- Suggest items go through an explicit approval step.

## Next steps

- Runtime / live URL / AT: [Catch issues static analysis misses](/runtime-scanning)
- CI + evidence: [Ship accessibility gates in CI](/ship-in-ci)
