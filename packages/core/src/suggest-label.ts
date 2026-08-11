import type { Finding } from "./types.js";

const ICON_LABELS: Record<string, string> = {
  SearchIcon: "Search",
  TimesIcon: "Close",
  CloseIcon: "Close",
  EllipsisVIcon: "Actions",
  EllipsisHIcon: "More actions",
  TrashIcon: "Delete",
  EditIcon: "Edit",
  PlusIcon: "Add",
  MinusIcon: "Remove",
  CogIcon: "Settings",
  SyncIcon: "Refresh",
  DownloadIcon: "Download",
  UploadIcon: "Upload",
  FilterIcon: "Filter",
  InfoCircleIcon: "Information",
  ExclamationTriangleIcon: "Warning",
  CheckIcon: "Confirm",
  AngleLeftIcon: "Previous",
  AngleRightIcon: "Next",
};

export interface LabelSuggestion {
  finding: Finding;
  suggestedProp: string;
  suggestedValue: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  /** Never auto-apply — always requires human approval */
  requiresApproval: true;
}

/**
 * Propose accessible-name copy for suggest-tier findings.
 * Deterministic heuristics only — Cursor/LLM may refine further.
 */
export function suggestLabels(findings: Finding[]): LabelSuggestion[] {
  const out: LabelSuggestion[] = [];
  for (const finding of findings) {
    if (finding.autofix !== "suggest") continue;
    const suggestion = suggestForFinding(finding);
    if (suggestion) out.push(suggestion);
  }
  return out;
}

function suggestForFinding(finding: Finding): LabelSuggestion | undefined {
  const msg = finding.message.toLowerCase();

  if (finding.ruleId.includes("loading") || msg.includes("spinner")) {
    return {
      finding,
      suggestedProp: "spinnerAriaLabel",
      suggestedValue: "Loading",
      confidence: "medium",
      rationale: "Generic loading status; refine with the action name (e.g. Deploying).",
      requiresApproval: true,
    };
  }

  if (finding.ruleId.includes("table")) {
    return {
      finding,
      suggestedProp: "aria-label",
      suggestedValue: "Data table",
      confidence: "low",
      rationale: "Replace with the table's business purpose (e.g. Users).",
      requiresApproval: true,
    };
  }

  if (finding.ruleId.includes("modal")) {
    return {
      finding,
      suggestedProp: "title",
      suggestedValue: "Dialog",
      confidence: "low",
      rationale: "Prefer a specific title describing the dialog purpose.",
      requiresApproval: true,
    };
  }

  if (finding.ruleId.includes("avatar")) {
    return {
      finding,
      suggestedProp: "alt",
      suggestedValue: "User avatar",
      confidence: "low",
      rationale: "Use the person's name when known, or alt=\"\" if decorative.",
      requiresApproval: true,
    };
  }

  if (
    finding.ruleId.includes("icon-only") ||
    finding.ruleId.includes("button-missing") ||
    finding.ruleId.includes("menutoggle")
  ) {
    return {
      finding,
      suggestedProp: "aria-label",
      suggestedValue: "TODO: describe control",
      confidence: "low",
      rationale:
        "Infer from icon component name (SearchIcon → Search) or nearby heading; approve before apply.",
      requiresApproval: true,
    };
  }

  if (finding.fix?.props) {
    const prop = Object.keys(finding.fix.props)[0];
    if (!prop) return undefined;
    return {
      finding,
      suggestedProp: prop,
      suggestedValue: "TODO: describe purpose",
      confidence: "low",
      rationale: "Needs human-authored accessible name from UI context.",
      requiresApproval: true,
    };
  }

  return undefined;
}

/** Map a known PatternFly icon component name to a default English label. */
export function labelFromIconName(iconComponentName: string): string | undefined {
  return ICON_LABELS[iconComponentName];
}
