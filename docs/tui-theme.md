---
title: TUI theme
tag: Reference
readtime: 2 min read
---

# TUI theme (accessible colors)

The Ink CLI theme lives in `packages/cli/src/theme/tokens.ts`.

## Principles

1. **Color is never the only signal.** Severity always includes a text label (`ERR` / `WRN` / `INF`) and a symbol (`✕` / `!` / `i`).
2. Honor **`NO_COLOR`**, **`FORCE_COLOR=0`**, and **`--plain`**.
3. Prefer ANSI named colors that degrade to the 16-color palette.
4. Brand accent is warm **amber/clay** (`yellow`), not purple-glow defaults.
5. **`theme: high-contrast`** (config or `--theme high-contrast`) brightens semantic colors and avoids muted text for critical content.

## Assumed backgrounds

Tokens are validated against typical dark (`~#1e1e1e`) and light (`~#f5f5f5`) terminal backgrounds. Semantic red/yellow/green/cyan are paired with labels so red/green confusion does not hide meaning.

## Modes

| Mode | When |
|------|------|
| Ink TUI | Interactive TTY |
| `--plain` | Structured text for logs |
| `--json` | CI and Cursor skills |
| `NO_COLOR=1` | Strip ANSI entirely |
