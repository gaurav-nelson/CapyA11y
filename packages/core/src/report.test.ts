import { describe, expect, it } from "vitest";
import { formatSarif } from "./sarif.js";
import { formatEvidenceReport } from "./evidence.js";
import { suggestLabels } from "./suggest-label.js";
import type { Finding, ScanResult } from "./types.js";

const sampleFinding: Finding = {
  ruleId: "pf-alert-toast-live-region",
  pack: "patternfly-v6",
  severity: "error",
  autofix: "safe",
  message: "Toast AlertGroup should set isLiveRegion",
  education: "Live regions announce status.",
  helpUrl: "https://www.patternfly.org/components/alert/accessibility",
  wcag: ["4.1.3"],
  file: "App.tsx",
  range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 },
  elementName: "AlertGroup",
  fix: { type: "addProp", props: { isLiveRegion: "true" }, description: "Add isLiveRegion" },
  confidence: "high",
};

const suggestFinding: Finding = {
  ...sampleFinding,
  ruleId: "pf-button-icon-only-name",
  autofix: "suggest",
  message: "Icon-only Button needs aria-label",
  wcag: ["4.1.2"],
  elementName: "Button",
  fix: {
    type: "addProp",
    props: { "aria-label": "{{inferFromIconOrContext}}" },
    description: "Add aria-label",
  },
  confidence: "medium",
};

const scan: ScanResult = {
  findings: [sampleFinding, suggestFinding],
  filesScanned: 1,
  rulesLoaded: 2,
  packs: ["patternfly-v6"],
};

describe("formatSarif", () => {
  it("emits SARIF 2.1 with rule and result entries", () => {
    const sarif = JSON.parse(formatSarif(scan));
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].results).toHaveLength(2);
    expect(sarif.runs[0].tool.driver.rules[0].id).toBeTruthy();
  });
});

describe("formatEvidenceReport", () => {
  it("includes WCAG table and VPAT notes", () => {
    const md = formatEvidenceReport(scan);
    expect(md).toContain("WCAG criteria coverage");
    expect(md).toContain("4.1.3");
    expect(md).toContain("Section 508");
  });
});

describe("suggestLabels", () => {
  it("only suggests for suggest-tier and requires approval", () => {
    const suggestions = suggestLabels(scan.findings);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.requiresApproval).toBe(true);
    expect(suggestions[0]?.suggestedProp).toBe("aria-label");
  });
});
