import type { Finding, ScanResult } from "./types.js";

/** Minimal SARIF 2.1.0 document for GitHub Code Scanning. */
export function formatSarif(result: ScanResult): string {
  const rules = new Map<string, Finding>();
  for (const f of result.findings) {
    if (!rules.has(f.ruleId)) rules.set(f.ruleId, f);
  }

  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "CapyA11y",
            informationUri: "https://github.com/ganelson/CapyA11y",
            version: "0.1.0",
            rules: [...rules.values()].map((f) => ({
              id: f.ruleId,
              name: f.ruleId,
              shortDescription: { text: f.message },
              fullDescription: { text: f.education ?? f.message },
              help: { text: f.remediation || f.message },
              helpUri: f.helpUrl,
              properties: {
                tags: ["accessibility", ...f.wcag.map((c) => `WCAG-${c}`), f.pack],
                autofix: f.autofix,
                remediation: f.remediation,
              },
              defaultConfiguration: {
                level: f.severity === "error" ? "error" : f.severity === "warning" ? "warning" : "note",
              },
            })),
          },
        },
        results: result.findings.map((f) => ({
          ruleId: f.ruleId,
          level: f.severity === "error" ? "error" : f.severity === "warning" ? "warning" : "note",
          message: { text: f.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.file },
                region: {
                  startLine: f.range.startLine,
                  startColumn: f.range.startColumn,
                  endLine: f.range.endLine,
                  endColumn: f.range.endColumn,
                },
              },
            },
          ],
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2) + "\n";
}
