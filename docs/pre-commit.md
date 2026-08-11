# Pre-commit gate

Run CapyA11y before each commit so accessibility regressions never leave the workstation.

## husky + lint-staged (recommended)

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

`.husky/pre-commit`:

```sh
#!/usr/bin/env sh
pnpm exec lint-staged
```

`package.json`:

```json
{
  "lint-staged": {
    "*.{tsx,jsx}": "capya11y scan --fail-on error --plain"
  }
}
```

Or a whole-tree gate (slower, no partial staging):

```sh
#!/usr/bin/env sh
pnpm capya11y scan ./src --fail-on error --plain
```

## plain pre-commit framework

`.pre-commit-config.yaml` (local hook):

```yaml
repos:
  - repo: local
    hooks:
      - id: capya11y
        name: capya11y a11y scan
        entry: pnpm capya11y scan . --fail-on error --plain
        language: system
        pass_filenames: false
        types_or: [tsx, jsx]
```

## Governance tips

- Exclude noisy rules in `.capya11y.yml` under `checks.exclude` (exclude wins over include).
- Document temporary waivers with `ignoreRules` (reason required) or `// capya11y-ignore <ruleId> -- <reason>`.
- Prefer `capya11y fix --safe` (or `capya11y pr --safe --dry-run`) for structural remediations.
