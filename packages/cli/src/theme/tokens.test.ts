import { describe, expect, it, afterEach } from "vitest";
import { resolveTheme, severityMeta } from "./tokens.js";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("resolveTheme", () => {
  it("disables color when NO_COLOR is set", () => {
    process.env.NO_COLOR = "1";
    delete process.env.FORCE_COLOR;
    const theme = resolveTheme("auto");
    expect(theme.colorEnabled).toBe(false);
  });

  it("uses high-contrast bright tokens", () => {
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    const theme = resolveTheme("high-contrast");
    expect(theme.highContrast).toBe(true);
    expect(theme.colorEnabled).toBe(true);
    expect(theme.error).toBe("redBright");
  });

  it("disables color when plain option is set", () => {
    delete process.env.NO_COLOR;
    const theme = resolveTheme("auto", { plain: true });
    expect(theme.colorEnabled).toBe(false);
  });
});

describe("severityMeta", () => {
  it("always provides text labels", () => {
    expect(severityMeta("error").label).toBe("ERR");
    expect(severityMeta("warning").label).toBe("WRN");
    expect(severityMeta("info").label).toBe("INF");
  });
});
