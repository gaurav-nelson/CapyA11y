import { defaultPackDirs, findRuleById, loadPacks } from "./load-rules.js";
import type { Rule } from "./schema.js";

export interface ExplainResult {
  rule: Rule;
  summary: string;
}

export function explainRule(ruleId: string, packDirs?: string[]): ExplainResult | undefined {
  const rules = loadPacks(packDirs?.length ? packDirs : defaultPackDirs());
  const rule = findRuleById(rules, ruleId);
  if (!rule) return undefined;

  const lines = [
    `Rule: ${rule.id}`,
    `Pack: ${rule.pack}`,
    `Severity: ${rule.severity}`,
    `Autofix: ${rule.autofix}`,
    rule.wcag.length ? `WCAG: ${rule.wcag.join(", ")}` : null,
    "",
    rule.message.trim(),
    rule.remediation ? `\nRemediation:\n${rule.remediation.trim()}` : null,
    rule.education ? `\nWhy it matters:\n${rule.education.trim()}` : null,
    rule.helpUrl ? `\nLearn more: ${rule.helpUrl}` : null,
    rule.example?.before ? `\nBefore:\n${rule.example.before}` : null,
    rule.example?.after ? `\nAfter:\n${rule.example.after}` : null,
  ].filter((l) => l !== null);

  return { rule, summary: lines.join("\n") };
}
