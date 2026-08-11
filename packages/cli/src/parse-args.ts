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
}

export interface ParsedCli {
  command: string;
  positionals: string[];
  flags: CliFlags;
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
    } else if (arg === "--plain") {
      flags.plain = true;
    } else if (arg === "--sarif") {
      flags.sarif = true;
    } else if (arg === "--evidence") {
      flags.evidence = true;
    } else if (arg === "--suggest") {
      flags.suggest = true;
    } else if (arg === "--theme") {
      flags.theme = argv[++i] ?? "auto";
    } else if (arg.startsWith("--theme=")) {
      flags.theme = arg.slice("--theme=".length);
    } else if (arg === "--out" || arg === "-o") {
      flags.out = argv[++i];
    } else if (arg.startsWith("--out=")) {
      flags.out = arg.slice("--out=".length);
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
    } else if (arg.startsWith("-")) {
      // ignore unknown flags
    } else {
      positionals.push(arg);
    }
  }

  const [command = "scan", ...rest] = positionals;
  return { command, positionals: rest, flags };
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
    init                     Create .capya11y.yml + 60s demo instructions

  Options
    --safe                   Apply only safe autofixes (default for fix)
    --dry-run                Show patches without writing
    --json                   Machine-readable JSON output
    --sarif                  SARIF 2.1 output (GitHub Code Scanning)
    --evidence               Evidence / VPAT markdown report
    --suggest                Print label suggestions for suggest-tier findings
    --plain                  Structured text, no Ink TUI
    --pack <name>            Limit to a pack (wcag-core, patternfly-v6, pf, …)
    --patternfly-version <v5|v6>
    --fail-on <error|warning|never>
    --out <file>             Write report to file
    --theme <auto|high-contrast>

  Examples
    $ capya11y scan ./src
    $ capya11y fix ./src --safe --dry-run
    $ capya11y scan . --sarif --out capya11y.sarif
    $ capya11y report packages/fixtures/demo --evidence --out evidence.md
    $ capya11y suggest packages/fixtures/demo --json
    $ capya11y explain pf-button-icon-only-name
`;
