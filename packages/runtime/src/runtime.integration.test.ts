import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { runRuntimeScan } from "./index.js";

const fixture = resolve(
  process.cwd(),
  "../fixtures/demo/RuntimeBroken.tsx",
);

describe("runRuntimeScan integration", () => {
  it("mounts RuntimeBroken and finds axe and/or focus issues", async () => {
    let result: Awaited<ReturnType<typeof runRuntimeScan>>;
    try {
      result = await runRuntimeScan({
        roots: [fixture],
        cwd: resolve(process.cwd(), "../.."),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Executable doesn't exist") || msg.includes("browser")) {
        console.warn("Skipping runtime integration — install chromium:", msg);
        return;
      }
      throw err;
    }

    if (result.errors.length && result.findings.length === 0) {
      const browserMissing = result.errors.some((e) =>
        /Executable doesn't exist|playwright install/i.test(e.message),
      );
      if (browserMissing) {
        console.warn("Skipping runtime integration — browsers not installed");
        return;
      }
    }

    expect(result.filesScanned).toBeGreaterThanOrEqual(1);
    const runtimeIds = result.findings.map((f) => f.ruleId);
    const hasAxeOrFocus =
      runtimeIds.some((id) => id.startsWith("runtime-axe-")) ||
      runtimeIds.includes("runtime-focus-visible") ||
      runtimeIds.includes("runtime-focus-order");
    expect(hasAxeOrFocus).toBe(true);
  }, 60_000);
});
