import React, { useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { explainRule } from "@capya11y/core";
import { BrandHeader } from "./BrandHeader.js";
import type { Theme } from "../theme/tokens.js";

export function ExplainView({ ruleId, theme }: { ruleId: string; theme: Theme }) {
  const { exit } = useApp();
  const result = explainRule(ruleId);

  useEffect(() => {
    const t = setTimeout(() => exit(), 50);
    return () => clearTimeout(t);
  }, [exit]);

  if (!result) {
    return (
      <Box flexDirection="column">
        <BrandHeader theme={theme} />
        <Text color={theme.colorEnabled ? theme.error : undefined}>
          ✕ ERR Unknown rule: {ruleId}
        </Text>
      </Box>
    );
  }

  const { rule } = result;

  return (
    <Box flexDirection="column">
      <BrandHeader theme={theme} />
      <Text bold color={theme.colorEnabled ? theme.brand : undefined}>
        {rule.id}
      </Text>
      <Text color={theme.colorEnabled ? theme.muted : undefined}>
        Pack {rule.pack} · Severity {rule.severity} · Autofix {rule.autofix}
        {rule.wcag.length ? ` · WCAG ${rule.wcag.join(", ")}` : ""}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text>{rule.message.trim()}</Text>
      </Box>
      {rule.education && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Why it matters</Text>
          <Text>{rule.education.trim()}</Text>
        </Box>
      )}
      {rule.helpUrl && (
        <Box marginTop={1}>
          <Text color={theme.colorEnabled ? theme.info : undefined}>i INF {rule.helpUrl}</Text>
        </Box>
      )}
      {rule.example?.before && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Before</Text>
          <Text>{rule.example.before.trim()}</Text>
        </Box>
      )}
      {rule.example?.after && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>After</Text>
          <Text>{rule.example.after.trim()}</Text>
        </Box>
      )}
    </Box>
  );
}
