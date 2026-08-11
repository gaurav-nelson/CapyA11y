import { chromium, type Page } from "playwright";
import { runAxeOnPage } from "./axe-runner.js";
import { runFocusChecks } from "./focus-runner.js";
import { axeHitsToFindings, focusHitsToFindings } from "./map-to-finding.js";
import type { RuntimeFindingRaw } from "./types.js";

export function normalizeUrlFile(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

export interface UrlScanOptions {
  url: string;
  includeAxe?: boolean;
  includeFocus?: boolean;
  waitFor?: string;
  /** Called with the live page before cleanup (e.g. Guidepup AT). */
  onPage?: (page: Page, urlFile: string) => Promise<RuntimeFindingRaw[]>;
}

export interface UrlScanResult {
  findings: RuntimeFindingRaw[];
  errors: Array<{ file: string; message: string }>;
}

/** Navigate to a live URL and run axe + tabbable (and optional AT hook). */
export async function scanUrl(options: UrlScanOptions): Promise<UrlScanResult> {
  const includeAxe = options.includeAxe !== false;
  const includeFocus = options.includeFocus !== false;
  const waitFor = options.waitFor ?? "body";
  const urlFile = normalizeUrlFile(options.url);
  const findings: RuntimeFindingRaw[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(options.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForSelector(waitFor, { timeout: 15_000 });
      // Allow late paint / hydration without requiring full network idle
      await new Promise((r) => setTimeout(r, 100));

      if (includeAxe) {
        try {
          const axeHits = await runAxeOnPage(page);
          findings.push(...axeHitsToFindings(axeHits, urlFile, "url"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: urlFile, message: `axe: ${msg}` });
        }
      }
      if (includeFocus) {
        try {
          const focusHits = await runFocusChecks(page);
          findings.push(...focusHitsToFindings(focusHits, urlFile, "url"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: urlFile, message: `focus: ${msg}` });
        }
      }
      if (options.onPage) {
        try {
          findings.push(...(await options.onPage(page, urlFile)));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: urlFile, message: `at: ${msg}` });
        }
      }
    } finally {
      await context.close();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({
      file: urlFile,
      message: msg.includes("Executable doesn't exist")
        ? `${msg} — run: pnpm exec playwright install chromium`
        : msg,
    });
  } finally {
    await browser?.close();
  }

  return { findings, errors };
}
