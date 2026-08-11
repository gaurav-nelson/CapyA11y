import type { AutofixTier, Rule } from "../schema.js";

export interface TemplateDefinition {
  id: string;
  description: string;
  apply: (partial: {
    id: string;
    pack: string;
    params?: Record<string, unknown>;
    severity?: Rule["severity"];
    autofix?: AutofixTier;
    wcag?: string[];
    helpUrl?: string;
    education?: string;
    remediation?: string;
    message?: string;
    example?: Rule["example"];
  }) => Rule;
}

function str(params: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = params?.[key];
  return typeof v === "string" ? v : undefined;
}

function strArr(params: Record<string, unknown> | undefined, key: string): string[] | undefined {
  const v = params?.[key];
  if (!Array.isArray(v)) return undefined;
  return v.filter((x): x is string => typeof x === "string");
}

const missingProp: TemplateDefinition = {
  id: "missing-prop",
  description: "Flag component/tag missing required props; optionally addProp fix",
  apply: (p) => {
    const component = str(p.params, "component");
    const tagName = str(p.params, "tagName");
    const from = str(p.params, "from");
    const missingProps = strArr(p.params, "missingProps") ?? [];
    const addProp = (p.params?.addProp as Record<string, string> | undefined) ?? undefined;
    const propName = missingProps[0] ?? "prop";
    return {
      id: p.id,
      pack: p.pack,
      severity: p.severity ?? "error",
      wcag: p.wcag ?? ["4.1.2"],
      autofix: p.autofix ?? (addProp ? "suggest" : "manual"),
      message:
        p.message ??
        `${component ?? tagName ?? "Element"} is missing required prop(s): ${missingProps.join(", ") || propName}.`,
      remediation:
        p.remediation ??
        (addProp
          ? `Add ${Object.keys(addProp).join(", ")}.`
          : `Provide ${missingProps.join(", ") || propName}.`),
      helpUrl: p.helpUrl,
      education: p.education,
      detect: {
        component,
        tagName,
        from,
        when: { missingProps },
      },
      fix: addProp ? { addProp } : undefined,
      example: p.example,
    };
  },
};

const iconOnlyName: TemplateDefinition = {
  id: "icon-only-name",
  description: "Icon-only control needs aria-label / aria-labelledby",
  apply: (p) => {
    const component = str(p.params, "component") ?? "Button";
    const from = str(p.params, "from") ?? "@patternfly/react-core";
    return {
      id: p.id,
      pack: p.pack,
      severity: p.severity ?? "error",
      wcag: p.wcag ?? ["4.1.2"],
      autofix: p.autofix ?? "suggest",
      message:
        p.message ??
        `Icon-only ${component} needs an accessible name via aria-label or aria-labelledby.`,
      remediation:
        p.remediation ??
        `Add a descriptive aria-label (e.g. from the icon purpose).`,
      helpUrl: p.helpUrl,
      education: p.education,
      detect: {
        component,
        from,
        when: {
          noVisibleText: true,
          missingAnyOfProps: ["aria-label", "aria-labelledby"],
        },
      },
      fix: {
        addProp: { "aria-label": "{{inferFromIconOrContext}}" },
      },
      example: p.example,
    };
  },
};

const toastLiveRegion: TemplateDefinition = {
  id: "toast-live-region",
  description: "Toast AlertGroup requires isLiveRegion",
  apply: (p) => ({
    id: p.id,
    pack: p.pack,
    severity: p.severity ?? "error",
    wcag: p.wcag ?? ["4.1.3"],
    autofix: p.autofix ?? "safe",
    message:
      p.message ??
      "Toast AlertGroup should set isLiveRegion so status messages are announced.",
    remediation: p.remediation ?? "Add isLiveRegion to AlertGroup.",
    helpUrl: p.helpUrl,
    education: p.education,
    detect: {
      component: str(p.params, "component") ?? "AlertGroup",
      from: str(p.params, "from") ?? "@patternfly/react-core",
      when: { toastWithoutLiveRegion: true },
    },
    fix: { addProp: { isLiveRegion: "true" } },
    example: p.example,
  }),
};

