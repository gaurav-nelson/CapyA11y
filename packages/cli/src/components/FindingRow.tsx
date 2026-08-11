import React from "react";
import { Box, Text } from "ink";
import type { Finding } from "@capya11y/core";
import { severityMeta, type Theme } from "../theme/tokens.js";

export function FindingRow({ finding, theme }: { finding: Finding; theme: Theme }) {
  const meta = severityMeta(finding.severity);
  const color = theme.colorEnabled ? theme[meta.colorKey] : undefined;
  const wcag = finding.wcag.length ? ` [${finding.wcag.join(", ")}]` : "";
  const fix =
    finding.autofix === "safe"
      ? " [safe]"
      : finding.autofix === "suggest"
        ? " [suggest]"
        : "";

  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box>
        <Text color={color} bold>
          {meta.symbol} {meta.label}
        </Text>
        <Text>
          {" "}
          {finding.range.startLine}:{finding.range.startColumn}{" "}
        </Text>
        <Text color={theme.colorEnabled ? theme.brand : undefined}>{finding.ruleId}</Text>
        <Text color={theme.colorEnabled ? theme.muted : undefined}>
          {wcag}
          {fix}
        </Text>
      </Box>
      <Text> {finding.message}</Text>
    </Box>
  );
}
