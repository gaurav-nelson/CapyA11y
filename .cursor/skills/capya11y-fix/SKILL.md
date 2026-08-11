---
name: capya11y-fix
description: >-
  Scan and remediate accessibility issues with CapyA11y. Use when the user asks
  to fix a11y, accessibility, WCAG, or PatternFly accessibility problems in
  React/TSX code, or to run capya11y/a11ylint autofix.
---

# CapyA11y fix

## Workflow

1. Identify the target path (file or directory). Default to the active file or `packages/fixtures/demo` only if the user is clearly in a demo.
2. Run a machine-readable scan:

```bash
pnpm capya11y scan <path> --json
```

3. Apply **safe** autofixes only:

```bash
pnpm capya11y fix <path> --safe --json
```

4. For remaining `suggest` findings (e.g. missing `aria-label` copy):
   - Infer concise, purpose-based label text from icons, nearby headings, or control context.
   - Prefer PatternFly props (`spinnerAriaLabel`, `fieldId`, `isLiveRegion`, `isAriaDisabled`) over raw ARIA when documented by PF.
   - Propose edits for user approval; do not invent long marketing copy.

5. Summarize for the developer:
   - What was fixed automatically
   - What still needs human wording
   - WCAG criteria + help URLs from each finding
   - One-line education per rule (from `education` / `capya11y explain <id>`)

## Rules of thumb

- Never apply `manual` tier changes without explicit user direction.
- Do not remove intentional `aria-*` without explaining why.
- After edits, re-scan with `--json` to confirm remaining issues.
