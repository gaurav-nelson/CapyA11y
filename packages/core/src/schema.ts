import { z } from "zod";

export const SeveritySchema = z.enum(["error", "warning", "info"]);
export const AutofixTierSchema = z.enum(["safe", "suggest", "manual"]);

export const DetectWhenSchema = z.object({
  variant: z.array(z.string()).optional(),
  missingProps: z.array(z.string()).optional(),
  hasProps: z.array(z.string()).optional(),
  missingAnyOfProps: z.array(z.string()).optional(),
  noVisibleText: z.boolean().optional(),
  propEquals: z.record(z.union([z.string(), z.boolean()])).optional(),
  propTruthy: z.array(z.string()).optional(),
  tagName: z.string().optional(),
  role: z.string().optional(),
  clickableWithoutKeyboard: z.boolean().optional(),
  missingAlt: z.boolean().optional(),
  poorLinkText: z.boolean().optional(),
  unlabeledControl: z.boolean().optional(),
  hasIsDisabled: z.boolean().optional(),
  decorativeIconChildMissingHidden: z.boolean().optional(),
  formGroupMissingFieldId: z.boolean().optional(),
  toastWithoutLiveRegion: z.boolean().optional(),
});

export const FixSchema = z.object({
  addProp: z.record(z.string()).optional(),
  setProp: z.record(z.string()).optional(),
  removeProp: z.array(z.string()).optional(),
  renameProp: z.record(z.string()).optional(),
  addAriaHiddenToIconChildren: z.boolean().optional(),
  suggestMessage: z.string().optional(),
});

export const RuleSchema = z
  .object({
    id: z.string().min(1),
    pack: z.string().min(1),
    severity: SeveritySchema.default("error"),
    wcag: z.array(z.string()).default([]),
    autofix: AutofixTierSchema.default("manual"),
    message: z.string().optional(),
    remediation: z.string().optional(),
    helpUrl: z.string().url().optional(),
    education: z.string().optional(),
    template: z.string().optional(),
    params: z.record(z.unknown()).optional(),
    detect: z
      .object({
        component: z.string().optional(),
        tagName: z.string().optional(),
        from: z.string().optional(),
        when: DetectWhenSchema.default({}),
      })
      .optional(),
    fix: FixSchema.optional(),
    example: z
      .object({
        before: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.template && !val.message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rule requires message (or template that supplies one)",
        path: ["message"],
      });
    }
    if (!val.template && !val.detect) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rule requires detect (or template)",
        path: ["detect"],
      });
    }
  });

export type Rule = z.infer<typeof RuleSchema> & {
  message: string;
  detect: NonNullable<z.infer<typeof RuleSchema>["detect"]>;
};

export type Severity = z.infer<typeof SeveritySchema>;
export type AutofixTier = z.infer<typeof AutofixTierSchema>;
export type DetectWhen = z.infer<typeof DetectWhenSchema>;
export type FixSpec = z.infer<typeof FixSchema>;

export const ChecksConfigSchema = z.object({
  doNotAutoAddDefaults: z.boolean().default(false),
  include: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
});

export const IgnoreRuleSchema = z.object({
  ruleId: z.string().min(1),
  paths: z.array(z.string()).default(["**/*"]),
  reason: z.string().min(1),
});

export const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/*.example.tsx",
  "**/*.example.jsx",
];

export const ConfigSchema = z.object({
  packs: z.array(z.string()).default(["wcag-core", "patternfly-v6"]),
  ignore: z.array(z.string()).default([...DEFAULT_IGNORE]),
  autofix: AutofixTierSchema.default("safe"),
  theme: z.enum(["auto", "high-contrast"]).default("auto"),
  patternflyVersion: z.enum(["v5", "v6"]).default("v6"),
  severityOverrides: z.record(SeveritySchema).optional(),
  failOn: z.enum(["error", "warning", "never"]).default("error"),
  checks: ChecksConfigSchema.default({}),
  ignoreRules: z.array(IgnoreRuleSchema).default([]),
  /** Enable CT + axe + tabbable runtime scan (also `--runtime`). */
  runtime: z.boolean().default(false),
  /** Live URLs to scan with Playwright (also `--url`). */
  urls: z.array(z.string().url()).default([]),
  /** Guidepup screen reader: auto | voiceover | nvda */
  at: z.enum(["auto", "voiceover", "nvda"]).optional(),
  urlWaitFor: z.string().default("body"),
  atMaxStops: z.number().int().positive().default(40),
});

export type CapyConfig = z.infer<typeof ConfigSchema>;
export type ChecksConfig = z.infer<typeof ChecksConfigSchema>;
export type IgnoreRuleConfig = z.infer<typeof IgnoreRuleSchema>;

/** Filter rules like kube-linter: exclude wins over include. */
export function filterRulesByChecks(
  rules: Rule[],
  checks: ChecksConfig,
): Rule[] {
  const { doNotAutoAddDefaults, include, exclude } = checks;
  const excludeSet = new Set(exclude);
  let filtered = rules.filter((r) => !excludeSet.has(r.id));

  if (doNotAutoAddDefaults) {
    if (include.length === 0) return [];
    const includeSet = new Set(include);
    filtered = filtered.filter((r) => includeSet.has(r.id));
  } else if (include.length > 0) {
    const includeSet = new Set(include);
    filtered = filtered.filter((r) => includeSet.has(r.id));
  }

  // exclude already applied; if id is in both, exclude wins (already removed)
  return filtered;
}
