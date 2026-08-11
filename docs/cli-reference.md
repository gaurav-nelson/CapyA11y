---
title: CLI reference
tag: Look up
readtime: 4 min read
---

# CLI reference

**Outcome:** Look up a command or flag without reading a tutorial.

## Usage

```text
capya11y <command> [path]
```

Default path for most commands: `.`

## Commands

| Command | What you get |
|---------|----------------|
| `scan [path]` | Findings from AST (+ optional runtime) |
| `fix [path]` | Apply remediation |
| `explain <rule-id>` | Education / remediation for one rule |
| `report [path]` | Evidence / VPAT-oriented markdown |
| `suggest [path]` | Suggest-tier label proposals (`requiresApproval: true`) |
| `rules list` | Catalog of loaded rules |
| `packs list` | Catalog of packs |
| `pr [path]` | Local Fix-PR: safe fix → branch → `gh pr create` |
| `init` | Write `.capya11y.yml` + short demo tips |

## Options

| Flag | Purpose |
|------|---------|
| `--safe` | Only safe autofixes (default for `fix` / `pr`) |
| `--dry-run` | Show patches / PR body without writing |
| `--json` | Machine-readable JSON |
| `--sarif` | SARIF 2.1 (GitHub Code Scanning) |
| `--evidence` | Evidence markdown |
| `--format <name>` | Repeatable: `plain` \| `json` \| `sarif` \| `evidence` \| `markdown` |
| `--suggest` | Print label suggestions for suggest-tier findings |
| `--plain` | Structured text, no Ink TUI |
| `--pack <name>` | Limit to a pack (`wcag-core`, `patternfly-v6`, `pf`, …) |
| `--include <ruleId>` | Only these rules (repeatable) |
| `--exclude <ruleId>` | Skip these rules (wins over include; repeatable) |
| `--do-not-auto-add-defaults` | Require `--include` / config include list |
| `--patternfly-version <v5\|v6>` | PatternFly pack resolution |
| `--fail-on <error\|warning\|never>` | Exit non-zero when findings meet threshold |
| `--out <file>` | Write current `--format` output to file |
| `--theme <auto\|high-contrast>` | TUI theme |
| `--allow-dirty` | Allow `pr` on a dirty git tree |
| `--runtime` | Mount TSX via Playwright + axe + tabbable |
| `--url <http(s)://…>` | Live app scan (path optional) |
| `--url-wait-for <sel>` | Wait for selector before URL checks (default: `body`) |
| `--at [auto\|voiceover\|nvda]` | Guidepup VoiceOver (macOS) / NVDA (Windows) |

## Environment

| Variable | Effect |
|----------|--------|
| `NO_COLOR` / `FORCE_COLOR=0` | Strip / disable ANSI |
| `CAPYA11Y_AT=1` | Opt-in local AT tests where configured |

## Examples

```bash
capya11y scan ./src
capya11y fix ./src --safe --dry-run
capya11y scan . --format sarif --out capya11y.sarif --format evidence --out evidence.md
capya11y scan . --exclude pf-is-aria-disabled --plain
capya11y scan packages/fixtures/demo/RuntimeBroken.tsx --runtime --plain
capya11y scan --url http://localhost:5173 --plain
capya11y scan ./src --runtime --url http://localhost:3000 --at=auto --plain
capya11y rules list --pack patternfly-v6
capya11y pr packages/fixtures/demo --safe --dry-run
capya11y explain pf-button-icon-only-name
```

## TUI accessibility notes

- Severity always includes a text label and symbol, not color alone.
- Prefer `--plain` or `--json` in CI and agent logs.
- Token source: `packages/cli/src/theme/tokens.ts`.

## Related

- Workflows: [Find and fix](/fix-accessibility) · [Ship in CI](/ship-in-ci) · [Runtime](/runtime-scanning)
- Errors: [Troubleshoot](/troubleshooting)
