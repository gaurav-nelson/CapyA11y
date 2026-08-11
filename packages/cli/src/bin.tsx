#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import {
  applyFixes,
  DEFAULT_IGNORE,
  explainRule,
  formatReport,
  loadConfig,
  scan,
  writeDefaultConfig,
} from "@capya11y/core";
import { ScanView } from "./components/ScanView.js";
import { FixView } from "./components/FixView.js";
import { ExplainView } from "./components/ExplainView.js";
import { InitView } from "./components/InitView.js";
import { resolveTheme, type ThemeMode } from "./theme/tokens.js";
import { HELP, parseArgs } from "./parse-args.js";

async function main() {
  const { command, positionals: rest, flags } = parseArgs(process.argv.slice(2));

  if (flags.help) {
    process.stdout.write(HELP + "\n");
    return;
  }

  const config = loadConfig();
  const themeMode = (flags.theme as ThemeMode) || config.theme || "auto";
  const packs = flags.pack.length > 0 ? flags.pack : config.packs;
  const usePlain =
    flags.plain ||
    flags.json ||
    !process.stdout.isTTY ||
    process.env.NO_COLOR !== undefined;
  const theme = resolveTheme(themeMode, { plain: usePlain });

  if (command === "init") {
    if (usePlain || flags.json) {
      const path = writeDefaultConfig(process.cwd());
      if (flags.json) {
        process.stdout.write(JSON.stringify({ path }, null, 2) + "\n");
      } else {
        process.stdout.write(`Wrote ${path}\n`);
      }
      return;
    }
    render(<InitView theme={theme} cwd={process.cwd()} />);
    return;
  }

  if (command === "explain") {
    const ruleId = rest[0];
    if (!ruleId) {
      console.error("Usage: capya11y explain <rule-id>");
      process.exitCode = 1;
      return;
    }
    if (usePlain || flags.json) {
      const result = explainRule(ruleId);
      if (!result) {
        console.error(`Unknown rule: ${ruleId}`);
        process.exitCode = 1;
        return;
      }
      if (flags.json) {
        process.stdout.write(JSON.stringify(result.rule, null, 2) + "\n");
      } else {
        process.stdout.write(result.summary + "\n");
      }
      return;
    }
    render(<ExplainView ruleId={ruleId} theme={theme} />);
    return;
  }

  const target = rest[0] ?? ".";
  const ignore = [...new Set([...DEFAULT_IGNORE, ...config.ignore])];

  if (command === "scan") {
    if (usePlain || flags.json) {
      const result = await scan({ roots: [target], packs, ignore });
      process.stdout.write(formatReport(result, flags.json ? "json" : "plain"));
      if (result.findings.some((f) => f.severity === "error")) process.exitCode = 1;
      return;
    }
    const { waitUntilExit } = render(
      <ScanView roots={[target]} packs={packs} ignore={ignore} theme={theme} />,
    );
    await waitUntilExit();
    return;
  }

  if (command === "fix") {
    const mode = flags.safe ? "safe" : "all";
    if (usePlain || flags.json) {
      const scanned = await scan({ roots: [target], packs, ignore });
      const result = await applyFixes({
        findings: scanned.findings,
        mode,
        dryRun: flags.dryRun,
      });
      process.stdout.write(formatReport(result, flags.json ? "json" : "plain"));
      return;
    }
    const { waitUntilExit } = render(
      <FixView
        roots={[target]}
        packs={packs}
        ignore={ignore}
        theme={theme}
        dryRun={flags.dryRun}
        mode={mode}
      />,
    );
    await waitUntilExit();
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.stdout.write(HELP + "\n");
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
