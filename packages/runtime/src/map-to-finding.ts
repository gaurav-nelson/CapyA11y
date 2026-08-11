import { normalizeAxeRuleId, remediationForAxeRule } from "./map-to-fix.js";
import { parseSourceAttr } from "./inject-source.js";
import type { RuntimeFindingRaw } from "./types.js";

export interface AxeNodeHit {
  axeRuleId: string;
  help: string;
  helpUrl?: string;
  impact?: string | null;
  html?: string;
  target: string[];
  sourceAttr?: string;
  failureSummary?: string;
}

export interface FocusHit {
  kind: "focus-order" | "focus-visible";
  message: string;
  selector?: string;
  sourceAttr?: string;
  index?: number;
}

function severityFromImpact(impact?: string | null): RuntimeFindingRaw["severity"] {
  if (impact === "critical" || impact === "serious") return "error";
  if (impact === "moderate") return "warning";
  return "info";
}

function locFromSource(
  sourceAttr: string | undefined,
  fallbackFile: string,
): Pick<RuntimeFindingRaw, "file" | "range" | "elementName" | "confidence"> {
  const parsed = sourceAttr ? parseSourceAttr(sourceAttr) : undefined;
  if (parsed) {
    return {
      file: parsed.file,
      range: {
        startLine: parsed.startLine,
        startColumn: parsed.startColumn,
        endLine: parsed.startLine,
        endColumn: parsed.startColumn + 1,
      },
      elementName: parsed.elementName,
      confidence: "high",
    };
  }
  return {
    file: fallbackFile,
    range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
    elementName: "unknown",
    confidence: "low",
  };
}

export function axeHitsToFindings(
  hits: AxeNodeHit[],
  fallbackFile: string,
): RuntimeFindingRaw[] {
  return hits.map((hit) => {
    const mapped = remediationForAxeRule(hit.axeRuleId);
    const loc = locFromSource(hit.sourceAttr, fallbackFile);
    const unmappedNote =
      loc.confidence === "low"
        ? " (DOM node could not be mapped to a JSX location — shown at file top.)"
        : "";
    return {
      ruleId: normalizeAxeRuleId(hit.axeRuleId),
      pack: "runtime",
      severity: severityFromImpact(hit.impact),
      autofix: mapped.autofix,
      message: `${hit.help}${unmappedNote}`,
      remediation: mapped.remediation,
      education: hit.failureSummary,
      helpUrl: hit.helpUrl,
      wcag: mapped.wcag,
      ...loc,
      origin: "runtime",
      engine: "axe",
      selector: hit.target[0],
    };
  });
}

export function focusHitsToFindings(
  hits: FocusHit[],
  fallbackFile: string,
): RuntimeFindingRaw[] {
  return hits.map((hit) => {
    const loc = locFromSource(hit.sourceAttr, fallbackFile);
    const unmappedNote =
      loc.confidence === "low"
        ? " (DOM node could not be mapped to a JSX location — shown at file top.)"
        : "";
    if (hit.kind === "focus-order") {
      return {
        ruleId: "runtime-focus-order",
        pack: "runtime" as const,
        severity: "error" as const,
        autofix: "manual" as const,
        message: `${hit.message}${unmappedNote}`,
        remediation:
          "Ensure the DOM order of interactive elements matches the visual reading order. Avoid positive tabindex values that scramble Tab order.",
        wcag: ["2.4.3"],
        ...loc,
        origin: "runtime" as const,
        engine: "tabbable" as const,
        selector: hit.selector,
      };
    }
    return {
      ruleId: "runtime-focus-visible",
      pack: "runtime" as const,
      severity: "warning" as const,
      autofix: "suggest" as const,
      message: `${hit.message}${unmappedNote}`,
      remediation:
        "Do not remove focus indicators (outline: none without a replacement). Prefer PatternFly focus rings or a visible :focus-visible style.",
      wcag: ["2.4.7"],
      ...loc,
      origin: "runtime" as const,
      engine: "tabbable" as const,
      selector: hit.selector,
    };
  });
}
