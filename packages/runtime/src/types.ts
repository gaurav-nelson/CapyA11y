export interface RuntimeScanOptions {
  roots: string[];
  ignore?: string[];
  cwd?: string;
  /** Include axe-core checks (default true). */
  includeAxe?: boolean;
  /** Include tabbable focus-order / focus-visible checks (default true). */
  includeFocus?: boolean;
}

export interface SourceLoc {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  elementName: string;
}

export interface RuntimeFindingRaw {
  ruleId: string;
  pack: "runtime";
  severity: "error" | "warning" | "info";
  autofix: "safe" | "suggest" | "manual";
  message: string;
  remediation: string;
  education?: string;
  helpUrl?: string;
  wcag: string[];
  file: string;
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  elementName: string;
  confidence: "high" | "medium" | "low";
  origin: "runtime";
  engine: "axe" | "tabbable";
  selector?: string;
}

export interface RuntimeScanResult {
  findings: RuntimeFindingRaw[];
  filesScanned: number;
  errors: Array<{ file: string; message: string }>;
}
