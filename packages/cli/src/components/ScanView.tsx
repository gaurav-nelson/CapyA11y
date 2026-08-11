import React, { useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import {
  scan,
  type ChecksConfig,
  type IgnoreRuleConfig,
  type ScanResult,
} from "@capya11y/core";
import { BrandHeader } from "./BrandHeader.js";
import { FindingRow } from "./FindingRow.js";
import { Summary } from "./Summary.js";
import type { Theme } from "../theme/tokens.js";

export function ScanView({
  roots,
  packs,
  ignore,
  checks,
  ignoreRules,
  patternflyVersion,
  runtime,
  urls,
  at,
  urlWaitFor,
  theme,
  onDone,
}: {
  roots: string[];
  packs?: string[];
  ignore?: string[];
  checks?: ChecksConfig;
  ignoreRules?: IgnoreRuleConfig[];
  patternflyVersion?: "v5" | "v6";
  runtime?: boolean;
  urls?: string[];
  at?: "auto" | "voiceover" | "nvda";
  urlWaitFor?: string;
  theme: Theme;
  onDone?: (result: ScanResult) => void;
}) {
  const { exit } = useApp();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await scan({
          roots,
          packs,
          ignore,
          checks,
          ignoreRules,
          patternflyVersion,
          runtime,
          urls,
          at,
          urlWaitFor,
        });
        if (!cancelled) {
          setResult(r);
          onDone?.(r);
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
  }, [roots.join("|"), packs?.join("|"), ignore?.join("|")]);

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
          Scanning for accessibility issues…
        </Text>
      </Box>
    );
  }

  const byFile = new Map<string, typeof result.findings>();
  for (const f of result.findings) {
    const list = byFile.get(f.file) ?? [];
    list.push(f);
    byFile.set(f.file, list);
  }

  return (
    <Box flexDirection="column">
      <BrandHeader theme={theme} />
      <Summary
        theme={theme}
        filesScanned={result.filesScanned}
        rulesLoaded={result.rulesLoaded}
        packs={result.packs}
        findingCount={result.findings.length}
      />
      {[...byFile.entries()].map(([file, findings]) => (
        <Box key={file} flexDirection="column" marginTop={1}>
          <Text bold color={theme.colorEnabled ? theme.text : undefined}>
            {file}
          </Text>
          {findings.map((f, i) => (
            <FindingRow key={`${f.ruleId}-${f.range.startLine}-${i}`} finding={f} theme={theme} />
          ))}
        </Box>
      ))}
      {result.findings.length === 0 && (
        <Text color={theme.colorEnabled ? theme.success : undefined}>
          ✓ OK No accessibility issues found.
        </Text>
      )}
    </Box>
  );
}
