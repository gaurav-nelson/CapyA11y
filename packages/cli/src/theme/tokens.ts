export type ThemeMode = "auto" | "high-contrast";

export interface Theme {
  brand: string;
  muted: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  colorEnabled: boolean;
  highContrast: boolean;
}

/** Accessible terminal palette — warm clay brand, never color-only meaning. */
export function resolveTheme(
  mode: ThemeMode = "auto",
  options: { plain?: boolean } = {},
): Theme {
  const noColor =
    options.plain === true ||
    process.env.NO_COLOR !== undefined ||
    process.env.FORCE_COLOR === "0";

  const highContrast = mode === "high-contrast" || process.env.CAPYA11Y_THEME === "high-contrast";

  if (noColor) {
    return {
      brand: "",
      muted: "",
      text: "",
      error: "",
      warning: "",
      success: "",
      info: "",
      colorEnabled: false,
      highContrast,
    };
  }

  // Prefer ANSI-friendly named colors that degrade well.
  // Brand: amber/yellow (clay), not purple.
  return {
    brand: highContrast ? "yellowBright" : "yellow",
    muted: highContrast ? "white" : "gray",
    text: "white",
    error: highContrast ? "redBright" : "red",
    warning: highContrast ? "yellowBright" : "yellow",
    success: highContrast ? "greenBright" : "green",
    info: highContrast ? "cyanBright" : "cyan",
    colorEnabled: true,
    highContrast,
  };
}

export function severityMeta(severity: "error" | "warning" | "info"): {
  label: string;
  symbol: string;
  colorKey: keyof Pick<Theme, "error" | "warning" | "info">;
} {
  switch (severity) {
    case "error":
      return { label: "ERR", symbol: "✕", colorKey: "error" };
    case "warning":
      return { label: "WRN", symbol: "!", colorKey: "warning" };
    case "info":
      return { label: "INF", symbol: "i", colorKey: "info" };
  }
}
