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

4. For remaining `suggest` findings, get deterministic proposals then refine:

```bash
pnpm capya11y suggest <path> --json
```

   - Use `suggestedProp` / `suggestedValue` as a starting point.
   - Prefer PatternFly props (`spinnerAriaLabel`, `fieldId`, `isLiveRegion`, `isAriaDisabled`, `navAriaLabel`) over raw ARIA when PF documents them.
   - Infer final copy from icons (`SearchIcon` → "Search"), nearby headings, or control context.
   - **Always ask the user to approve** suggest-tier edits before applying. Never silent-apply labels.

5. Summarize for the developer:
   - What was fixed automatically
   - What still needs human wording (list suggestions + your refined copy)
   - WCAG criteria + help URLs from each finding
   - One-line education per rule (`capya11y explain <id> --plain`)

6. Optional evidence for PRs / VPAT narratives:

```bash
pnpm capya11y report <path> --out evidence.md
```

## Rules of thumb

- Never apply `manual` tier changes without explicit user direction.
- Do not remove intentional `aria-*` without explaining why.
- After edits, re-scan with `--json` to confirm remaining issues.
- `requiresApproval: true` on every label suggestion is intentional — trust is the product.
