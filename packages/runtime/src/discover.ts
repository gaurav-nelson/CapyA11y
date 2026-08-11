import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { glob } from "glob";

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/*.example.tsx",
  "**/*.example.jsx",
  "**/*.test.tsx",
  "**/*.test.jsx",
  "**/*.spec.tsx",
  "**/*.spec.jsx",
  "**/ct-tests/**",
];

export function discoverComponentFiles(
  roots: string[],
  ignore: string[] = [],
): string[] {
  const ignoreAll = [...new Set([...DEFAULT_IGNORE, ...ignore])];
  const files = new Set<string>();
  for (const root of roots) {
    const abs = resolve(root);
    if (!existsSync(abs)) continue;
    const pattern = abs.match(/\.[jt]sx$/)
      ? abs
      : `${abs.replace(/\/$/, "")}/**/*.{tsx,jsx}`;
    for (const m of glob.sync(pattern, { ignore: ignoreAll, nodir: true, absolute: true })) {
      files.add(m);
    }
  }
  return [...files];
}
