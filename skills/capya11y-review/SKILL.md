---
name: capya11y-review
description: >-
  Review accessibility without writing files. Use when the user asks for an
  a11y report, PR accessibility review, WCAG/PatternFly audit, or capya11y
  scan-only output.
---

# CapyA11y review

## Workflow

1. Scan the requested path:

```bash
pnpm capya11y scan <path> --json
```

2. Produce a markdown report grouped by file:
   - Severity label (`ERR` / `WRN` / `INF`) — do not rely on color
   - Rule id, WCAG ids, message
   - Autofix tier (`safe` / `suggest` / `manual`)
   - Help URL and short education blurb
   - Suggested remediation direction (without applying)

3. Optionally call:

```bash
pnpm capya11y explain <rule-id> --plain
```

for high-impact rules the reviewer should understand.

4. End with counts: errors, warnings, safe-fixable, needs-copy, manual.

## Output style

Keep the report PR-comment friendly. Prefer links to W3C Understanding and PatternFly accessibility pages over long lectures.
