import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";
import { filterRulesByChecks } from "./schema.js";
import { loadPacks, defaultPackDirs } from "./load-rules.js";
import { parseSuppressionComments, applySuppressions } from "./suppressions.js";
import { scan } from "./scan.js";
import { listTemplates, resolveTemplateRule } from "./templates/index.js";
import type { Finding } from "./types.js";

const dirs: string[] = [];

function tempFile(name: string, contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), "capya11y-gov-"));
  dirs.push(dir);
  writeFileSync(join(dir, name), contents, "utf8");
  return dir;
}

afterEach(() => {
  while (dirs.length) {
    const d = dirs.pop();
    if (d) rmSync(d, { recursive: true, force: true });
  }
});

describe("filterRulesByChecks", () => {
  const rules = loadPacks(defaultPackDirs());

  it("exclude wins over include", () => {
    const filtered = filterRulesByChecks(rules, {
      doNotAutoAddDefaults: false,
      include: ["pf-alert-toast-live-region", "pf-button-icon-only-name"],
      exclude: ["pf-button-icon-only-name"],
    });
    const ids = filtered.map((r) => r.id);
    expect(ids).toContain("pf-alert-toast-live-region");
    expect(ids).not.toContain("pf-button-icon-only-name");
  });

  it("doNotAutoAddDefaults with empty include yields no rules", () => {
    const filtered = filterRulesByChecks(rules, {
      doNotAutoAddDefaults: true,
      include: [],
      exclude: [],
    });
    expect(filtered).toEqual([]);
  });
});

describe("suppressions", () => {
  it("requires reason after --", () => {
    const comments = parseSuppressionComments(`
// capya11y-ignore pf-button-icon-only-name
// capya11y-ignore pf-button-icon-only-name -- approved temporary exception
<button />
`);
    expect(comments).toHaveLength(1);
    expect(comments[0]?.reason).toContain("approved");
  });

  it("applySuppressions records exceptions", () => {
    const finding: Finding = {
      ruleId: "pf-button-icon-only-name",
      pack: "patternfly-v6",
      severity: "error",
      autofix: "suggest",
      message: "needs name",
      remediation: "add aria-label",
      wcag: ["4.1.2"],
      file: "X.tsx",
      range: { startLine: 3, startColumn: 1, endLine: 3, endColumn: 10 },
      elementName: "Button",
      confidence: "medium",
    };
    const { findings, exceptions } = applySuppressions([finding], {
      ignoreRules: [],
      sourceByFile: new Map([
        [
          "X.tsx",
          `// capya11y-ignore pf-button-icon-only-name -- demo skip\nimport x from "y";\n<Button />\n`,
        ],
      ]),
    });
    expect(findings).toHaveLength(0);
    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]?.source).toBe("comment");
  });

  it("scan honors config ignoreRules with reason", async () => {
    const dir = tempFile(
      "Toast.tsx",
      `
import { AlertGroup } from "@patternfly/react-core";
export function Toast() {
  return <AlertGroup isToast>{null}</AlertGroup>;
}
`,
    );
    const result = await scan({
      roots: [dir],
      packs: ["patternfly-v6"],
      ignoreRules: [
        {
          ruleId: "pf-alert-toast-live-region",
          paths: ["**/*"],
          reason: "Tracking in Jira A11Y-1",
        },
      ],
    });
    expect(result.findings.some((f) => f.ruleId === "pf-alert-toast-live-region")).toBe(false);
    expect(result.exceptions.some((e) => e.ruleId === "pf-alert-toast-live-region")).toBe(true);
  });
});

describe("templates", () => {
  it("exposes registry and resolves icon-only-name", () => {
    expect(listTemplates().length).toBeGreaterThanOrEqual(4);
    const rule = resolveTemplateRule({
      id: "pf-demo",
      pack: "patternfly-v6",
      template: "icon-only-name",
      params: { component: "Button", from: "@patternfly/react-core" },
    });
    expect(rule.detect.component).toBe("Button");
    expect(rule.message).toMatch(/accessible name/i);
    expect(rule.remediation).toBeTruthy();
  });

  it("loads migrated PF rules via templates", () => {
    const rules = loadPacks(defaultPackDirs(), ["patternfly-v6"]);
    const toast = rules.find((r) => r.id === "pf-alert-toast-live-region");
    expect(toast?.detect.when.toastWithoutLiveRegion).toBe(true);
    expect(toast?.remediation).toBeTruthy();
  });
});
