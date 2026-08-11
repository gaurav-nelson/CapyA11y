import { describe, expect, it } from "vitest";
import { axeHitsToFindings, focusHitsToFindings } from "./map-to-finding.js";
import { injectSourceAttributes, parseSourceAttr } from "./inject-source.js";
import { normalizeAxeRuleId, remediationForAxeRule } from "./map-to-fix.js";

describe("parseSourceAttr", () => {
  it("parses injected attribute values", () => {
    const loc = parseSourceAttr("src/App.tsx:12:5:Button");
    expect(loc).toEqual({
      file: "src/App.tsx",
      startLine: 12,
      startColumn: 5,
      elementName: "Button",
    });
  });
});

describe("injectSourceAttributes", () => {
  it("injects data-capya11y-source and resolves named export", () => {
    const src = `
export function Demo() {
  return <button type="button">Go</button>;
}
`;
    const result = injectSourceAttributes("/tmp/Demo.tsx", "Demo.tsx", src);
    expect(result.exportName).toBe("Demo");
    expect(result.isDefault).toBe(false);
    expect(result.code).toContain("data-capya11y-source=");
    expect(result.code).toContain("Demo.tsx:");
  });
});

describe("axeHitsToFindings", () => {
  it("maps axe hits to runtime findings with remediation", () => {
    const findings = axeHitsToFindings(
      [
        {
          axeRuleId: "color-contrast",
          help: "Elements must have sufficient color contrast",
          impact: "serious",
          target: ["p"],
          sourceAttr: "Demo.tsx:3:4:p",
        },
      ],
      "Demo.tsx",
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.ruleId).toBe("runtime-axe-color-contrast");
    expect(findings[0]?.origin).toBe("runtime");
    expect(findings[0]?.engine).toBe("axe");
    expect(findings[0]?.file).toBe("Demo.tsx");
    expect(findings[0]?.range.startLine).toBe(3);
    expect(findings[0]?.remediation).toMatch(/PatternFly/);
    expect(findings[0]?.autofix).toBe("suggest");
  });

  it("marks unmapped DOM as low confidence", () => {
    const findings = axeHitsToFindings(
      [
        {
          axeRuleId: "button-name",
          help: "Buttons must have discernible text",
          impact: "critical",
          target: ["button"],
        },
      ],
      "Demo.tsx",
    );
    expect(findings[0]?.confidence).toBe("low");
    expect(findings[0]?.message).toMatch(/could not be mapped/);
  });

  it("uses URL unmapped wording", () => {
    const findings = axeHitsToFindings(
      [
        {
          axeRuleId: "color-contrast",
          help: "contrast",
          impact: "serious",
          target: ["p"],
        },
      ],
      "http://localhost:3000/",
      "url",
    );
    expect(findings[0]?.message).toMatch(/page URL/);
  });
});

describe("focusHitsToFindings", () => {
  it("emits focus-order and focus-visible rule ids", () => {
    const findings = focusHitsToFindings(
      [
        {
          kind: "focus-order",
          message: "positive tabindex",
          sourceAttr: "Demo.tsx:4:2:div",
        },
        {
          kind: "focus-visible",
          message: "no outline",
          sourceAttr: "Demo.tsx:5:2:button",
        },
      ],
      "Demo.tsx",
    );
    expect(findings.map((f) => f.ruleId)).toEqual([
      "runtime-focus-order",
      "runtime-focus-visible",
    ]);
    expect(findings.every((f) => f.engine === "tabbable")).toBe(true);
  });
});

describe("map-to-fix", () => {
  it("normalizes axe ids", () => {
    expect(normalizeAxeRuleId("color-contrast")).toBe("runtime-axe-color-contrast");
    expect(remediationForAxeRule("button-name").wcag).toContain("4.1.2");
  });
});
