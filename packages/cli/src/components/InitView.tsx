import React, { useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import { writeDefaultConfig } from "@capya11y/core";
import { BrandHeader } from "./BrandHeader.js";
import type { Theme } from "../theme/tokens.js";

export function InitView({ theme, cwd }: { theme: Theme; cwd: string }) {
  const { exit } = useApp();
  const [path, setPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPath(writeDefaultConfig(cwd));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    const t = setTimeout(() => exit(), 80);
    return () => clearTimeout(t);
  }, [cwd, exit]);

  return (
    <Box flexDirection="column">
      <BrandHeader theme={theme} />
      {error && (
        <Text color={theme.colorEnabled ? theme.error : undefined}>✕ ERR {error}</Text>
      )}
      {path && (
        <>
          <Text color={theme.colorEnabled ? theme.success : undefined}>
            ✓ OK Wrote {path}
          </Text>
          <Text color={theme.colorEnabled ? theme.muted : undefined}>
            Packs: wcag-core, patternfly-v6 · autofix: safe · failOn: error · PF v6
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <Text bold>60-second demo</Text>
            <Text>  pnpm capya11y scan packages/fixtures/demo/BrokenPage.tsx</Text>
            <Text>  pnpm capya11y fix packages/fixtures/demo/BrokenPage.tsx --safe --dry-run</Text>
            <Text>  pnpm capya11y explain pf-alert-toast-live-region</Text>
            <Text>  pnpm capya11y report packages/fixtures/demo --out evidence.md</Text>
            <Text>  pnpm capya11y suggest packages/fixtures/demo --json</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
