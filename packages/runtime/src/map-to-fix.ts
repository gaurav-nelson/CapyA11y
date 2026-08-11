/** Map axe rule ids to CapyA11y remediation guidance (PatternFly-aware where possible). */

const REMEDIATION: Record<string, { remediation: string; autofix: "suggest" | "manual"; wcag: string[] }> = {
  "color-contrast": {
    remediation:
      "Increase contrast to at least 4.5:1 (3:1 for large text). Prefer PatternFly text/background color tokens (e.g. pf-v6-c-*) instead of custom low-contrast colors.",
    autofix: "suggest",
    wcag: ["1.4.3"],
  },
  "color-contrast-enhanced": {
    remediation:
      "Increase contrast to AAA thresholds. Prefer PatternFly color tokens over custom CSS colors.",
    autofix: "suggest",
    wcag: ["1.4.6"],
  },
  "button-name": {
    remediation:
      "Provide a visible text label or aria-label / aria-labelledby. For PatternFly icon-only Button, set aria-label.",
    autofix: "suggest",
    wcag: ["4.1.2"],
  },
  "link-name": {
    remediation: "Use descriptive link text or aria-label that describes the destination.",
    autofix: "suggest",
    wcag: ["2.4.4", "4.1.2"],
  },
  "image-alt": {
    remediation: 'Provide a short alt text, or alt="" if decorative. For PatternFly Avatar, set the alt prop.',
    autofix: "suggest",
    wcag: ["1.1.1"],
  },
  "label": {
    remediation:
      "Associate a visible <label> (htmlFor/id) or provide aria-label. Prefer PatternFly FormGroup fieldId.",
    autofix: "suggest",
    wcag: ["1.3.1", "3.3.2", "4.1.2"],
  },
  "aria-required-attr": {
    remediation: "Add the required ARIA attributes for this role, or prefer a native element / PatternFly component.",
    autofix: "manual",
    wcag: ["4.1.2"],
  },
  "aria-valid-attr-value": {
    remediation: "Fix invalid ARIA attribute values. Prefer PatternFly props that map to correct ARIA.",
    autofix: "manual",
    wcag: ["4.1.2"],
  },
};

export function remediationForAxeRule(axeRuleId: string): {
  remediation: string;
  autofix: "suggest" | "manual";
  wcag: string[];
} {
  return (
    REMEDIATION[axeRuleId] ?? {
      remediation: `Address axe rule "${axeRuleId}" in the component source. Prefer PatternFly accessibility props when available.`,
      autofix: "manual" as const,
      wcag: [],
    }
  );
}

export function normalizeAxeRuleId(axeRuleId: string): string {
  return `runtime-axe-${axeRuleId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
