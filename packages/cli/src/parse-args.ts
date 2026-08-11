import type { ReportFormat } from "@capya11y/core";

export interface FormatEmitter {
  format: ReportFormat;
  out?: string;
}

export interface CliFlags {
  safe: boolean;
  dryRun: boolean;
  json: boolean;
  plain: boolean;
  sarif: boolean;
  evidence: boolean;
  suggest: boolean;
  pack: string[];
  theme: string;
  out?: string;
  failOn?: "error" | "warning" | "never";
  patternflyVersion?: "v5" | "v6";
  help: boolean;
  include: string[];
  exclude: string[];
  doNotAutoAddDefaults: boolean;
  formats: FormatEmitter[];
  allowDirty: boolean;
  runtime: boolean;
}

export interface ParsedCli {
  command: string;
  positionals: string[];
  flags: CliFlags;
}

const FORMAT_ALIASES: Record<string, ReportFormat> = {
  plain: "plain",
  text: "plain",
  json: "json",
  markdown: "markdown",
  md: "markdown",
  sarif: "sarif",
  evidence: "evidence",
};

function pushFormat(flags: CliFlags, format: ReportFormat) {
  flags.formats.push({ format });
}

function setOutOnLast(flags: CliFlags, out: string) {
  flags.out = out;
  if (flags.formats.length > 0) {
    flags.formats[flags.formats.length - 1]!.out = out;
  }
}

export function parseArgs(argv: string[]): ParsedCli {
  const flags: CliFlags = {
    safe: true,
    dryRun: false,
    json: false,
    plain: false,
    sarif: false,
    evidence: false,
    suggest: false,
    pack: [],
    theme: "auto",
    help: false,
    include: [],
    exclude: [],
    doNotAutoAddDefaults: false,
    formats: [],
    allowDirty: false,
    runtime: false,
  };
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--safe") {
      flags.safe = true;
    } else if (arg === "--no-safe") {
      flags.safe = false;
    } else if (arg === "--dry-run") {
      flags.dryRun = true;
    } else if (arg === "--json") {
      flags.json = true;
      pushFormat(flags, "json");
    } else if (arg === "--plain") {
      flags.plain = true;
      pushFormat(flags, "plain");
    } else if (arg === "--sarif") {
      flags.sarif = true;
      pushFormat(flags, "sarif");
    } else if (arg === "--evidence") {
      flags.evidence = true;
      pushFormat(flags, "evidence");
    } else if (arg === "--suggest") {
      flags.suggest = true;
    } else if (arg === "--allow-dirty") {
      flags.allowDirty = true;
    } else if (arg === "--runtime") {
      flags.runtime = true;
    } else if (arg === "--do-not-auto-add-defaults") {
      flags.doNotAutoAddDefaults = true;
    } else if (arg === "--theme") {
      flags.theme = argv[++i] ?? "auto";
    } else if (arg.startsWith("--theme=")) {
      flags.theme = arg.slice("--theme=".length);
    } else if (arg === "--out" || arg === "-o") {
      setOutOnLast(flags, argv[++i] ?? "");
    } else if (arg.startsWith("--out=")) {
      setOutOnLast(flags, arg.slice("--out=".length));
    } else if (arg === "--format") {
      const name = argv[++i] ?? "plain";
      const format = FORMAT_ALIASES[name];
      if (format) pushFormat(flags, format);
    } else if (arg.startsWith("--format=")) {
      const name = arg.slice("--format=".length);
      const format = FORMAT_ALIASES[name];
      if (format) pushFormat(flags, format);
    } else if (arg === "--fail-on") {
      flags.failOn = (argv[++i] as CliFlags["failOn"]) ?? "error";
    } else if (arg.startsWith("--fail-on=")) {
      flags.failOn = arg.slice("--fail-on=".length) as CliFlags["failOn"];
    } else if (arg === "--patternfly-version") {
      flags.patternflyVersion = (argv[++i] as "v5" | "v6") ?? "v6";
    } else if (arg.startsWith("--patternfly-version=")) {
      flags.patternflyVersion = arg.slice("--patternfly-version=".length) as "v5" | "v6";
    } else if (arg === "--pack") {
      flags.pack.push(argv[++i] ?? "");
    } else if (arg.startsWith("--pack=")) {
      flags.pack.push(arg.slice("--pack=".length));
    } else if (arg === "--include") {
      flags.include.push(argv[++i] ?? "");
    } else if (arg.startsWith("--include=")) {
      flags.include.push(arg.slice("--include=".length));
    } else if (arg === "--exclude") {
      flags.exclude.push(argv[++i] ?? "");
    } else if (arg.startsWith("--exclude=")) {
      flags.exclude.push(arg.slice("--exclude=".length));
    } else if (arg.startsWith("-")) {
      // ignore unknown flags
    } else {
      positionals.push(arg);
    }
  }

  // Deduplicate accidental double-push from legacy + --format
  if (flags.formats.length > 1) {
    const seen = new Set<string>();
    flags.formats = flags.formats.filter((e) => {
      const key = `${e.format}:${e.out ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const [command = "scan", ...rest] = positionals;
  return { command, positionals: rest, flags };
}

export function resolveEmitters(flags: CliFlags): FormatEmitter[] {
  if (flags.formats.length > 0) return flags.formats;
  if (flags.out) return [{ format: "plain", out: flags.out }];
  return [{ format: "plain" }];
}

export const HELP = `
  Usage
    $ capya11y <command> [path]

  Commands
    scan [path]              Find accessibility issues (default path: .)
    fix [path]               Apply remediation
    explain <rule-id>        Just-in-time learning for a rule
    report [path]            Evidence / VPAT-oriented markdown report
    suggest [path]           Propose suggest-tier label copy (never auto-applies)
    rules list               List loaded rules (catalog)
    packs list               List rule packs
    pr [path]                Local Fix-PR: safe fix → branch → gh pr create
    init                     Create .capya11y.yml + 60s demo instructions

  Options
    --safe                   Apply only safe autofixes (default for fix/pr)
    --dry-run                Show patches / PR body without writing
    --json                   Machine-readable JSON output
    --sarif                  SARIF 2.1 output (GitHub Code Scanning)
    --evidence               Evidence / VPAT markdown report
    --format <name>          Repeatable: plain|json|sarif|evidence|markdown
    --suggest                Print label suggestions for suggest-tier findings
    --plain                  Structured text, no Ink TUI
    --pack <name>            Limit to a pack (wcag-core, patternfly-v6, pf, …)
    --include <ruleId>       Only these rules (repeatable)
    --exclude <ruleId>       Skip these rules (wins over include; repeatable)
    --do-not-auto-add-defaults
                             Require --include / config include list
    --patternfly-version <v5|v6>
    --fail-on <error|warning|never>
    --out <file>             Write current --format output to file
    --theme <auto|high-contrast>
    --allow-dirty            Allow \`capya11y pr\` on a dirty git tree
    --runtime                Also mount TSX via Playwright CT + axe + tabbable

  Examples
    $ capya11y scan ./src
    $ capya11y fix ./src --safe --dry-run
    $ capya11y scan . --format sarif --out capya11y.sarif --format evidence --out evidence.md
    $ capya11y scan . --exclude pf-is-aria-disabled --plain
    $ capya11y scan packages/fixtures/demo/RuntimeBroken.tsx --runtime --plain
    $ capya11y rules list --pack patternfly-v6
    $ capya11y pr packages/fixtures/demo --safe --dry-run
    $ capya11y explain pf-button-icon-only-name
`;
