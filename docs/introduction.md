---
title: Introduction
tag: Start here
readtime: 2 min read
---

# CapyA11y (Capy-Ally)

Automated accessibility **remediation** for React/TSX — WCAG Core + PatternFly v6 rule packs, an accessible Ink TUI, Cursor skills, CI SARIF, and VPAT-oriented evidence reports.

> PatternFly-native fixes developers trust. YAML rules a11y leads own. Just-in-time WCAG education — in the IDE and in CI.

<wc-callout type="info" title="Static analysis, not a full ACR">
  CapyA11y scans React/TSX with AST rules. It does not replace runtime axe testing, manual assistive-technology verification, or a complete Accessibility Conformance Report.
</wc-callout>

## Quick start

```bash
pnpm install
pnpm build
pnpm capya11y init --plain
pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx
pnpm capya11y fix packages/fixtures/demo/BrokenPage.tsx --safe --dry-run
pnpm capya11y explain pf-alert-toast-live-region --plain
```

## What you get

1. **Design-system intelligence** — PatternFly props (`isLiveRegion`, `fieldId`, `navAriaLabel`), not only generic JSX.
2. **Remediation tiers** — `safe` / `suggest` / `manual` so CI can trust autofix.
3. **YAML packs** authored by a11y leads without ESLint plugin PRs.
4. **Evidence export** — WCAG-mapped reports for Section 508 / VPAT engineering narratives.
5. **Hybrid agent** — deterministic core + Cursor skills for approved label copy.

## Next steps

- Walk through the [demo script](/demo-script)
- Read the [architecture](/architecture)
- Author or extend rules in [rule authoring](/rule-authoring)
