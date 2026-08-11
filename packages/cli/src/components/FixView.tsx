import React, { useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import {
  applyFixes,
  scan,
  type ApplyResult,
  type ChecksConfig,
  type IgnoreRuleConfig,
} from "@capya11y/core";
import { BrandHeader } from "./BrandHeader.js";
import type { Theme } from "../theme/tokens.js";

export function FixView({
  roots,
  packs,
  ignore,
  checks,
  ignoreRules,
  patternflyVersion,
  theme,
  dryRun,
  mode,
  onDone,
}: {
  roots: string[];
  packs?: string[];
  ignore?: string[];
  checks?: ChecksConfig;
  ignoreRules?: IgnoreRuleConfig[];
  patternflyVersion?: "v5" | "v6";
  theme: Theme;
  dryRun: boolean;
  mode: "safe" | "all";
  onDone?: (result: ApplyResult) => void;
}) {
  const { exit } = useApp();
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState("Scanning…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPhase("Scanning…");
        const scanned = await scan({
          roots,
          packs,
          ignore,
          checks,
          ignoreRules,
          patternflyVersion,
        });
        if (cancelled) return;
        setPhase(dryRun ? "Building patches…" : "Applying safe fixes…");
        const applied = await applyFixes({
          findings: scanned.findings,
          mode,
          dryRun,
        });
        if (!cancelled) {
          setResult(applied);
          onDone?.(applied);
          setTimeout(() => exit(), 50);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setTimeout(() => exit(), 50);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roots.join("|"), ignore?.join("|"), dryRun, mode]);

  if (error) {
    return (
      <Box flexDirection="column">
        <BrandHeader theme={theme} />
        <Text color={theme.colorEnabled ? theme.error : undefined}>✕ ERR {error}</Text>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box flexDirection="column">
        <BrandHeader theme={theme} />
        <Text>
          <Text color={theme.colorEnabled ? theme.brand : undefined}>
            <Spinner type="dots" />
          </Text>{" "}
          {phase}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <BrandHeader theme={theme} />
      <Text color={theme.colorEnabled ? theme.success : undefined}>
        ✓ {dryRun ? "Dry run complete" : "Remediation complete"}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>
          Applied: {result.applied.length}
          {dryRun ? " (not written)" : ""}
        </Text>
        <Text>Suggested: {result.suggested.length}</Text>
        <Text>Skipped: {result.skipped.length}</Text>
      </Box>
      {result.applied.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Applied</Text>
          {result.applied.map((a, i) => (
            <Text key={i}>
              {" "}
              · {a.file}:{a.finding.range.startLine} {a.finding.ruleId} — {a.description}
            </Text>
          ))}
        </Box>
      )}
      {result.suggested.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color={theme.colorEnabled ? theme.warning : undefined}>
            ! WRN Suggested (needs copy / approval)
          </Text>
          {result.suggested.map((s, i) => (
            <Text key={i}>
              {" "}
              · {s.file}:{s.range.startLine} {s.ruleId} — {s.message}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
