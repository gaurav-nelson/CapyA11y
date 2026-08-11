#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import React from "react";
import { render } from "ink";
import {
  applyFixes,
  DEFAULT_IGNORE,
  explainRule,
  formatEvidenceReport,
  formatReport,
  loadConfig,
  resolvePackIdForVersion,
  scan,
  suggestLabels,
  writeDefaultConfig,
  type ChecksConfig,
  type ReportFormat,
  type ScanResult,
} from "@capya11y/core";
import { ScanView } from "./components/ScanView.js";
import { FixView } from "./components/FixView.js";
import { ExplainView } from "./components/ExplainView.js";
import { InitView } from "./components/InitView.js";
import { resolveTheme, type ThemeMode } from "./theme/tokens.js";
import { HELP, parseArgs, resolveEmitters, type CliFlags } from "./parse-args.js";
import { formatPacksTable, formatRulesTable, listPacks, listRules } from "./commands/catalog.js";
import { runPr } from "./commands/pr.js";

function resolvePacks(
  flags: CliFlags,
  configPacks: string[],
  patternflyVersion: "v5" | "v6",
): string[] {
  if (flags.pack.length > 0) return flags.pack;
  const pfPack = resolvePackIdForVersion(patternflyVersion);
  const packs = configPacks.map((p) => (p.startsWith("patternfly") ? pfPack : p));
  return [...new Set(packs)];
}

function mergeChecks(configChecks: ChecksConfig, flags: CliFlags): ChecksConfig {
  return {
    doNotAutoAddDefaults:
      flags.doNotAutoAddDefaults || configChecks.doNotAutoAddDefaults,
    include: flags.include.length > 0 ? flags.include : configChecks.include,
    exclude: [...new Set([...configChecks.exclude, ...flags.exclude])],
  };
}

function shouldFail(result: ScanResult, failOn: "error" | "warning" | "never"): boolean {
  if (failOn === "never") return false;
  if (failOn === "warning") {
    return result.findings.some((f) => f.severity === "error" || f.severity === "warning");
  }
  return result.findings.some((f) => f.severity === "error");
}

function emit(text: string, out?: string) {
  if (out) {
    writeFileSync(out, text, "utf8");
    process.stderr.write(`Wrote ${out}\n`);
  } else {
    process.stdout.write(text.endsWith("\n") ? text : text + "\n");
  }
}

function emitScanFormats(result: ScanResult, flags: CliFlags) {
  const emitters = resolveEmitters(flags);
  for (const e of emitters) {
    const format = e.format as ReportFormat;
    emit(formatReport(result, format), e.out);
  }
}

