import type { Page } from "playwright";
import {
  phraseLogToFindings,
  resolveAtEngine,
  type AtEngine,
} from "./at-heuristics.js";
import type { RuntimeFindingRaw } from "./types.js";

export interface AtRunOptions {
  page: Page;
  /** Normalized file/URL label for findings */
  file: string;
  at?: AtEngine;
  maxStops?: number;
  /** Force skip without error (e.g. CAPYA11Y_AT unset in CI). */
  requireEnv?: boolean;
}

export interface AtRunResult {
  findings: RuntimeFindingRaw[];
  errors: Array<{ file: string; message: string }>;
  skipped?: boolean;
}

/**
 * Drive VoiceOver (macOS) or NVDA (Windows) via Guidepup against a Playwright page.
 * Soft-fails if @guidepup/guidepup is missing or OS unsupported.
 */
export async function runGuidepupAt(options: AtRunOptions): Promise<AtRunResult> {
  const file = options.file;
  const requested = options.at ?? "auto";
  const maxStops = options.maxStops ?? 40;

  if (options.requireEnv && process.env.CAPYA11Y_AT !== "1") {
    return {
      findings: [],
      errors: [],
      skipped: true,
    };
  }

  const resolved = resolveAtEngine(requested);
  if ("error" in resolved) {
    return { findings: [], errors: [{ file, message: resolved.error }] };
  }

  let guidepup: {
    voiceOver: {
      start: () => Promise<void>;
      stop: () => Promise<void>;
      next: () => Promise<void>;
      spokenPhraseLog: () => Promise<string[]>;
    };
    nvda: {
      start: () => Promise<void>;
      stop: () => Promise<void>;
      next: () => Promise<void>;
      spokenPhraseLog: () => Promise<string[]>;
    };
  };

  try {
    guidepup = (await import("@guidepup/guidepup")) as typeof guidepup;
  } catch {
    return {
      findings: [],
      errors: [
        {
          file,
          message:
            "Guidepup is not installed. Add @guidepup/guidepup and run `npx @guidepup/setup`, then retry with --at.",
        },
      ],
    };
  }

  const sr = resolved.engine === "voiceover" ? guidepup.voiceOver : guidepup.nvda;
  const engineLabel = resolved.engine;

  try {
    // Bring page to front so the SR focuses web content
    await options.page.bringToFront();
    await options.page.focus("body");
    await options.page.keyboard.press("Tab");

    await sr.start();
    try {
      for (let i = 0; i < maxStops; i++) {
        await sr.next();
      }
      const log = await sr.spokenPhraseLog();
      const steps = (log ?? []).map((phrase, index) => ({ index, phrase: String(phrase) }));
      return {
        findings: phraseLogToFindings(steps, file, engineLabel),
        errors: [],
      };
    } finally {
      await sr.stop().catch(() => undefined);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      findings: [],
      errors: [
        {
          file,
          message: `${msg} — ensure screen reader automation is set up: npx @guidepup/setup`,
        },
      ],
    };
  }
}

export { phraseLogToFindings, resolveAtEngine } from "./at-heuristics.js";
export type { AtEngine } from "./at-heuristics.js";
