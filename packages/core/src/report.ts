import type { ApplyResult, Finding, ScanResult } from "./types.js";

export type ReportFormat = "plain" | "json" | "markdown";

function severityLabel(severity: Finding["severity"]): string {
  switch (severity) {
    case "error":
      return "ERR";
    case "warning":
      return "WRN";
    case "info":
      return "INF";
  }
}

export function formatFindingsPlain(findings: Finding[]): string {
  if (findings.length === 0) {
    return "No accessibility issues found.\n";
  }
  const lines: string[] = [];
  let currentFile = "";
  for (const f of findings) {
    if (f.file !== currentFile) {
      currentFile = f.file;
      lines.push("");
      lines.push(f.file);
    }
    const wcag = f.wcag.length ? ` [${f.wcag.join(", ")}]` : "";
    const fix =
      f.autofix === "safe" ? " [autofix:safe]" : f.autofix === "suggest" ? " [autofix:suggest]" : "";
    lines.push(
      `  ${severityLabel(f.severity)} ${f.range.startLine}:${f.range.startColumn}  ${f.ruleId}${wcag}${fix}`,
    );
    lines.push(`      ${f.message}`);
    if (f.helpUrl) lines.push(`      Help: ${f.helpUrl}`);
  }
  lines.push("");
  lines.push(`Found ${findings.length} issue(s).`);
  return lines.join("\n") + "\n";
}

export function formatScanMarkdown(result: ScanResult): string {
  const lines = [
    "# CapyA11y scan report",
    "",
    `- Files scanned: ${result.filesScanned}`,
    `- Rules loaded: ${result.rulesLoaded}`,
    `- Packs: ${result.packs.join(", ") || "(none)"}`,
    `- Findings: ${result.findings.length}`,
    "",
  ];
  if (result.findings.length === 0) {
    lines.push("No accessibility issues found.");
    return lines.join("\n") + "\n";
  }
  let currentFile = "";
  for (const f of result.findings) {
    if (f.file !== currentFile) {
      currentFile = f.file;
      lines.push(`## \`${f.file}\``);
      lines.push("");
    }
    lines.push(
      `- **${severityLabel(f.severity)}** \`${f.ruleId}\` (L${f.range.startLine}) — ${f.message}`,
    );
    if (f.wcag.length) lines.push(`  - WCAG: ${f.wcag.map((c) => `\`${c}\``).join(", ")}`);
    if (f.helpUrl) lines.push(`  - [Learn more](${f.helpUrl})`);
    if (f.education) lines.push(`  - ${f.education}`);
  }
  return lines.join("\n") + "\n";
}

export function formatApplyPlain(result: ApplyResult): string {
  const lines: string[] = [];
  lines.push(result.dryRun ? "Dry run — no files written." : "Fixes applied.");
  lines.push(`Applied: ${result.applied.length}`);
  lines.push(`Suggested (not applied): ${result.suggested.length}`);
  lines.push(`Skipped: ${result.skipped.length}`);
  if (result.applied.length) {
    lines.push("");
    lines.push("Applied:");
    for (const a of result.applied) {
      lines.push(
        `  - ${a.file}:${a.finding.range.startLine} ${a.finding.ruleId} — ${a.description}`,
      );
    }
  }
  if (result.suggested.length) {
    lines.push("");
    lines.push("Suggested (needs approval / copy):");
    for (const s of result.suggested) {
      lines.push(`  - ${s.file}:${s.range.startLine} ${s.ruleId} — ${s.message}`);
    }
  }
  return lines.join("\n") + "\n";
}

export function formatReport(
  data: ScanResult | ApplyResult | Finding[],
  format: ReportFormat,
): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2) + "\n";
  }
  if (Array.isArray(data)) {
    return format === "markdown"
      ? formatScanMarkdown({
          findings: data,
          filesScanned: 0,
          rulesLoaded: 0,
          packs: [],
        })
      : formatFindingsPlain(data);
  }
  if ("filesScanned" in data) {
    return format === "markdown" ? formatScanMarkdown(data) : formatFindingsPlain(data.findings);
  }
  return formatApplyPlain(data);
}
