import { describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { scanUrl } from "./url-runner.js";

function serveHtml(html: string): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve, reject) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("no port"));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${addr.port}/`,
        close: () => server.close(),
      });
    });
  });
}

describe("scanUrl integration", () => {
  it("finds axe issues on a live HTML page", async () => {
    const { url, close } = await serveHtml(`<!doctype html>
<html lang="en"><body>
  <p style="color:#ccc;background:#fff">Low contrast</p>
  <button type="button"></button>
</body></html>`);
    try {
      const result = await scanUrl({ url });
      if (result.errors.some((e) => /Executable doesn't exist|playwright install/i.test(e.message))) {
        console.warn("Skipping URL integration — browsers not installed");
        return;
      }
      expect(result.findings.some((f) => f.ruleId.startsWith("runtime-axe-"))).toBe(true);
      expect(result.findings[0]?.file.startsWith("http://127.0.0.1:")).toBe(true);
    } finally {
      close();
    }
  }, 60_000);
});
