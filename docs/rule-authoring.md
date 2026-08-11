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

## Detect `when` helpers

- `missingProps` / `hasProps` / `missingAnyOfProps`
- `noVisibleText`, `missingAlt`, `unlabeledControl`
- `clickableWithoutKeyboard`, `poorLinkText`
- `decorativeIconChildMissingHidden`
- `formGroupMissingFieldId`, `toastWithoutLiveRegion`
- `propTruthy`, `propEquals`, `variant`, `hasIsDisabled`

## Guidance

- Prefer PatternFly props (`isLiveRegion`, `fieldId`, `isAriaDisabled`) over raw ARIA when PF maps them.
- Use `safe` only when the fix value is unambiguous.
- Always include WCAG ids and a `helpUrl` for just-in-time learning.