async function main() {
  const { command, positionals: rest, flags } = parseArgs(process.argv.slice(2));

  if (flags.help) {
    process.stdout.write(HELP + "\n");
    return;
  }

  const config = loadConfig();
  const themeMode = (flags.theme as ThemeMode) || config.theme || "auto";
  const patternflyVersion = flags.patternflyVersion ?? config.patternflyVersion ?? "v6";
  const packs = resolvePacks(flags, config.packs, patternflyVersion);
  const failOn = flags.failOn ?? config.failOn ?? "error";
  const checks = mergeChecks(config.checks, flags);
  const ignoreRules = config.ignoreRules;
  const hasFormatFlags =
    flags.formats.length > 0 ||
    flags.json ||
    flags.sarif ||
    flags.evidence ||
    flags.plain;
  const usePlain =
    hasFormatFlags ||
    flags.suggest ||
    command === "rules" ||
    command === "packs" ||
    command === "pr" ||
    !process.stdout.isTTY ||
    process.env.NO_COLOR !== undefined;
  const theme = resolveTheme(themeMode, { plain: usePlain });

  if (command === "init") {
    if (usePlain || flags.json) {
      const path = writeDefaultConfig(process.cwd());
      const tip = [
        `Wrote ${path}`,
        "",
        "60-second demo:",
        "  pnpm build",
        "  pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx",
        "  pnpm capya11y fix packages/fixtures/demo/BrokenPage.tsx --safe --dry-run",
        "  pnpm capya11y explain pf-alert-toast-live-region",
        "  pnpm capya11y report packages/fixtures/demo --evidence --out evidence.md",
        "  pnpm capya11y rules list --pack patternfly-v6",
      ].join("\n");
      if (flags.json) {
        emit(JSON.stringify({ path, demo: tip }, null, 2) + "\n", flags.out);
      } else {
        emit(tip + "\n", flags.out);
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
        emit(JSON.stringify(result.rule, null, 2) + "\n", flags.out);
      } else {
        emit(result.summary + "\n", flags.out);
      }
      return;
    }
    render(<ExplainView ruleId={ruleId} theme={theme} />);
    return;
  }

  if (command === "rules") {
    const sub = rest[0] ?? "list";
    if (sub !== "list") {
      console.error("Usage: capya11y rules list [--pack <id>] [--json]");
      process.exitCode = 1;
      return;
    }
    const rules = listRules({ packs, checks, patternflyVersion });
    if (flags.json) {
      emit(
        JSON.stringify(
          rules.map((r) => ({
            id: r.id,
            pack: r.pack,
            severity: r.severity,
            autofix: r.autofix,
            wcag: r.wcag,
            message: r.message,
            remediation: r.remediation,
          })),
          null,
          2,
        ) + "\n",
        flags.out,
      );
    } else {
      emit(formatRulesTable(rules) + "\n", flags.out);
    }
    return;
  }

  if (command === "packs") {
    const sub = rest[0] ?? "list";
    if (sub !== "list") {
      console.error("Usage: capya11y packs list [--json]");
      process.exitCode = 1;
      return;
    }
    const packsList = listPacks();
    if (flags.json) {
      emit(JSON.stringify(packsList, null, 2) + "\n", flags.out);
    } else {
      emit(formatPacksTable(packsList) + "\n", flags.out);
    }
    return;
  }

  const target = rest[0] ?? ".";
  const ignore = [...new Set([...DEFAULT_IGNORE, ...config.ignore])];
  const runtime = flags.runtime || config.runtime;
  const scanOpts = {
    roots: [target],
    packs,
    ignore,
    checks,
    ignoreRules,
    patternflyVersion,
    runtime,
  };

  if (command === "pr") {
    try {
      const result = await runPr({
        ...scanOpts,
        dryRun: flags.dryRun,
        allowDirty: flags.allowDirty,
        safe: flags.safe,
      });
      if (flags.json) {
        emit(
          JSON.stringify(
            {
              title: result.title,
              body: result.body,
              branch: result.branch,
              created: result.created,
            },
            null,
            2,
          ) + "\n",
          flags.out,
        );
      } else {
        emit(result.message + "\n", flags.out);
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
    return;
  }

  if (command === "suggest") {
    const scanned = await scan(scanOpts);
    const suggestions = suggestLabels(scanned.findings);
    if (flags.json) {
      emit(JSON.stringify(suggestions, null, 2) + "\n", flags.out);
    } else {
      const lines = [
        "Label suggestions (REQUIRE human approval — never auto-applied)",
        "",
      ];
      if (suggestions.length === 0) {
        lines.push("No suggest-tier findings to propose labels for.");
      }
      for (const s of suggestions) {
        lines.push(`${s.finding.file}:${s.finding.range.startLine} ${s.finding.ruleId}`);
        lines.push(`  → ${s.suggestedProp}="${s.suggestedValue}" (${s.confidence})`);
        lines.push(`  ${s.rationale}`);
        if (s.finding.remediation) lines.push(`  Remediation: ${s.finding.remediation}`);
        lines.push("");
      }
      emit(lines.join("\n"), flags.out);
    }
    return;
  }

  if (command === "report") {
    const scanned = await scan(scanOpts);
    const text = flags.json
      ? JSON.stringify(scanned, null, 2) + "\n"
      : formatEvidenceReport(scanned, undefined, {
          product: target,
        });
    emit(text, flags.out);
    if (shouldFail(scanned, failOn)) process.exitCode = 1;
    return;
  }

  if (command === "scan") {
    if (usePlain) {
      const result = await scan(scanOpts);
      if (flags.suggest && !flags.sarif && !flags.evidence && !flags.json && flags.formats.length === 0) {
        const suggestions = suggestLabels(result.findings);
        emit(JSON.stringify({ scan: result, suggestions }, null, 2) + "\n", flags.out);
      } else {
        emitScanFormats(result, flags);
      }
      if (shouldFail(result, failOn)) process.exitCode = 1;
      return;
    }
    const { waitUntilExit } = render(
      <ScanView
        roots={[target]}
        packs={packs}
        ignore={ignore}
        checks={checks}
        ignoreRules={ignoreRules}
        patternflyVersion={patternflyVersion}
        runtime={runtime}
        theme={theme}
      />,
    );
    await waitUntilExit();
    return;
  }

  if (command === "fix") {
    const mode = flags.safe ? "safe" : "all";
    if (usePlain) {
      const scanned = await scan(scanOpts);
      const result = await applyFixes({
        findings: scanned.findings,
        mode,
        dryRun: flags.dryRun,
      });
      if (flags.evidence || flags.formats.some((f) => f.format === "evidence")) {
        const evidenceOut =
          flags.formats.find((f) => f.format === "evidence")?.out ?? flags.out;
        emit(formatEvidenceReport(scanned, result, { product: target }), evidenceOut);
      } else {
        emit(formatReport(result, flags.json ? "json" : "plain"), flags.out);
      }
      return;
    }
    const { waitUntilExit } = render(
      <FixView
        roots={[target]}
        packs={packs}
        ignore={ignore}
        checks={checks}
        ignoreRules={ignoreRules}
        patternflyVersion={patternflyVersion}
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
