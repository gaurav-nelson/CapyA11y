export interface CliFlags {
  safe: boolean;
  dryRun: boolean;
  json: boolean;
  plain: boolean;
  pack: string[];
  theme: string;
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
    } else if (arg === "--theme") {
      flags.theme = argv[++i] ?? "auto";
    } else if (arg.startsWith("--theme=")) {
      flags.theme = arg.slice("--theme=".length);
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
    init                     Create .capya11y.yml

  Options
    --safe                   Apply only safe autofixes (default for fix)
    --dry-run                Show patches without writing
    --json                   Machine-readable JSON output
    --plain                  Structured text, no Ink TUI
    --pack <name>            Limit to a pack (repeatable)
    --theme <auto|high-contrast>

  Examples
    $ capya11y scan ./src
    $ capya11y fix ./src --safe --dry-run
    $ capya11y explain pf-button-icon-only-name
    $ NO_COLOR=1 capya11y scan . --plain
`;
