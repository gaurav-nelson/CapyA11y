import type { ApplyResult, Finding, ScanResult } from "./types.js";

export interface EvidenceOptions {
  product?: string;
  generatedAt?: string;
}

function supportLevel(findings: Finding[]): string {
  const errors = findings.filter((f) => f.severity === "error").length;
  if (findings.length === 0) return "Supports";
  if (errors === 0) return "Partially Supports";
  return "Does Not Support";
}

/** Section 508 / VPAT-oriented evidence report for engineering narratives. */
export function formatEvidenceReport(
  scan: ScanResult,
  apply?: ApplyResult,
  options: EvidenceOptions = {},
): string {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const product = options.product ?? "CapyA11y-scanned codebase";
  const byWcag = groupByWcag(scan.findings);
  const errors = scan.findings.filter((f) => f.severity === "error");
  const warnings = scan.findings.filter((f) => f.severity === "warning");
  const safeFixable = scan.findings.filter((f) => f.autofix === "safe");
  const suggest = scan.findings.filter((f) => f.autofix === "suggest");
  const exceptions = scan.exceptions ?? [];

  const lines: string[] = [
    "# CapyA11y accessibility evidence report",
    "",
    `Generated: ${generatedAt}`,
    `Product / scope: ${product}`,
    `Standard: WCAG 2.2 AA (mapped criteria) + PatternFly v6 design-system rules`,
    "",
    "## Executive summary",
    "",
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Files scanned | ${scan.filesScanned} |`,
    `| Rules loaded | ${scan.rulesLoaded} |`,
    `| Packs | ${scan.packs.join(", ") || "—"} |`,
    `| Findings | ${scan.findings.length} |`,
    `| Errors | ${errors.length} |`,
    `| Warnings | ${warnings.length} |`,
    `| Safe autofixable | ${safeFixable.length} |`,
    `| Needs human copy (suggest) | ${suggest.length} |`,
    `| Accepted exceptions | ${exceptions.length} |`,
  ];

  if (apply) {
    lines.push(
      `| Auto-applied (this run) | ${apply.applied.length}${apply.dryRun ? " (dry-run)" : ""} |`,
    );
    lines.push(`| Suggested (not applied) | ${apply.suggested.length} |`);
  }

  lines.push("", "## ACR-oriented WCAG snapshot (static packs only)", "");
  lines.push(
    "Placeholder Support column for VPAT 2.5 / ACR drafting. **Not** a conformance claim — static AST coverage only.",
  );
  lines.push("");
  lines.push("| WCAG | Findings | Suggested Support* | Example rules |");
  lines.push("| --- | ---: | --- | --- |");
  if (byWcag.size === 0) {
    lines.push("| *(covered criteria with zero hits)* | 0 | Supports | — |");
  } else {
    for (const [criterion, findings] of [...byWcag.entries()].sort()) {
      const ruleIds = [...new Set(findings.map((f) => f.ruleId))].slice(0, 5).join(", ");
      lines.push(
        `| ${criterion} | ${findings.length} | ${supportLevel(findings)} | ${ruleIds} |`,
      );
    }
  }
  lines.push("");
  lines.push(
    "\\* Supports / Partially Supports / Does Not Support derived from open findings for enabled packs. Criteria with no rules in the pack are **Not Evaluated**.",
  );

  lines.push("", "## WCAG criteria coverage (findings by criterion)", "");
  if (byWcag.size === 0) {
    lines.push("No findings. Automated static checks for enabled packs reported zero issues.");
  } else {
    lines.push("| WCAG | Findings | Example rules |");
    lines.push("| --- | ---: | --- |");
    for (const [criterion, findings] of [...byWcag.entries()].sort()) {
      const ruleIds = [...new Set(findings.map((f) => f.ruleId))].slice(0, 5).join(", ");
      lines.push(`| ${criterion} | ${findings.length} | ${ruleIds} |`);
    }
  }

  lines.push("", "## Remediation log", "");
  if (apply && apply.applied.length > 0) {
    lines.push("### Applied fixes");
    lines.push("");
    for (const a of apply.applied) {
      lines.push(
        `- \`${a.file}:${a.finding.range.startLine}\` — \`${a.finding.ruleId}\` — ${a.finding.remediation}` +
          (a.finding.wcag.length ? ` (WCAG ${a.finding.wcag.join(", ")})` : ""),
      );
    }
    lines.push("");
  } else {
    lines.push(
      "No fixes applied in this report. Run `capya11y fix --safe` to remediate structural issues.",
    );
    lines.push("");
  }

  if (suggest.length > 0) {
    lines.push("### Pending human approval (suggest tier)");
    lines.push("");
    for (const s of suggest.slice(0, 50)) {
      lines.push(
        `- \`${s.file}:${s.range.startLine}\` — \`${s.ruleId}\` — ${s.message}`,
      );
      lines.push(`  - Remediation: ${s.remediation}`);
    }
    if (suggest.length > 50) lines.push(`- …and ${suggest.length - 50} more`);
    lines.push("");
  }

  lines.push("## Accepted exceptions", "");
  if (exceptions.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| File | Rule | Source | Reason |");
    lines.push("| --- | --- | --- | --- |");
    for (const e of exceptions) {
      lines.push(
        `| \`${e.file}:${e.range.startLine}\` | \`${e.ruleId}\` | ${e.source} | ${e.reason} |`,
      );
    }
  }
  lines.push("");

  lines.push("## Notes for VPAT / Section 508 engineering", "");
  lines.push(
    "- This report reflects **static AST analysis** of React/TSX source (WCAG Core + PatternFly packs).",
  );
  lines.push(
    "- It does **not** replace runtime axe testing, manual AT verification, or full ACT rule coverage.",
  );
  lines.push(
    "- Accepted exceptions require a documented reason (config `ignoreRules` or `capya11y-ignore` comments).",
  );
  lines.push(
    "- Use applied-fix logs as evidence of shift-left remediation; attach SARIF from CI for code-scanning history.",
  );
  lines.push("");

  return lines.join("\n");
}

function groupByWcag(findings: Finding[]): Map<string, Finding[]> {
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    const keys = f.wcag.length ? f.wcag : ["(unmapped)"];
    for (const k of keys) {
      const list = map.get(k) ?? [];
      list.push(f);
      map.set(k, list);
    }
  }
  return map;
}
