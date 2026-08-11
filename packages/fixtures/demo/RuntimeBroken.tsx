import React from "react";

/**
 * Lightweight runtime-only fixture (no PatternFly deps).
 * Intentional contrast, name, and focus issues for `capya11y scan --runtime`.
 */
export function RuntimeBroken() {
  return (
    <div>
      <p style={{ color: "#ccc", background: "#fff" }}>Low contrast text</p>
      <button type="button" />
      <button type="button" style={{ outline: "none" }}>
        Save
      </button>
      <a href="/x" style={{ color: "#eee", background: "#fff" }}>
        click here
      </a>
      <input type="text" />
    </div>
  );
}
