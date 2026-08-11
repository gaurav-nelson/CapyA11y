import type { AutofixTier, ChecksConfig, IgnoreRuleConfig, Severity } from "./schema.js";
import type { AcceptedException } from "./suppressions.js";

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
  remediation: string;
  education?: string;
  helpUrl?: string;
  wcag: string[];
  file: string;
  range: SourceRange;
  elementName: string;
  fix?: FixPatch;
  confidence: "high" | "medium" | "low";
  /** How the finding was produced. Defaults to static AST when omitted. */
  origin?: "static" | "runtime";
  engine?: "ast" | "axe" | "tabbable" | "guidepup";
  /** CSS selector from runtime engines (debug). */
  selector?: string;
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
  patternflyVersion?: "v5" | "v6";
  checks?: ChecksConfig;
  ignoreRules?: IgnoreRuleConfig[];
  /** When true, mount TSX via Playwright CT + axe + tabbable. */
  runtime?: boolean;
  /** Live app URLs (Playwright page.goto + axe/tabbable). */
  urls?: string[];
  /** Guidepup AT: auto | voiceover | nvda */
  at?: "auto" | "voiceover" | "nvda";
  urlWaitFor?: string;
  atMaxStops?: number;
}

export interface ScanResult {
  findings: Finding[];
  filesScanned: number;
  rulesLoaded: number;
  packs: string[];
  exceptions: AcceptedException[];
  /** Runtime mount/engine errors (non-fatal). */
  runtimeErrors?: Array<{ file: string; message: string }>;
}
