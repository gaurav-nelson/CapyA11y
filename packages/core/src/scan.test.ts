import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";
import { scan } from "./scan.js";
import { applyFixes } from "./fix.js";
import { defaultPackDirs, loadPacks } from "./load-rules.js";
import { explainRule } from "./explain.js";

const dirs: string[] = [];

function tempFile(name: string, contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), "capya11y-"));
  dirs.push(dir);
  const path = join(dir, name);
  writeFileSync(path, contents, "utf8");
  return dir;
}

afterEach(() => {
  while (dirs.length) {
    const d = dirs.pop();
    if (d) rmSync(d, { recursive: true, force: true });
  }
});

describe("loadPacks", () => {
  it("loads wcag and patternfly rules", () => {
    const rules = loadPacks(defaultPackDirs());
    expect(rules.length).toBeGreaterThanOrEqual(20);
    expect(rules.some((r) => r.id === "wcag-img-missing-alt")).toBe(true);
    expect(rules.some((r) => r.id === "pf-alert-toast-live-region")).toBe(true);
  });
});

describe("scan", () => {
  it("detects missing img alt and toast live region", async () => {
    const dir = tempFile(
      "Sample.tsx",
      `
import { AlertGroup, Button } from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";

export function Sample() {
  return (
    <>
      <img src="/x.png" />
      <AlertGroup isToast><span /></AlertGroup>
      <Button variant="plain"><SearchIcon /></Button>
    </>
  );
}
`,
    );

    const result = await scan({ roots: [dir] });
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain("wcag-img-missing-alt");
    expect(ids).toContain("pf-alert-toast-live-region");
    expect(ids).toContain("pf-button-icon-only-name");
    expect(result.exceptions).toEqual([]);
    expect(result.findings.every((f) => f.remediation.length > 0)).toBe(true);
  });

  it("respects checks.exclude", async () => {
    const dir = tempFile(
      "Sample.tsx",
      `
import { AlertGroup } from "@patternfly/react-core";
export function Sample() {
  return <AlertGroup isToast><span /></AlertGroup>;
}
`,
    );
    const result = await scan({
      roots: [dir],
      packs: ["patternfly-v6"],
      checks: {
        doNotAutoAddDefaults: false,
        include: [],
        exclude: ["pf-alert-toast-live-region"],
      },
    });
    expect(result.findings.map((f) => f.ruleId)).not.toContain("pf-alert-toast-live-region");
  });

  it("detects clickable non-interactive and poor link text", async () => {
    const dir = tempFile(
      "Links.tsx",
      `
export function Links() {
  return (
    <>
      <div onClick={() => {}}>Save</div>
      <a href="/x">click here</a>
    </>
  );
}
`,
    );
    const result = await scan({ roots: [dir], packs: ["wcag-core"] });
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain("wcag-clickable-noninteractive");
    expect(ids).toContain("wcag-poor-link-text");
  });
});

describe("applyFixes", () => {
  it("applies safe isLiveRegion fix", async () => {
    const dir = tempFile(
      "Toast.tsx",
      `
import { AlertGroup } from "@patternfly/react-core";
export function Toast() {
  return <AlertGroup isToast>{null}</AlertGroup>;
}
`,
    );
    const scanned = await scan({ roots: [dir], packs: ["patternfly-v6"] });
    const toast = scanned.findings.filter((f) => f.ruleId === "pf-alert-toast-live-region");
    expect(toast.length).toBe(1);

    const applied = await applyFixes({ findings: toast, mode: "safe", dryRun: false, cwd: dir });
    // finding.file is relative to process.cwd(); re-scan by absolute path via roots
    expect(applied.applied.length).toBeGreaterThanOrEqual(0);

    // Re-scan absolute file content by scanning the temp dir again after fixing with correct cwd
    // applyFixes resolves finding.file against cwd — findings have relative paths from process.cwd()
    // So for the test, apply using findings with absolute-friendly re-scan:
    const { readFileSync } = await import("node:fs");
    const { relative } = await import("node:path");
    const rel = relative(process.cwd(), join(dir, "Toast.tsx"));
    const findings = toast.map((f) => ({ ...f, file: rel }));
    const result = await applyFixes({ findings, mode: "safe", dryRun: false });
    expect(result.applied.length).toBe(1);
    const text = readFileSync(join(dir, "Toast.tsx"), "utf8");
    expect(text).toContain("isLiveRegion");
  });
});

describe("explainRule", () => {
  it("returns education for a known rule", () => {
    const result = explainRule("pf-button-icon-only-name");
    expect(result?.rule.id).toBe("pf-button-icon-only-name");
    expect(result?.summary).toContain("WCAG");
  });
});

describe("label association", () => {
  it("does not flag input with matching label htmlFor", async () => {
    const source = [
      "export function Labeled() {",
      "  return (",
      "    <>",
      '      <label htmlFor="email">Email</label>',
      '      <input id="email" type="text" name="email" />',
      "    </>",
      "  );",
      "}",
      "",
    ].join("\n");
    const dir = tempFile("Labeled.tsx", source);
    const result = await scan({ roots: [dir], packs: ["wcag-core"] });
    const unlabeled = result.findings.filter((f) => f.ruleId === "wcag-input-unlabeled");
    expect(unlabeled).toEqual([]);
  });

  it("does not flag TextInput inside FormGroup with matching fieldId", async () => {
    const source = [
      'import { FormGroup, TextInput } from "@patternfly/react-core";',
      "export function Form() {",
      "  return (",
      '    <FormGroup label="Name" fieldId="name">',
      '      <TextInput id="name" />',
      "    </FormGroup>",
      "  );",
      "}",
      "",
    ].join("\n");
    const dir = tempFile("Form.tsx", source);
    const result = await scan({ roots: [dir], packs: ["patternfly-v6"] });
    const unlabeled = result.findings.filter((f) => f.ruleId === "pf-input-accessible-name");
    expect(unlabeled).toEqual([]);
  });
});
