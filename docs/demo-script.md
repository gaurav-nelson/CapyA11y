---
title: Demo script
tag: Start here
readtime: 5 min read
---

# Innovation Days demo script

## Setup

```bash
pnpm install
pnpm build
```

## 1. Show the problem

Open `packages/fixtures/demo/BrokenPage.tsx` — PatternFly + HTML accessibility gaps on purpose.

`FixedPage.example.tsx` is ignored by default (`**/*.example.tsx`) so repo-wide scans stay focused on real issues.

## 2. Scan with the Ink TUI

```bash
pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx
```

Point out:

- CapyA11y brand header
- Severity labels (`ERR` / `WRN`) with symbols — not color alone
- WCAG tags + PatternFly rule ids

## 3. Zero-friction safe fix

```bash
pnpm capya11y fix packages/fixtures/demo/BrokenPage.tsx --safe --dry-run
```

Then apply for real on a copy if desired. Highlight `isLiveRegion` and decorative `aria-hidden` as **safe** structural fixes.

## 4. Just-in-time learning

```bash
pnpm capya11y explain pf-button-icon-only-name
```

No Katacoda detour — education + W3C/PF links in-terminal.

## 5. Prove accessibility of the tool itself

```bash
NO_COLOR=1 pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx --plain
pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx --json | head
```

## 6. Cursor skill path

In Cursor on `BrokenPage.tsx`: “Fix accessibility issues with CapyA11y.”

The `capya11y-fix` skill runs `--json`/`--safe`, applies structural fixes, and proposes suggest-tier label copy with WCAG context.

## Success metrics called out

- One command remediation for safe issues
- Design-system-aware PatternFly fixes
- Developer education at the point of failure
