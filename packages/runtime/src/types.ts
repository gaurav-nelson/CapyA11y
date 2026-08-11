import type { AtEngine } from "./at-heuristics.js";

export interface RuntimeScanOptions {
  /** Component roots for CT mounts (used when mountComponents is true). */
  roots?: string[];
  ignore?: string[];
  cwd?: string;
  /** Live app URLs to scan with Playwright page.goto. */
  urls?: string[];
  /** Mount TSX/JSX via CT-style isolation (default: true when roots provided). */
  mountComponents?: boolean;
  /** Include axe-core checks (default true). */
  includeAxe?: boolean;
  /** Include tabbable focus-order / focus-visible checks (default true). */
  includeFocus?: boolean;
  /** Guidepup AT: auto | voiceover | nvda */
  at?: AtEngine;
  /** Max SR cursor moves (default 40). */
  atMaxStops?: number;
  /** CSS selector to wait for on URL pages (default body). */
  urlWaitFor?: string;
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
  engine: "axe" | "tabbable" | "guidepup";
  selector?: string;
}

export interface RuntimeScanResult {
  findings: RuntimeFindingRaw[];
  filesScanned: number;
  errors: Array<{ file: string; message: string }>;
}
