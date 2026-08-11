export { scan } from "./scan.js";
export { applyFixes } from "./fix.js";
export {
  formatReport,
  formatFindingsPlain,
  formatApplyPlain,
  formatScanMarkdown,
} from "./report.js";
export type { ReportFormat } from "./report.js";
export { formatSarif } from "./sarif.js";
export { formatEvidenceReport } from "./evidence.js";
export type { EvidenceOptions } from "./evidence.js";
export { suggestLabels, labelFromIconName } from "./suggest-label.js";
export type { LabelSuggestion } from "./suggest-label.js";
export {
  loadPacks,
  loadRuleFile,
  defaultPackDirs,
  findRuleById,
  resolvePackIdForVersion,
} from "./load-rules.js";
export type { PackManifest } from "./load-rules.js";
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
