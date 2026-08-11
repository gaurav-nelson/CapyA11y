import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { ConfigSchema, type CapyConfig } from "./schema.js";

export function loadConfig(cwd = process.cwd(), explicitPath?: string): CapyConfig {
  const path = explicitPath
    ? resolve(cwd, explicitPath)
    : resolve(cwd, ".capya11y.yml");
  if (!existsSync(path)) {
    return ConfigSchema.parse({});
  }
  const raw = parseYaml(readFileSync(path, "utf8")) ?? {};
  return ConfigSchema.parse(raw);
}

export function writeDefaultConfig(cwd = process.cwd()): string {
  const path = resolve(cwd, ".capya11y.yml");
  const config: CapyConfig = ConfigSchema.parse({
    packs: ["wcag-core", "patternfly-v6"],
    autofix: "safe",
    theme: "auto",
    failOn: "error",
    patternflyVersion: "v6",
    checks: {
      doNotAutoAddDefaults: false,
      include: [],
      exclude: [],
    },
    ignoreRules: [],
  });
  writeFileSync(path, stringifyYaml(config), "utf8");
  return path;
}
