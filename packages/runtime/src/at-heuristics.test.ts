import { describe, expect, it } from "vitest";
import { phraseLogToFindings, resolveAtEngine } from "./at-heuristics.js";
import { normalizeUrlFile } from "./url-runner.js";

describe("resolveAtEngine", () => {
  it("maps auto to voiceover on darwin", () => {
    expect(resolveAtEngine("auto", "darwin")).toEqual({ engine: "voiceover" });
  });
  it("maps auto to nvda on win32", () => {
    expect(resolveAtEngine("auto", "win32")).toEqual({ engine: "nvda" });
  });
  it("errors on linux for auto", () => {
    const r = resolveAtEngine("auto", "linux");
    expect("error" in r).toBe(true);
  });
  it("rejects voiceover on windows", () => {
    const r = resolveAtEngine("voiceover", "win32");
    expect("error" in r).toBe(true);
  });
});

describe("phraseLogToFindings", () => {
  it("flags unnamed interactive controls", () => {
    const findings = phraseLogToFindings(
      [
        { index: 0, phrase: "button" },
        { index: 1, phrase: "Save button" },
      ],
      "http://localhost:3000/",
      "voiceover",
    );
    expect(findings.some((f) => f.ruleId === "runtime-at-unnamed-control")).toBe(true);
    expect(findings.every((f) => f.engine === "guidepup")).toBe(true);
  });

  it("flags focus trap streaks", () => {
    const steps = Array.from({ length: 8 }, (_, i) => ({
      index: i,
      phrase: "Close button",
    }));
    const findings = phraseLogToFindings(steps, "App.tsx", "nvda");
    expect(findings.some((f) => f.ruleId === "runtime-at-focus-trap")).toBe(true);
  });
});

describe("normalizeUrlFile", () => {
  it("strips hash and normalizes origin+path", () => {
    expect(normalizeUrlFile("http://localhost:5173/app?x=1#hash")).toBe(
      "http://localhost:5173/app?x=1",
    );
  });
});
