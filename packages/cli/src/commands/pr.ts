import { execSync, spawnSync } from "node:child_process";
import { applyFixes, formatEvidenceReport, scan, type ChecksConfig, type IgnoreRuleConfig } from "@capya11y/core";

export interface PrOptions {
  roots: string[];
  packs?: string[];
  ignore?: string[];
  checks?: ChecksConfig;
  ignoreRules?: IgnoreRuleConfig[];
  patternflyVersion?: "v5" | "v6";
  dryRun?: boolean;
  allowDirty?: boolean;
  safe?: boolean;
}

function git(args: string[], opts?: { cwd?: string; allowFail?: boolean }): string {
  try {
    return execSync(`git ${args.map(shellQuote).join(" ")}`, {
      encoding: "utf8",
      cwd: opts?.cwd ?? process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    if (opts?.allowFail) return "";
    throw err;
  }
}

function shellQuote(s: string): string {
  if (/^[a-zA-Z0-9_./@+-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function hasGh(): boolean {
  const r = spawnSync("gh", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

function isDirty(): boolean {
  const status = git(["status", "--porcelain"], { allowFail: true });
  return status.length > 0;
}

export function buildPrBody(params: {
  applied: Array<{ file: string; ruleId: string; remediation: string; line: number }>;
  remaining: number;
  target: string;
}): { title: string; body: string } {
  const n = params.applied.length;
  const title = `fix(a11y): apply ${n} safe CapyA11y remediation${n === 1 ? "" : "s"}`;
  const lines = [
    "## Summary",
    "",
    `CapyA11y applied **${n}** safe autofix${n === 1 ? "" : "es"} under \`${params.target}\`.`,
    params.remaining > 0
      ? `${params.remaining} finding(s) remain (suggest/manual — not auto-applied).`
      : "No remaining findings from this scan scope.",
    "",
    "## Remediations",
    "",
  ];
  if (params.applied.length === 0) {
    lines.push("_No safe fixes were available._");
  } else {
    for (const a of params.applied) {
      lines.push(`- \`${a.file}:${a.line}\` — \`${a.ruleId}\` — ${a.remediation}`);
    }
  }
  lines.push(
    "",
    "## Test plan",
    "",
    "- [ ] `pnpm capya11y scan` on the same path is clean for safe-tier issues",
    "- [ ] Spot-check PatternFly components visually / with keyboard",
    "- [ ] Review suggest-tier findings separately if any remain",
    "",
  );
  return { title, body: lines.join("\n") };
}

export async function runPr(options: PrOptions): Promise<{
  title: string;
  body: string;
  branch?: string;
  created?: boolean;
  message: string;
}> {
  const target = options.roots[0] ?? ".";
  if (!options.allowDirty && isDirty()) {
    throw new Error(
      "Working tree is dirty. Commit/stash changes, or pass --allow-dirty.",
    );
  }

  const scanned = await scan({
    roots: options.roots,
    packs: options.packs,
    ignore: options.ignore,
    checks: options.checks,
    ignoreRules: options.ignoreRules,
    patternflyVersion: options.patternflyVersion,
  });

  const applied = await applyFixes({
    findings: scanned.findings,
    mode: options.safe === false ? "all" : "safe",
    dryRun: Boolean(options.dryRun),
  });

  const appliedMeta = applied.applied.map((a) => ({
    file: a.file,
    ruleId: a.finding.ruleId,
    remediation: a.finding.remediation,
    line: a.finding.range.startLine,
  }));

  const { title, body } = buildPrBody({
    applied: appliedMeta,
    remaining: scanned.findings.length - applied.applied.length,
    target,
  });

  if (options.dryRun) {
    return {
      title,
      body,
      message: ["[dry-run] PR preview", "", `# ${title}`, "", body].join("\n"),
    };
  }

  if (applied.applied.length === 0) {
    return {
      title,
      body,
      message: "No safe fixes to commit. Nothing to open as a PR.",
    };
  }

  const branch = `capya11y/fix-${Date.now()}`;
  const base = git(["rev-parse", "--abbrev-ref", "HEAD"], { allowFail: true }) || "main";

  git(["checkout", "-b", branch]);
  git(["add", "-A"]);
  const commitMsg = `${title}\n\nApplied by capya11y pr --safe.`;
  git(["commit", "-m", commitMsg]);

  let created = false;
  let message = "";

  if (hasGh()) {
    try {
      execSync(
        `gh pr create --title ${shellQuote(title)} --body ${shellQuote(body)} --base ${shellQuote(base)}`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      created = true;
      const url = git(["remote", "get-url", "origin"], { allowFail: true });
      message = [
        `Created branch ${branch} and opened a PR with gh.`,
        url ? `Remote: ${url}` : "",
        "",
        title,
      ]
        .filter(Boolean)
        .join("\n");
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      message = [
        `Committed on branch ${branch}, but \`gh pr create\` failed.`,
        detail,
        "",
        "Open a PR manually:",
        `  git push -u origin ${branch}`,
        `  gh pr create --title ${shellQuote(title)} --body-file -`,
        "",
        body,
      ].join("\n");
    }
  } else {
    message = [
      `Committed safe fixes on branch ${branch}.`,
      "`gh` not found — create the PR manually:",
      "",
      `  git push -u origin ${branch}`,
      `  gh pr create --title ${shellQuote(title)} --body-file pr-body.md`,
      "",
      "Suggested body:",
      "",
      body,
      "",
      "Evidence snapshot:",
      formatEvidenceReport(scanned, applied, { product: target }).slice(0, 500) + "…",
    ].join("\n");
  }

  return { title, body, branch, created, message };
}
