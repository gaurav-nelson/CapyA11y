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
    const t = setTimeout(() => exit(), 50);
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
            Enabled packs: wcag-core, patternfly-v6 · autofix: safe · theme: auto
          </Text>
        </>
      )}
    </Box>
  );
}
