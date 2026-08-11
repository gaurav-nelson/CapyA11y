import {
  defaultPackDirs,
  listPackManifests,
  loadPacks,
  type ChecksConfig,
  type Rule,
} from "@capya11y/core";

export function formatRulesTable(rules: Rule[]): string {
  const rows = rules
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => {
      const wcag = r.wcag.join(",") || "—";
      return `${r.id.padEnd(36)} ${r.pack.padEnd(16)} ${r.severity.padEnd(8)} ${r.autofix.padEnd(8)} ${wcag}`;
    });
  const header = `${"ID".padEnd(36)} ${"PACK".padEnd(16)} ${"SEVERITY".padEnd(8)} ${"AUTOFIX".padEnd(8)} WCAG`;
  return [header, "-".repeat(header.length), ...rows, "", `${rules.length} rules`].join("\n");
}

export function formatPacksTable(
  packs: Array<{ id: string; name?: string; description?: string; patternflyVersion?: string }>,
): string {
  const rows = packs.map((p) => {
    const ver = p.patternflyVersion ?? "—";
    const name = p.name ?? p.id;
    return `${p.id.padEnd(20)} ${ver.padEnd(6)} ${name}`;
  });
  const header = `${"ID".padEnd(20)} ${"PF".padEnd(6)} NAME`;
  return [header, "-".repeat(Math.max(header.length, 40)), ...rows, "", `${packs.length} packs`].join(
    "\n",
  );
}

export function listRules(options: {
  packs?: string[];
  packDirs?: string[];
  checks?: ChecksConfig;
  patternflyVersion?: "v5" | "v6";
}): Rule[] {
  return loadPacks(options.packDirs?.length ? options.packDirs : defaultPackDirs(), options.packs, {
    patternflyVersion: options.patternflyVersion,
    checks: options.checks,
  });
}

export function listPacks(packDirs?: string[]) {
  return listPackManifests(packDirs);
}
