import { resolve } from "node:path";
import { Project, SyntaxKind, type JsxOpeningElement, type JsxSelfClosingElement } from "ts-morph";
import type { ApplyResult, Finding } from "./types.js";

type JsxElementLike = JsxOpeningElement | JsxSelfClosingElement;

function quotePropValue(value: string): string {
  if (value === "true") return "{true}";
  if (value === "false") return "{false}";
  if (value.startsWith("{") && value.endsWith("}")) return value;
  // placeholder for suggest-tier inferred labels
  if (value.startsWith("{{") && value.endsWith("}}")) {
    const key = value.slice(2, -2);
    if (key === "inferFromIconOrContext") return '"TODO: describe control"';
    if (key === "inferPurpose") return '"TODO: describe purpose"';
    if (key === "inferTablePurpose") return '"TODO: describe table"';
    if (key === "inferLoading") return '"Loading"';
    return `"TODO: ${key}"`;
  }
  return JSON.stringify(value);
}

function findElementAtLine(
  sourceFile: ReturnType<Project["addSourceFileAtPath"]>,
  line: number,
  elementName: string,
): JsxElementLike | undefined {
  let match: JsxElementLike | undefined;
  sourceFile.forEachDescendant((node) => {
    if (
      node.getKind() !== SyntaxKind.JsxOpeningElement &&
      node.getKind() !== SyntaxKind.JsxSelfClosingElement
    ) {
      return;
    }
    const el = node as JsxElementLike;
    if (el.getStartLineNumber() !== line) return;
    if (el.getTagNameNode().getText() !== elementName) return;
    match = el;
  });
  return match;
}

function applyPatchToElement(el: JsxElementLike, finding: Finding): string {
  const fix = finding.fix;
  if (!fix) return "no fix";

  if (fix.type === "addProp" || fix.type === "setProp") {
    for (const [name, value] of Object.entries(fix.props ?? {})) {
      const existing = el.getAttribute(name);
      if (existing && fix.type === "addProp") continue;
      if (existing) existing.remove();
      el.addAttribute({ name, initializer: quotePropValue(value) });
    }
    return fix.description;
  }

  if (fix.type === "removeProp") {
    for (const name of fix.remove ?? []) {
      el.getAttribute(name)?.remove();
    }
    return fix.description;
  }

  if (fix.type === "renameProp") {
    for (const [from, to] of Object.entries(fix.rename ?? {})) {
      const attr = el.getAttribute(from);
      if (!attr || attr.getKind() !== SyntaxKind.JsxAttribute) continue;
      const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
      const init = jsxAttr.getInitializer()?.getText();
      jsxAttr.remove();
      el.addAttribute({
        name: to,
        initializer: init,
      });
    }
    return fix.description;
  }

  if (fix.type === "addAriaHiddenToIconChildren") {
    const parent = el.getParent();
    if (parent?.getKind() === SyntaxKind.JsxElement) {
      const jsx = parent.asKindOrThrow(SyntaxKind.JsxElement);
      for (const c of jsx.getJsxChildren()) {
        let child: JsxElementLike | undefined;
        if (c.getKind() === SyntaxKind.JsxSelfClosingElement) {
          child = c.asKindOrThrow(SyntaxKind.JsxSelfClosingElement);
        } else if (c.getKind() === SyntaxKind.JsxElement) {
          child = c.asKindOrThrow(SyntaxKind.JsxElement).getOpeningElement();
        }
        if (!child) continue;
        const name = child.getTagNameNode().getText();
        if (!/Icon$/.test(name) && name !== "svg") continue;
        if (!child.getAttribute("aria-hidden")) {
          child.addAttribute({ name: "aria-hidden", initializer: "{true}" });
        }
      }
    }
    return fix.description;
  }

  return fix.description;
}

export interface ApplyOptions {
  findings: Finding[];
  mode?: "safe" | "all";
  dryRun?: boolean;
  /** Absolute or cwd-relative project root for resolving finding.file */
  cwd?: string;
}

export async function applyFixes(options: ApplyOptions): Promise<ApplyResult> {
  const mode = options.mode ?? "safe";
  const dryRun = options.dryRun ?? false;
  const cwd = options.cwd ?? process.cwd();

  const applied: ApplyResult["applied"] = [];
  const skipped: ApplyResult["skipped"] = [];
  const suggested: Finding[] = [];

  const byFile = new Map<string, Finding[]>();
  for (const f of options.findings) {
    if (f.autofix === "suggest" && mode === "safe") {
      suggested.push(f);
      continue;
    }
    if (f.autofix === "manual" || !f.fix) {
      skipped.push({ finding: f, reason: "manual / no autofix" });
      continue;
    }
    if (mode === "safe" && f.autofix !== "safe") {
      suggested.push(f);
      continue;
    }
    const list = byFile.get(f.file) ?? [];
    list.push(f);
    byFile.set(f.file, list);
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { jsx: 4, allowJs: true, target: 99 },
  });

  for (const [relFile, findings] of byFile) {
    const abs = resolve(cwd, relFile);
    const sourceFile = project.addSourceFileAtPath(abs);
    // Apply bottom-up so line numbers stay valid longer
    const ordered = [...findings].sort((a, b) => b.range.startLine - a.range.startLine);

    for (const finding of ordered) {
      const el = findElementAtLine(sourceFile, finding.range.startLine, finding.elementName);
      if (!el) {
        skipped.push({ finding, reason: "element not found at expected line" });
        continue;
      }
      const description = applyPatchToElement(el, finding);
      applied.push({ finding, file: relFile, description });
    }

    if (!dryRun) {
      await sourceFile.save();
    }
  }

  return {
    findings: options.findings,
    applied,
    skipped,
    suggested,
    dryRun,
  };
}
