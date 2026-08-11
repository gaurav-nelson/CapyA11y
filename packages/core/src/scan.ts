import { existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { glob } from "glob";
import { Project } from "ts-morph";
import { defaultPackDirs, loadPacks } from "./load-rules.js";
import { collectJsxElements, elementMatchesRule, getElementName } from "./match.js";
import { DEFAULT_IGNORE, type Rule } from "./schema.js";
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

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const packDirs = options.packDirs?.length ? options.packDirs : defaultPackDirs();
  const rules = loadPacks(packDirs, options.packs);
  const ignore = options.ignore ?? DEFAULT_IGNORE;
  const files = resolveFiles(options.roots, ignore);

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      jsx: 4, // React
      allowJs: true,
      target: 99,
    },
  });

  const findings: Finding[] = [];
  const cwd = process.cwd();

  for (const file of files) {
    const sourceFile = project.addSourceFileAtPath(file);
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
          education: rule.education?.trim(),
          helpUrl: rule.helpUrl,
          wcag: rule.wcag,
          file: relative(cwd, file),
          range: {
            startLine: startPos.line,
            startColumn: startPos.column,
            endLine: endPos.line,
            endColumn: endPos.column,
          },
          elementName: getElementName(el),
          fix: rule.autofix === "manual" ? undefined : fix,
          confidence: rule.autofix === "safe" ? "high" : rule.autofix === "suggest" ? "medium" : "low",
        });
      }
    }
  }

  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.range.startLine - b.range.startLine;
  });

  return {
    findings,
    filesScanned: files.length,
    rulesLoaded: rules.length,
    packs: [...new Set(rules.map((r) => r.pack))],
  };
}
