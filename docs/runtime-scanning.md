---
title: Catch issues static analysis misses
tag: Do this
readtime: 5 min read
---

# Catch issues static analysis misses

**Outcome:** Choose and run the right runtime layer — component mount, live URL, and/or real AT — when AST rules are not enough.

## When to use which layer

| Goal | Flag | What runs |
|------|------|-----------|
| Contrast, ARIA, focus on isolated TSX | `--runtime` | Mount each file in Chromium + axe + tabbable |
| Same checks on a running app | `--url <http…>` | `page.goto` + axe + tabbable (path optional) |
| Hear / walk with real AT | `--at=auto\|voiceover\|nvda` | Guidepup VoiceOver (macOS) or NVDA (Windows) |

You can combine them:

```bash
pnpm capya11y scan ./src --runtime --url http://localhost:3000 --at=auto --plain
```

Findings are tagged `[runtime:axe]`, `[runtime:tabbable]`, or `[runtime:guidepup]` in plain output. Evidence reports include a **Runtime checks** section.

## Prerequisites

```bash
pnpm exec playwright install chromium   # once per machine / CI image
```

For `--at` only:

```bash
npx @guidepup/setup   # macOS VoiceOver TCC / Windows NVDA automation
```

| OS | `--at` |
|----|--------|
| macOS | VoiceOver (`auto` or `voiceover`) |
| Windows | NVDA (`auto` or `nvda`) |
| Linux | Not supported — use `--url` / `--runtime` for axe/tabbable |

## 1. Component-style runtime on fixtures or src

```bash
pnpm capya11y scan packages/fixtures/demo/RuntimeBroken.tsx --runtime --plain
pnpm capya11y scan ./src --runtime --plain
```

**Success:** Runtime findings appear alongside AST findings; CT mounts map hits back via `data-capya11y-source` when possible.

## 2. Live URL (path optional)

Start your app, then:

```bash
pnpm capya11y scan --url http://localhost:5173 --plain --fail-on error
# or with a tree for AST + URL together:
pnpm capya11y scan ./src --url http://localhost:5173 --plain
```

**Success:** Axe/tabbable results for the loaded page. Without `data-capya11y-source`, locations may be the page URL at lower confidence.

## 3. Real AT pass

```bash
pnpm capya11y scan --url http://localhost:5173 --at=auto --plain
```

Opt-in local AT tests in this repo use `CAPYA11Y_AT=1` where configured.

**Success:** Guidepup findings with spoken phrases / cursor walk signals, or a clear soft error if OS/setup is missing (scan continues for other layers).

## CI pattern (practical)

- **Linux CI:** `--runtime` and/or `--url` for axe + tabbable.
- **macOS or Windows CI:** optional `--at` after `@guidepup/setup`.
- Do not expect Linux runners to drive VoiceOver/NVDA.

## You are done when

- You can explain which layer caught which class of issue.
- Chromium is installed where runtime runs.
- AT failures on unsupported OS are understood as expected, not as silent passes.

## Next steps

- Mental model: [How CapyA11y decides what to flag](/how-it-works)
- Stuck? [Troubleshoot scans and fixes](/troubleshooting)
