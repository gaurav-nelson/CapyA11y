import type { RuntimeFindingRaw } from "./types.js";

export interface AtPhraseStep {
  index: number;
  phrase: string;
}

const BLANK_RE = /^\s*$|^blank$|^empty$|^no item in cache$/i;
const INTERACTIVE_HINT_RE =
  /\b(button|link|checkbox|radio|textbox|edit|combo ?box|menuitem|tab|switch)\b/i;

/**
 * Map Guidepup spoken-phrase logs to conservative AT findings (no real SR required).
 */
export function phraseLogToFindings(
  steps: AtPhraseStep[],
  fallbackFile: string,
  engineLabel: "voiceover" | "nvda",
): RuntimeFindingRaw[] {
  const findings: RuntimeFindingRaw[] = [];
  const seenPhrases = new Map<string, number>();
  let blankInteractive = 0;

  for (const step of steps) {
    const phrase = (step.phrase ?? "").trim();
    const key = phrase.toLowerCase();
    seenPhrases.set(key, (seenPhrases.get(key) ?? 0) + 1);

    if (BLANK_RE.test(phrase) || phrase.length === 0) {
      blankInteractive += 1;
    } else if (INTERACTIVE_HINT_RE.test(phrase)) {
      // Role announced but no name tokens beyond the role word
      const withoutRole = phrase
        .replace(INTERACTIVE_HINT_RE, "")
        .replace(/\b(selected|checked|dimmed|disabled)\b/gi, "")
        .trim();
      if (withoutRole.length < 2) {
        findings.push({
          ruleId: "runtime-at-unnamed-control",
          pack: "runtime",
          severity: "error",
          autofix: "manual",
          message: `Screen reader (${engineLabel}) announced an interactive control without a clear accessible name: "${phrase || "(empty)"}".`,
          remediation:
            "Provide a visible label or aria-label / aria-labelledby so VoiceOver/NVDA announce a purpose. Prefer PatternFly naming props when applicable.",
          wcag: ["4.1.2"],
          file: fallbackFile,
          range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
          elementName: "unknown",
          confidence: "low",
          origin: "runtime",
          engine: "guidepup",
        });
      }
    }
  }

  if (blankInteractive >= 3) {
    findings.push({
      ruleId: "runtime-at-unnamed-control",
      pack: "runtime",
      severity: "warning",
      autofix: "manual",
      message: `Screen reader (${engineLabel}) produced ${blankInteractive} empty/blank phrases while walking the page.`,
      remediation:
        "Review unlabeled graphics and controls. Ensure interactive elements expose accessible names.",
      wcag: ["4.1.2", "1.1.1"],
      file: fallbackFile,
      range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
      elementName: "unknown",
      confidence: "low",
      origin: "runtime",
      engine: "guidepup",
    });
  }

  // Focus trap heuristic: same phrase repeated many times consecutively in log
  let streak = 1;
  let maxStreak = 1;
  for (let i = 1; i < steps.length; i++) {
    const prev = (steps[i - 1]?.phrase ?? "").trim().toLowerCase();
    const cur = (steps[i]?.phrase ?? "").trim().toLowerCase();
    if (cur && cur === prev) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
  }
  if (maxStreak >= 6) {
    findings.push({
      ruleId: "runtime-at-focus-trap",
      pack: "runtime",
      severity: "error",
      autofix: "manual",
      message: `Screen reader (${engineLabel}) repeated the same phrase ${maxStreak} times — possible focus trap or stuck virtual cursor.`,
      remediation:
        "Ensure keyboard/AT users can move past dialogs and widgets (Escape, focus return, no positive tabindex loops). Check modal focus management.",
      wcag: ["2.1.2"],
      file: fallbackFile,
      range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
      elementName: "unknown",
      confidence: "medium",
      origin: "runtime",
      engine: "guidepup",
    });
  }

  // Deduplicate identical rule+message
  const uniq = new Map<string, RuntimeFindingRaw>();
  for (const f of findings) {
    uniq.set(`${f.ruleId}|${f.message}`, f);
  }
  return [...uniq.values()];
}

export type AtEngine = "auto" | "voiceover" | "nvda";

export function resolveAtEngine(
  requested: AtEngine,
  platform: NodeJS.Platform = process.platform,
): { engine: "voiceover" | "nvda" } | { error: string } {
  if (requested === "voiceover") {
    if (platform !== "darwin") {
      return {
        error:
          "VoiceOver AT requires macOS (darwin). Use --at=auto on Windows for NVDA, or run on a Mac with `npx @guidepup/setup`.",
      };
    }
    return { engine: "voiceover" };
  }
  if (requested === "nvda") {
    if (platform !== "win32") {
      return {
        error:
          "NVDA AT requires Windows. Use --at=auto on macOS for VoiceOver, or run on Windows with NVDA + `npx @guidepup/setup`.",
      };
    }
    return { engine: "nvda" };
  }
  // auto
  if (platform === "darwin") return { engine: "voiceover" };
  if (platform === "win32") return { engine: "nvda" };
  return {
    error:
      "Real screen-reader AT (--at) is not supported on this OS. Use macOS (VoiceOver) or Windows (NVDA). Linux CI can use axe/tabbable via --url / --runtime.",
  };
}
