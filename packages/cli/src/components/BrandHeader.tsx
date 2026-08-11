import React from "react";
import { Box, Text } from "ink";
import type { Theme } from "../theme/tokens.js";

export function BrandHeader({ theme }: { theme: Theme }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={theme.colorEnabled ? theme.brand : undefined}>
        CapyA11y
      </Text>
      <Text color={theme.colorEnabled ? theme.muted : undefined}>
        Capy-Ally — accessibility remediation, zero friction
      </Text>
    </Box>
  );
}
