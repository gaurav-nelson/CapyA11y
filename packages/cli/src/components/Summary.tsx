import React from "react";
import { Box, Text } from "ink";
import type { Theme } from "../theme/tokens.js";

export function Summary({
  theme,
  filesScanned,
  rulesLoaded,
  packs,
  findingCount,
}: {
  theme: Theme;
  filesScanned: number;
  rulesLoaded: number;
  packs: string[];
  findingCount: number;
}) {
  return (
    <Box flexDirection="column">
      <Text color={theme.colorEnabled ? theme.muted : undefined}>
        Files {filesScanned} · Rules {rulesLoaded} · Packs {packs.join(", ") || "—"} · Findings{" "}
        {findingCount}
      </Text>
    </Box>
  );
}
