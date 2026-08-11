import { existsSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { glob } from "glob";
import { Project } from "ts-morph";
import { defaultPackDirs, loadPacks } from "./load-rules.js";
import { collectJsxElements, elementMatchesRule, getElementName } from "./match.js";
import { DEFAULT_IGNORE, type Rule } from "./schema.js";
import { applySuppressions } from "./suppressions.js";
import type { Finding, FixPatch, ScanOptions, ScanResult } from "./types.js";

function buildFixPatch(rule: Rule): FixPatch | undefined {
  if (!rule.fix) return undefined;
  const f = rule.fix;
  if (f.addProp) {
    return {
      type: "addProp",
      props: f.addProp,
      description: `Add props: ${Object.keys(f.addProp).join(", ")}`,
    };
  }
  if (f.setProp) {
    return {
      type: "setProp",
      props: f.setProp,
      description: `Set props: ${Object.keys(f.setProp).join(", ")}`,
    };
  }
  if (f.renameProp) {
    return {
      type: "renameProp",
      rename: f.renameProp,
      description: `Rename props: ${Object.entries(f.renameProp)
        .map(([a, b]) => `${a}→${b}`)
        .join(", ")}`,
    };
  }
  if (f.removeProp) {
    return {
      type: "removeProp",
      remove: f.removeProp,
      description: `Remove props: ${f.removeProp.join(", ")}`,
    };
  }
  if (f.addAriaHiddenToIconChildren) {
    return {
      type: "addAriaHiddenToIconChildren",
      description: "Add aria-hidden to decorative icon children",
    };
  }
  return undefined;
}

function defaultRemediation(rule: Rule, fix?: FixPatch): string {
  if (rule.remediation?.trim()) return rule.remediation.trim();
  if (fix?.description) return fix.description;
  if (rule.education?.trim()) return rule.education.trim().split("\n")[0]!.trim();
  return rule.message.trim();
}

function resolveFiles(roots: string[], ignore: string[]): string[] {
  const files = new Set<string>();
  for (const root of roots) {
    const abs = resolve(root);
    if (!existsSync(abs)) continue;
    const pattern = abs.match(/\.[jt]sx?$/)
      ? abs
      : `${abs.replace(/\/$/, "")}/**/*.{tsx,jsx,ts,js}`;
    const matches = glob.sync(pattern, {
      ignore,
      nodir: true,
      absolute: true,
    });
    for (const m of matches) files.add(m);
  }
  return [...files];
}

async function runRuntimeIfEnabled(
  options: ScanOptions,
): Promise<{ findings: Finding[]; errors: Array<{ file: string; message: string }> }> {
  const urls = options.urls ?? [];
  const wantRuntime = Boolean(options.runtime || urls.length || options.at);
  if (!wantRuntime) return { findings: [], errors: [] };

  if (options.at && !options.runtime && urls.length === 0) {
    return {
      findings: [],
      errors: [
        {
          file: "(at)",
          message:
            "--at requires a navigable page: pass --url <http...> and/or --runtime (CT mounts).",
        },
      ],
    };
  }

  try {
    const mod = (await import("@capya11y/runtime")) as {
      runRuntimeScan: (opts: {
        roots?: string[];
        ignore?: string[];
        cwd?: string;
        urls?: string[];
        mountComponents?: boolean;
        at?: "auto" | "voiceover" | "nvda";
        atMaxStops?: number;
        urlWaitFor?: string;
      }) => Promise<{
        findings: Finding[];
        errors: Array<{ file: string; message: string }>;
      }>;
    };
    const result = await mod.runRuntimeScan({
      roots: options.runtime ? options.roots : [],
      ignore: options.ignore,
      cwd: process.cwd(),
      urls,
      mountComponents: Boolean(options.runtime),
      at: options.at,
      atMaxStops: options.atMaxStops,
      urlWaitFor: options.urlWaitFor,
    });
    return {
      findings: result.findings.map((f) => ({
        ...f,
        origin: f.origin ?? "runtime",
      })),
      errors: result.errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      findings: [],
      errors: [
        {
          file: "(runtime)",
          message: msg.includes("Cannot find package")
            ? "Runtime scan requires @capya11y/runtime. Build the workspace and run: pnpm exec playwright install chromium"
            : msg,
        },
      ],
    };
  }
}

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const packDirs = options.packDirs?.length ? options.packDirs : defaultPackDirs();
  const rules = loadPacks(packDirs, options.packs, {
    patternflyVersion: options.patternflyVersion,
    checks: options.checks,
  });
  const ignore = options.ignore ?? DEFAULT_IGNORE;
  const files = resolveFiles(options.roots, ignore);

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      jsx: 4,
      allowJs: true,
      target: 99,
    },
  });

  const findings: Finding[] = [];
  const sourceByFile = new Map<string, string>();
  const cwd = process.cwd();

  for (const file of files) {
    const sourceFile = project.addSourceFileAtPath(file);
    const rel = relative(cwd, file);
    sourceByFile.set(rel, readFileSync(file, "utf8"));
    const elements = collectJsxElements(sourceFile);

    for (const el of elements) {
      for (const rule of rules) {
        if (!elementMatchesRule(el, rule)) continue;

        const startPos = sourceFile.getLineAndColumnAtPos(el.getStart());
        const endPos = sourceFile.getLineAndColumnAtPos(el.getEnd());

        const fix = buildFixPatch(rule);
        findings.push({
          ruleId: rule.id,
          pack: rule.pack,
          severity: rule.severity,
          autofix: rule.autofix,
          message: rule.message.trim(),
          remediation: defaultRemediation(rule, fix),
          education: rule.education?.trim(),
          helpUrl: rule.helpUrl,
          wcag: rule.wcag,
          file: rel,
          range: {
            startLine: startPos.line,
            startColumn: startPos.column,
            endLine: endPos.line,
            endColumn: endPos.column,
          },
          elementName: getElementName(el),
          fix: rule.autofix === "manual" ? undefined : fix,
          confidence: rule.autofix === "safe" ? "high" : rule.autofix === "suggest" ? "medium" : "low",
          origin: "static",
          engine: "ast",
        });
      }
    }
  }

  const runtime = await runRuntimeIfEnabled(options);
  findings.push(...runtime.findings);

  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.range.startLine - b.range.startLine;
  });

  const { findings: active, exceptions } = applySuppressions(findings, {
    ignoreRules: options.ignoreRules ?? [],
    sourceByFile,
  });

  return {
    findings: active,
    filesScanned: files.length,
    rulesLoaded: rules.length,
    packs: [
      ...new Set([
        ...rules.map((r) => r.pack),
        ...(options.runtime || (options.urls?.length ?? 0) > 0 || options.at
          ? (["runtime"] as const)
          : []),
      ]),
    ],
    exceptions,
    runtimeErrors: runtime.errors.length ? runtime.errors : undefined,
  };
}
