import type { IgnoreRuleConfig } from "./schema.js";
import type { Finding, SourceRange } from "./types.js";

/** Minimal glob match for ignore paths (supports **, *, and suffix paths). */
function pathMatches(file: string, pattern: string): boolean {
  if (pattern === "**/*" || pattern === "**") return true;
  const normalized = file.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");
  if (!pat.includes("*")) {
    return normalized === pat || normalized.endsWith("/" + pat) || normalized.endsWith(pat);
  }
  const re = new RegExp(
    "^" +
      pat
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, ":::GLOBSTAR:::")
        .replace(/\*/g, "[^/]*")
        .replace(/:::GLOBSTAR:::/g, ".*") +
      "$",
  );
  return re.test(normalized);
}

export interface AcceptedException {
  ruleId: string;
  file: string;
  range: SourceRange;
  reason: string;
  source: "config" | "comment";
  elementName: string;
  message: string;
}

export interface SuppressionComment {
  ruleId: string;
  reason: string;
  line: number; // 1-based line of the comment
}

const IGNORE_RE =
  /^\s*\/\/\s*capya11y-ignore\s+(\S+)\s+--\s+(.+)$/;

/** Parse `// capya11y-ignore <ruleId> -- <reason>` comments from source text. */
export function parseSuppressionComments(sourceText: string): SuppressionComment[] {
  const out: SuppressionComment[] = [];
  const lines = sourceText.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const m = line.match(IGNORE_RE);
    if (!m) return;
    const ruleId = m[1];
    const reason = m[2]?.trim();
    if (!ruleId || !reason) return; // missing reason = no suppress
    out.push({ ruleId, reason, line: idx + 1 });
  });
  return out;
}

function commentApplies(
  comments: SuppressionComment[],
  ruleId: string,
  findingLine: number,
  maxGap = 3,
): SuppressionComment | undefined {
  // Prefer nearest comment on a line above the finding within maxGap
  let best: SuppressionComment | undefined;
  for (const c of comments) {
    if (c.ruleId !== ruleId) continue;
    if (c.line >= findingLine) continue;
    if (findingLine - c.line > maxGap) continue;
    if (!best || c.line > best.line) best = c;
  }
  return best;
}

function configApplies(
  ignoreRules: IgnoreRuleConfig[],
  ruleId: string,
  file: string,
): IgnoreRuleConfig | undefined {
  for (const ig of ignoreRules) {
    if (ig.ruleId !== ruleId) continue;
    if (!ig.reason?.trim()) continue;
    const paths = ig.paths.length ? ig.paths : ["**/*"];
    if (paths.some((p) => pathMatches(file, p))) {
      return ig;
    }
  }
  return undefined;
}

export interface ApplySuppressionsResult {
  findings: Finding[];
  exceptions: AcceptedException[];
}

export function applySuppressions(
  findings: Finding[],
  options: {
    ignoreRules: IgnoreRuleConfig[];
    /** map relative file path -> source text */
    sourceByFile: Map<string, string>;
  },
): ApplySuppressionsResult {
  const exceptions: AcceptedException[] = [];
  const kept: Finding[] = [];
  const commentCache = new Map<string, SuppressionComment[]>();

  for (const f of findings) {
    const cfg = configApplies(options.ignoreRules, f.ruleId, f.file);
    if (cfg) {
      exceptions.push({
        ruleId: f.ruleId,
        file: f.file,
        range: f.range,
        reason: cfg.reason,
        source: "config",
        elementName: f.elementName,
        message: f.message,
      });
      continue;
    }

    let comments = commentCache.get(f.file);
    if (!comments) {
      const src = options.sourceByFile.get(f.file) ?? "";
      comments = parseSuppressionComments(src);
      commentCache.set(f.file, comments);
    }
    const hit = commentApplies(comments, f.ruleId, f.range.startLine);
    if (hit) {
      exceptions.push({
        ruleId: f.ruleId,
        file: f.file,
        range: f.range,
        reason: hit.reason,
        source: "comment",
        elementName: f.elementName,
        message: f.message,
      });
      continue;
    }

    kept.push(f);
  }

  return { findings: kept, exceptions };
}
