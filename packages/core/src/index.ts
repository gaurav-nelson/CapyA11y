export { scan } from "./scan.js";
export { applyFixes } from "./fix.js";
export {
  formatReport,
  formatFindingsPlain,
  formatApplyPlain,
  formatScanMarkdown,
} from "./report.js";
export type { ReportFormat } from "./report.js";
export { loadPacks, loadRuleFile, defaultPackDirs, findRuleById } from "./load-rules.js";
export { loadConfig, writeDefaultConfig } from "./config.js";
export { explainRule } from "./explain.js";
export {
  RuleSchema,
  ConfigSchema,
  SeveritySchema,
  AutofixTierSchema,
  DEFAULT_IGNORE,
} from "./schema.js";
export type {
  Rule,
  CapyConfig,
  Severity,
  AutofixTier,
  DetectWhen,
  FixSpec,
} from "./schema.js";
export type {
  Finding,
  ScanOptions,
  ScanResult,
  ApplyResult,
  FixPatch,
  SourceRange,
} from "./types.js";
export type { ExplainResult } from "./explain.js";
export type { ApplyOptions } from "./fix.js";
