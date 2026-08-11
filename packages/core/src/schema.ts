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
  /** Element has onClick but no keyboard handler / role button */
  clickableWithoutKeyboard: z.boolean().optional(),
  /** img without alt attribute */
  missingAlt: z.boolean().optional(),
  /** Anchor with empty or generic text */
  poorLinkText: z.boolean().optional(),
  /** Form control missing associated label signals */
  unlabeledControl: z.boolean().optional(),
  /** PatternFly: isDisabled present (for isAriaDisabled suggestion context) */
  hasIsDisabled: z.boolean().optional(),
  /** Child is icon-like (name ends with Icon) without aria-hidden */
  decorativeIconChildMissingHidden: z.boolean().optional(),
  /** FormGroup with label but missing fieldId */
  formGroupMissingFieldId: z.boolean().optional(),
  /** AlertGroup isToast without isLiveRegion */
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

export const RuleSchema = z.object({
  id: z.string().min(1),
  pack: z.string().min(1),
  severity: SeveritySchema.default("error"),
  wcag: z.array(z.string()).default([]),
  autofix: AutofixTierSchema.default("manual"),
  message: z.string().min(1),
  helpUrl: z.string().url().optional(),
  education: z.string().optional(),
  detect: z.object({
    component: z.string().optional(),
    tagName: z.string().optional(),
    from: z.string().optional(),
    when: DetectWhenSchema.default({}),
  }),
  fix: FixSchema.optional(),
  example: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
    })
    .optional(),
});

export type Rule = z.infer<typeof RuleSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type AutofixTier = z.infer<typeof AutofixTierSchema>;
export type DetectWhen = z.infer<typeof DetectWhenSchema>;
export type FixSpec = z.infer<typeof FixSchema>;

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
  severityOverrides: z.record(SeveritySchema).optional(),
});

export type CapyConfig = z.infer<typeof ConfigSchema>;
