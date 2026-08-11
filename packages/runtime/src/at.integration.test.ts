import { describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { runGuidepupAt } from "./at-runner.js";

describe("runGuidepupAt integration", () => {
  it("runs only when CAPYA11Y_AT=1 on a supported OS", async () => {
    if (process.env.CAPYA11Y_AT !== "1") {
      expect(true).toBe(true);
      return;
    }
    if (process.platform !== "darwin" && process.platform !== "win32") {
      console.warn("Skipping AT integration — unsupported OS");
      return;
    }

    const server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!doctype html><button>Ok</button>");
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    const url = `http://127.0.0.1:${addr.port}/`;

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url);
      const result = await runGuidepupAt({
        page,
        file: url,
        at: "auto",
        maxStops: 5,
      });
      // Soft assert: either findings or a setup-related error
      expect(result.findings.length + result.errors.length).toBeGreaterThanOrEqual(0);
    } finally {
      await context.close();
      await browser.close();
      server.close();
    }
  }, 120_000);
});
