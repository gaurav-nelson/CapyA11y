import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { discoverComponentFiles } from "./discover.js";
import { mountComponentFile } from "./mount.js";
import { runAxeOnPage } from "./axe-runner.js";
import { runFocusChecks } from "./focus-runner.js";
import { axeHitsToFindings, focusHitsToFindings } from "./map-to-finding.js";
import { scanUrl } from "./url-runner.js";
import { runGuidepupAt } from "./at-runner.js";
import type { RuntimeFindingRaw, RuntimeScanOptions, RuntimeScanResult } from "./types.js";

export type {
  RuntimeScanOptions,
  RuntimeScanResult,
  RuntimeFindingRaw,
} from "./types.js";
export { axeHitsToFindings, focusHitsToFindings } from "./map-to-finding.js";
export { remediationForAxeRule, normalizeAxeRuleId } from "./map-to-fix.js";
export { parseSourceAttr, injectSourceAttributes } from "./inject-source.js";
export { scanUrl, normalizeUrlFile } from "./url-runner.js";
export { runGuidepupAt, phraseLogToFindings, resolveAtEngine } from "./at-runner.js";
export type { AtEngine } from "./at-runner.js";

/**
 * Runtime scan: optional CT component mounts, live --url pages, axe + tabbable,
 * and optional Guidepup VoiceOver/NVDA (--at).
 */
export async function runRuntimeScan(
  options: RuntimeScanOptions,
): Promise<RuntimeScanResult> {
  const cwd = options.cwd ?? process.cwd();
  const includeAxe = options.includeAxe !== false;
  const includeFocus = options.includeFocus !== false;
  const urls = options.urls ?? [];
  const mountComponents =
    options.mountComponents ?? Boolean(options.roots?.length && options.roots.length > 0);
  const roots = options.roots ?? [];
  const files = mountComponents ? discoverComponentFiles(roots, options.ignore) : [];
  const findings: RuntimeFindingRaw[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  for (const abs of files) {
    const rel = relative(cwd, abs).replace(/\\/g, "/");
    try {
      const text = readFileSync(abs, "utf8");
      if (!/<[A-Za-z]/.test(text)) continue;
    } catch (err) {
      errors.push({
        file: rel,
        message: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    let mounted: Awaited<ReturnType<typeof mountComponentFile>> | undefined;
    try {
      mounted = await mountComponentFile(abs, cwd);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({
        file: rel,
        message: msg.includes("Executable doesn't exist")
          ? `${msg} — run: pnpm exec playwright install chromium`
          : msg,
      });
      continue;
    }

    try {
      if (includeAxe) {
        try {
          const axeHits = await runAxeOnPage(mounted.page);
          findings.push(...axeHitsToFindings(axeHits, mounted.relFile, "jsx"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: rel, message: `axe: ${msg}` });
        }
      }
      if (includeFocus) {
        try {
          const focusHits = await runFocusChecks(mounted.page);
          findings.push(...focusHitsToFindings(focusHits, mounted.relFile, "jsx"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: rel, message: `focus: ${msg}` });
        }
      }
      if (options.at) {
        const atResult = await runGuidepupAt({
          page: mounted.page,
          file: mounted.relFile,
          at: options.at,
          maxStops: options.atMaxStops,
        });
        findings.push(...atResult.findings);
        errors.push(...atResult.errors);
      }
    } finally {
      mounted.cleanup();
    }
  }

  for (const url of urls) {
    const result = await scanUrl({
      url,
      includeAxe,
      includeFocus,
      waitFor: options.urlWaitFor,
      onPage: options.at
        ? async (page, urlFile) => {
            const atResult = await runGuidepupAt({
              page,
              file: urlFile,
              at: options.at,
              maxStops: options.atMaxStops,
            });
            errors.push(...atResult.errors);
            return atResult.findings;
          }
        : undefined,
    });
    findings.push(...result.findings);
    errors.push(...result.errors);
  }

  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.range.startLine - b.range.startLine;
  });

  return {
    findings,
    filesScanned: files.length + urls.length,
    errors,
  };
}
