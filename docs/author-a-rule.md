---
title: Add or change an accessibility rule
tag: Extend
readtime: 6 min read
---

# Add or change an accessibility rule

**Outcome:** Ship a new YAML (or template) rule in the WCAG or PatternFly pack that scans, explains, and optionally remediates correctly.

## Prerequisites

- Familiarity with the component API you are checking
- A WCAG criterion id and a public help URL
- Decision: `safe` vs `suggest` vs `manual` autofix

## Where rules live

- `packages/rules-wcag/rules/`
- `packages/rules-patternfly/rules/`

## Prefer a template when the shape already exists

```yaml
id: pf-button-icon-only-name
pack: patternfly-v6
severity: error
wcag: ["4.1.2"]
autofix: suggest
template: icon-only-name
params:
  component: Button
  from: "@patternfly/react-core"
helpUrl: https://www.patternfly.org/components/button/accessibility
education: Icon-only controls need an accessible name.
```

### Template catalog

| Template | Purpose | Key params |
|----------|---------|------------|
| `missing-prop` | Required props missing | `component` / `tagName`, `missingProps`, optional `addProp` |
| `icon-only-name` | Icon-only control name | `component`, `from` |
| `toast-live-region` | Toast `AlertGroup` live region | `component`, `from` |
| `unlabeled-control` | Form control without name | `component` or `tagName`, `from` |
| `missing-alt` | `img` / `Avatar` alt | `component` or `tagName`, `from` |

List templates via `listTemplates()` from `@capya11y/core`, or inspect `packages/core/src/templates/`.

## Full YAML when detection needs custom helpers

```yaml
id: pf-example
pack: patternfly-v6
severity: error
wcag: ["4.1.2"]
autofix: safe
message: Short problem statement.
remediation: Concrete fix guidance shown in CLI, SARIF help, and evidence.
helpUrl: https://...
education: Why it matters for users.
detect:
  component: Button
  from: "@patternfly/react-core"
  when:
    missingProps: ["aria-label"]
    noVisibleText: true
fix:
  addProp:
    aria-label: "{{inferFromIconOrContext}}"
example:
  before: |
    <Button variant="plain"><SearchIcon /></Button>
  after: |
    <Button variant="plain" aria-label="Search"><SearchIcon aria-hidden /></Button>
```

`remediation` is optional; when omitted, CapyA11y defaults from the fix description, first education line, or message.

### Useful `when` helpers

- `missingProps` / `hasProps` / `missingAnyOfProps`
- `noVisibleText`, `missingAlt`, `unlabeledControl`
- `clickableWithoutKeyboard`, `poorLinkText`
- `decorativeIconChildMissingHidden`
- `formGroupMissingFieldId`, `toastWithoutLiveRegion`
- `propTruthy`, `propEquals`, `variant`, `hasIsDisabled`

## Validate before you merge

```bash
pnpm build
pnpm capya11y rules list --pack patternfly-v6 --plain
pnpm capya11y explain <your-rule-id> --plain
pnpm capya11y scan packages/fixtures/demo --plain
pnpm test
```

**Success:** The rule appears in the catalog, `explain` shows education/remediation, and a fixture (or your example before/after) produces the expected finding and fix tier.

## Tune noise for consumers (not inside the rule)

```yaml
# .capya11y.yml
packs: [wcag-core, patternfly-v6]
checks:
  exclude: [pf-is-aria-disabled]   # exclude wins over include
ignoreRules:
  - ruleId: pf-alert-toast-live-region
    paths: ["**/legacy/**"]
    reason: Tracked in Jira A11Y-42
```

Source waiver (reason after `--` required):

```tsx
// capya11y-ignore pf-button-icon-only-name -- temporary until redesign
<Button variant="plain"><SearchIcon /></Button>
```

## Authoring guidance

- Prefer PatternFly props (`isLiveRegion`, `fieldId`, `isAriaDisabled`) over raw ARIA when PF maps them.
- Use `safe` only when the fix value is unambiguous.
- Always include WCAG ids and a `helpUrl`.
- Prefer `template:` when the catalog fits; keep full YAML for custom detection.

## You are done when

- Catalog + explain work for the new id.
- Safe fixes never invent user-facing copy.
- Tests or fixtures cover at least one true positive.

## Next steps

- Cursor skill `capya11y-rule-author` for guided drafting
- Mental model: [How CapyA11y decides what to flag](/how-it-works)