const unlabeledControl: TemplateDefinition = {
  id: "unlabeled-control",
  description: "Form control missing accessible name",
  apply: (p) => {
    const tagName = str(p.params, "tagName") ?? "input";
    const component = str(p.params, "component");
    return {
      id: p.id,
      pack: p.pack,
      severity: p.severity ?? "error",
      wcag: p.wcag ?? ["1.3.1", "3.3.2", "4.1.2"],
      autofix: p.autofix ?? "suggest",
      message:
        p.message ??
        "Form control has no accessible name. Associate a label or provide aria-label.",
      remediation:
        p.remediation ??
        "Prefer a visible label; otherwise set aria-label / aria-labelledby.",
      helpUrl: p.helpUrl,
      education: p.education,
      detect: {
        component,
        tagName: component ? undefined : tagName,
        from: str(p.params, "from"),
        when: { unlabeledControl: true },
      },
      fix: {
        addProp: { "aria-label": "{{inferPurpose}}" },
      },
      example: p.example,
    };
  },
};

const missingAlt: TemplateDefinition = {
  id: "missing-alt",
  description: "img or Avatar missing alt",
  apply: (p) => {
    const component = str(p.params, "component");
    const tagName = str(p.params, "tagName") ?? (component ? undefined : "img");
    return {
      id: p.id,
      pack: p.pack,
      severity: p.severity ?? "error",
      wcag: p.wcag ?? ["1.1.1"],
      autofix: p.autofix ?? "suggest",
      message:
        p.message ??
        `${component ?? tagName ?? "Image"} is missing an alt attribute.`,
      remediation:
        p.remediation ??
        `Provide a short alt text, or alt="" if decorative.`,
      helpUrl: p.helpUrl,
      education: p.education,
      detect: {
        component,
        tagName,
        from: str(p.params, "from"),
        when: { missingAlt: true },
      },
      fix: {
        addProp: { alt: "{{inferPurpose}}" },
      },
      example: p.example,
    };
  },
};

export const TEMPLATES: Record<string, TemplateDefinition> = {
  [missingProp.id]: missingProp,
  [iconOnlyName.id]: iconOnlyName,
  [toastLiveRegion.id]: toastLiveRegion,
  [unlabeledControl.id]: unlabeledControl,
  [missingAlt.id]: missingAlt,
};

export function listTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATES);
}

export function resolveTemplateRule(raw: {
  id: string;
  pack: string;
  template?: string;
  params?: Record<string, unknown>;
  severity?: Rule["severity"];
  autofix?: AutofixTier;
  wcag?: string[];
  helpUrl?: string;
  education?: string;
  remediation?: string;
  message?: string;
  detect?: Rule["detect"];
  fix?: Rule["fix"];
  example?: Rule["example"];
}): Rule {
  if (!raw.template) {
    if (!raw.message || !raw.detect) {
      throw new Error(`Rule ${raw.id} missing message/detect and has no template`);
    }
    return {
      ...raw,
      message: raw.message,
      detect: raw.detect,
      remediation:
        raw.remediation ??
        raw.education?.split("\n")[0]?.trim() ??
        raw.message,
    } as Rule;
  }

  const tpl = TEMPLATES[raw.template];
  if (!tpl) {
    throw new Error(`Unknown template "${raw.template}" for rule ${raw.id}`);
  }

  const resolved = tpl.apply({
    id: raw.id,
    pack: raw.pack,
    params: raw.params,
    severity: raw.severity,
    autofix: raw.autofix,
    wcag: raw.wcag,
    helpUrl: raw.helpUrl,
    education: raw.education,
    remediation: raw.remediation,
    message: raw.message,
    example: raw.example,
  });

  // Allow YAML to override template fields
  return {
    ...resolved,
    message: raw.message ?? resolved.message,
    remediation: raw.remediation ?? resolved.remediation,
    education: raw.education ?? resolved.education,
    helpUrl: raw.helpUrl ?? resolved.helpUrl,
    severity: raw.severity ?? resolved.severity,
    autofix: raw.autofix ?? resolved.autofix,
    wcag: raw.wcag?.length ? raw.wcag : resolved.wcag,
    fix: raw.fix ?? resolved.fix,
    detect: raw.detect ?? resolved.detect,
    example: raw.example ?? resolved.example,
  };
}
