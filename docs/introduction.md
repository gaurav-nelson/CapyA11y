---
title: Is CapyA11y right for us?
tag: Decide
readtime: 3 min read
---

# Is CapyA11y right for us?

**Outcome:** Decide whether CapyA11y fits your React/PatternFly accessibility workflow before you install anything.

## Who it is for

| You are… | You need to… |
|----------|--------------|
| App developer | Find and fix a11y issues in TSX without leaving the terminal or IDE |
| A11y / design-system lead | Own WCAG + PatternFly rules as YAML, without shipping ESLint plugins |
| Platform / CI engineer | Gate PRs with SARIF and produce engineering evidence for VPAT/ACR drafts |

## What makes it different

Most tools **report**. CapyA11y is built to **remediate**:

1. **PatternFly-aware** — prefers PF props (`isLiveRegion`, `fieldId`, `aria-label` on icon-only Button) over generic JSX guesses.
2. **Safe vs suggest vs manual** — CI can auto-apply structural fixes; copy still needs a human.
3. **YAML packs** — a11y leads change rules without a TypeScript plugin PR.
4. **Evidence** — WCAG-mapped markdown for Section 508 / ACR *engineering* narratives (not a conformance claim).
5. **Optional runtime** — axe-core contrast, tabbable focus, live `--url`, and Guidepup VoiceOver/NVDA when you need more than AST.

<wc-callout type="info" title="Not a full ACR">
  Static AST is the default. Runtime and AT modes deepen coverage. None of them replace manual assistive-technology testing or a signed Accessibility Conformance Report.
</wc-callout>

## When to choose something else

- You only need one-off axe on a deployed URL and never touch source → Playwright + axe may be enough.
- Your stack is not React/TSX → CapyA11y’s matchers and packs will not apply.
- You need Linux CI to drive real NVDA/VoiceOver → use `--url`/`--runtime` for axe/tabbable; real `--at` needs macOS or Windows.

## How you’ll know it fits

You can answer “yes” to at least two:

- We ship PatternFly (or want PF-shaped remediations).
- We want autofix in CI for *structural* issues, with human review for labels.
- We need SARIF or WCAG-grouped evidence for compliance conversations.

## Next step

Try it in under a minute: [Get your first finding and fix](/quick-start).
