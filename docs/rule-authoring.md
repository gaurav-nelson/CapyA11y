# Rule authoring

Rules live as YAML under:

- `packages/rules-wcag/rules/`
- `packages/rules-patternfly/rules/`

## Schema (essentials)

```yaml
id: pf-example
pack: patternfly-v6
severity: error          # error | warning | info
wcag: ["4.1.2"]
autofix: safe             # safe | suggest | manual
message: Short problem statement.
remediation: Concrete fix guidance shown in CLI, SARIF help, and evidence.
helpUrl: https://...
education: Why it matters for users.
detect:
  component: Button       # or tagName: img
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

## Templates (parameterized checks)

Prefer a template when the detect/fix shape already exists. Full `detect`/`fix` YAML still works and can coexist.

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

List templates in code via `listTemplates()` from `@capya11y/core`, or inspect `packages/core/src/templates/`.

## Detect `when` helpers

- `missingProps` / `hasProps` / `missingAnyOfProps`
- `noVisibleText`, `missingAlt`, `unlabeledControl`
- `clickableWithoutKeyboard`, `poorLinkText`
- `decorativeIconChildMissingHidden`
- `formGroupMissingFieldId`, `toastWithoutLiveRegion`
- `propTruthy`, `propEquals`, `variant`, `hasIsDisabled`

## Config governance (`.capya11y.yml`)

```yaml
packs: [wcag-core, patternfly-v6]
checks:
  doNotAutoAddDefaults: false
  include: []
  exclude: [pf-is-aria-disabled]   # exclude wins over include
ignoreRules:
  - ruleId: pf-alert-toast-live-region
    paths: ["**/legacy/**"]
    reason: Tracked in Jira A11Y-42   # reason required
```

CLI: `--include`, `--exclude`, `--do-not-auto-add-defaults`.

### Source suppressions

Place on the line above the element (reason after `--` is required; otherwise no suppress):

```tsx
// capya11y-ignore pf-button-icon-only-name -- temporary until redesign
<Button variant="plain"><SearchIcon /></Button>
```

Accepted exceptions appear in evidence reports (never silent drops).

## Catalog CLI

```bash
capya11y rules list [--pack patternfly-v6] [--json]
capya11y packs list [--json]
```

## Guidance

- Prefer PatternFly props (`isLiveRegion`, `fieldId`, `isAriaDisabled`) over raw ARIA when PF maps them.
- Use `safe` only when the fix value is unambiguous.
- Always include WCAG ids and a `helpUrl` for just-in-time learning.
- Prefer `template:` for new checks that match the catalog; keep full YAML when detection needs custom helpers.
