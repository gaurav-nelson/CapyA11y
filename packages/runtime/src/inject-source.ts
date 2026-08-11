import { basename } from "node:path";
import {
  Project,
  SyntaxKind,
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  type SourceFile,
} from "ts-morph";

export interface InjectResult {
  /** Transformed source with data-capya11y-source attributes */
  code: string;
  /** Export name to mount (default or first function component) */
  exportName: string;
  isDefault: boolean;
}

function elementName(
  el: JsxOpeningElement | JsxSelfClosingElement,
): string {
  const tag = el.getTagNameNode().getText();
  return tag;
}

function injectIntoSourceFile(sf: SourceFile, relFile: string): void {
  const nodes = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
  ];

  // Process bottom-up so positions stay valid
  nodes.sort((a, b) => b.getStart() - a.getStart());

  for (const el of nodes) {
    const start = sf.getLineAndColumnAtPos(el.getStart());
    const name = elementName(el);
    // Skip fragments
    if (name === "" || name === "Fragment" || name === "React.Fragment") continue;
    if (el.getAttribute("data-capya11y-source")) continue;

    const value = `${relFile}:${start.line}:${start.column}:${name}`;
    el.addAttribute({
      name: "data-capya11y-source",
      initializer: `"${value.replace(/"/g, '\\"')}"`,
    });
  }
}

function resolveExport(sf: SourceFile, filePath: string): { exportName: string; isDefault: boolean } {
  const defaultExport = sf.getDefaultExportSymbol();
  if (defaultExport) {
    return { exportName: "default", isDefault: true };
  }

  const base = basename(filePath).replace(/\.[jt]sx?$/, "");
  const fn = sf.getFunctions().find((f) => f.isExported() && f.getName() === base);
  if (fn?.getName()) {
    return { exportName: fn.getName()!, isDefault: false };
  }

  const varExport = sf.getVariableStatements()
    .filter((v) => v.isExported())
    .flatMap((v) => v.getDeclarations())
    .find((d) => d.getName() === base);
  if (varExport) {
    return { exportName: base, isDefault: false };
  }

  const firstFn = sf.getFunctions().find((f) => f.isExported() && f.getName());
  if (firstFn?.getName()) {
    return { exportName: firstFn.getName()!, isDefault: false };
  }

  const firstVar = sf
    .getVariableStatements()
    .filter((v) => v.isExported())
    .flatMap((v) => v.getDeclarations())[0];
  if (firstVar) {
    return { exportName: firstVar.getName(), isDefault: false };
  }

  throw new Error(`No exported component found in ${filePath}`);
}

/** Inject data-capya11y-source="rel:line:col:Name" on JSX elements. */
export function injectSourceAttributes(
  absPath: string,
  relPath: string,
  sourceText: string,
): InjectResult {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { jsx: 4, target: 99, allowJs: true },
  });
  const sf = project.createSourceFile(absPath, sourceText);
  injectIntoSourceFile(sf, relPath.replace(/\\/g, "/"));
  const { exportName, isDefault } = resolveExport(sf, absPath);
  return {
    code: sf.getFullText(),
    exportName,
    isDefault,
  };
}

/** Parse data-capya11y-source attribute value. */
export function parseSourceAttr(value: string): {
  file: string;
  startLine: number;
  startColumn: number;
  elementName: string;
} | undefined {
  // file may contain colons on Windows — split from the right for line/col/name
  const parts = value.split(":");
  if (parts.length < 4) return undefined;
  const elementName = parts[parts.length - 1]!;
  const startColumn = Number(parts[parts.length - 2]);
  const startLine = Number(parts[parts.length - 3]);
  const file = parts.slice(0, parts.length - 3).join(":");
  if (!file || !Number.isFinite(startLine) || !Number.isFinite(startColumn)) {
    return undefined;
  }
  return { file, startLine, startColumn, elementName };
}
