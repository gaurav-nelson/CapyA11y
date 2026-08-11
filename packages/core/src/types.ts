import type { AutofixTier, Severity } from "./schema.js";

export interface SourceRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface FixPatch {
  type: "addProp" | "setProp" | "removeProp" | "renameProp" | "addAriaHiddenToIconChildren";
  props?: Record<string, string>;
  remove?: string[];
  rename?: Record<string, string>;
  description: string;
}

export interface Finding {
  ruleId: string;
  pack: string;
  severity: Severity;
  autofix: AutofixTier;
  message: string;
  education?: string;
  helpUrl?: string;
  wcag: string[];
  file: string;
  range: SourceRange;
  elementName: string;
  fix?: FixPatch;
  confidence: "high" | "medium" | "low";
}

export interface ApplyResult {
  findings: Finding[];
  applied: Array<{ finding: Finding; file: string; description: string }>;
  skipped: Array<{ finding: Finding; reason: string }>;
  suggested: Finding[];
  dryRun: boolean;
}

export interface ScanOptions {
  roots: string[];
  packs?: string[];
  packDirs?: string[];
  globs?: string[];
  ignore?: string[];
  configPath?: string;
}

export interface ScanResult {
  findings: Finding[];
  filesScanned: number;
  rulesLoaded: number;
  packs: string[];
}
