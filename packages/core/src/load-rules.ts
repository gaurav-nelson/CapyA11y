import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  RuleSchema,
  filterRulesByChecks,
  type ChecksConfig,
  type Rule,
} from "./schema.js";
import { resolveTemplateRule } from "./templates/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface PackManifest {
  id: string;
  name?: string;
  patternflyVersion?: "v5" | "v6";
  description?: string;
  docs?: string;
  aliases?: string[];
}

export function defaultPackDirs(): string[] {
  const candidates = [
    join(__dirname, "../../rules-wcag/rules"),
    join(__dirname, "../../rules-patternfly/rules"),
    join(__dirname, "../../../rules-wcag/rules"),
    join(__dirname, "../../../rules-patternfly/rules"),
  ];
  return [...new Set(candidates.filter((p) => existsSync(p)))];
}

function collectYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectYamlFiles(full));
    else if (entry.endsWith(".yml") || entry.endsWith(".yaml")) out.push(full);
  }
  return out;
}

function loadPackManifestNear(rulesDir: string): PackManifest | undefined {
  const candidates = [
    join(rulesDir, "..", "pack.json"),
    join(rulesDir, "pack.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as PackManifest;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function loadRuleFile(path: string): Rule {
  const raw = readFileSync(path, "utf8");
  const data = parseYaml(raw);
  const parsed = RuleSchema.parse(data);
  return resolveTemplateRule(parsed);
}

function normalizePackFilters(
  packFilter: string[] | undefined,
  patternflyVersion?: "v5" | "v6",
): string[] | undefined {
  if (!packFilter || packFilter.length === 0) {
    void patternflyVersion;
    return undefined;
  }
  const aliases: Record<string, string> = {
    wcag: "wcag-core",
    wcag22: "wcag-core",
    patternfly: "patternfly-v6",
    pf: "patternfly-v6",
    "pf-v6": "patternfly-v6",
    "patternfly-v6": "patternfly-v6",
    "pf-v5": "patternfly-v5",
    "patternfly-v5": "patternfly-v5",
  };
  return packFilter.map((p) => aliases[p] ?? p);
}

export interface LoadPacksOptions {
  patternflyVersion?: "v5" | "v6";
  checks?: ChecksConfig;
}

export function loadPacks(
  dirs: string[],
  packFilter?: string[],
  options?: LoadPacksOptions,
): Rule[] {
  const filters = normalizePackFilters(packFilter, options?.patternflyVersion);
  const rules: Rule[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    const manifest = loadPackManifestNear(dir);

    for (const file of collectYamlFiles(dir)) {
      try {
        const rule = loadRuleFile(file);
        if (filters && filters.length > 0 && !filters.includes(rule.pack)) {
          continue;
        }
        if (
          options?.patternflyVersion &&
          rule.pack.startsWith("patternfly-") &&
          manifest?.patternflyVersion &&
          manifest.patternflyVersion !== options.patternflyVersion
        ) {
          continue;
        }
        if (seen.has(rule.id)) continue;
        seen.add(rule.id);
        rules.push(rule);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Invalid rule file ${file}: ${msg}`);
      }
    }
  }

  if (options?.checks) {
    return filterRulesByChecks(rules, options.checks);
  }
  return rules;
}

export function findRuleById(rules: Rule[], id: string): Rule | undefined {
  return rules.find((r) => r.id === id);
}

export function resolvePackIdForVersion(version: "v5" | "v6"): string {
  return version === "v5" ? "patternfly-v5" : "patternfly-v6";
}

export function listPackManifests(dirs?: string[]): PackManifest[] {
  const packDirs = dirs?.length ? dirs : defaultPackDirs();
  const manifests: PackManifest[] = [];
  const seen = new Set<string>();
  for (const dir of packDirs) {
    const m = loadPackManifestNear(dir);
    if (m && !seen.has(m.id)) {
      seen.add(m.id);
      manifests.push(m);
    }
  }
  return manifests;
}
