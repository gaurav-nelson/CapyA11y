import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { RuleSchema, type Rule } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve default pack directories relative to monorepo packages/ */
export function defaultPackDirs(): string[] {
  const candidates = [
    join(__dirname, "../../rules-wcag/rules"),
    join(__dirname, "../../rules-patternfly/rules"),
    // when running from dist/
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

export function loadRuleFile(path: string): Rule {
  const raw = readFileSync(path, "utf8");
  const data = parseYaml(raw);
  return RuleSchema.parse(data);
}

export function loadPacks(dirs: string[], packFilter?: string[]): Rule[] {
  const rules: Rule[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    for (const file of collectYamlFiles(dir)) {
      try {
        const rule = loadRuleFile(file);
        if (packFilter && packFilter.length > 0 && !packFilter.includes(rule.pack)) {
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

  return rules;
}

export function findRuleById(rules: Rule[], id: string): Rule | undefined {
  return rules.find((r) => r.id === id);
}
