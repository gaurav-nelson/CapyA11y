import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { discoverComponentFiles } from "./discover.js";
import { mountComponentFile } from "./mount.js";
import { runAxeOnPage } from "./axe-runner.js";
import { runFocusChecks } from "./focus-runner.js";
import { axeHitsToFindings, focusHitsToFindings } from "./map-to-finding.js";
import type { RuntimeFindingRaw, RuntimeScanOptions, RuntimeScanResult } from "./types.js";

export type {
  RuntimeScanOptions,
  RuntimeScanResult,
  RuntimeFindingRaw,
} from "./types.js";
export { axeHitsToFindings, focusHitsToFindings } from "./map-to-finding.js";
export { remediationForAxeRule, normalizeAxeRuleId } from "./map-to-fix.js";
export { parseSourceAttr, injectSourceAttributes } from "./inject-source.js";

/**
 * Mount TSX/JSX components in Chromium (CT-style isolation), run axe-core +
 * tabbable focus checks, and return runtime findings mapped to JSX source.
 */
export async function runRuntimeScan(
  options: RuntimeScanOptions,
): Promise<RuntimeScanResult> {
  const cwd = options.cwd ?? process.cwd();
  const includeAxe = options.includeAxe !== false;
  const includeFocus = options.includeFocus !== false;
  const files = discoverComponentFiles(options.roots, options.ignore);
  const findings: RuntimeFindingRaw[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  for (const abs of files) {
    const rel = relative(cwd, abs).replace(/\\/g, "/");
    // Skip files that clearly aren't components (no JSX)
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
          findings.push(...axeHitsToFindings(axeHits, mounted.relFile));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: rel, message: `axe: ${msg}` });
        }
      }
      if (includeFocus) {
        try {
          const focusHits = await runFocusChecks(mounted.page);
          findings.push(...focusHitsToFindings(focusHits, mounted.relFile));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ file: rel, message: `focus: ${msg}` });
        }
      }
    } finally {
      mounted.cleanup();
    }
  }

  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.range.startLine - b.range.startLine;
  });

  return { findings, filesScanned: files.length, errors };
}
