import type { Page } from "playwright";
import type { FocusHit } from "./map-to-finding.js";
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";

const require = createRequire(import.meta.url);

async function injectTabbable(page: Page): Promise<void> {
  let umd = "";
  try {
    const p = require.resolve("tabbable/dist/index.umd.min.js");
    if (existsSync(p)) umd = readFileSync(p, "utf8");
  } catch {
    /* fall through */
  }
  if (umd) {
    await page.addScriptTag({ content: umd });
    // UMD exposes { tabbable, focusable, isTabbable, ... } on window.tabbable
    await page.addScriptTag({
      content: `
        (function () {
          var mod = window.tabbable;
          if (mod && typeof mod.tabbable === "function") {
            window.__capya11yTabbable = mod.tabbable.bind(mod);
          } else if (typeof mod === "function") {
            window.__capya11yTabbable = mod;
          }
        })();
      `,
    });
    return;
  }
  // Minimal focusable query if UMD not present (tabbable API subset)
  await page.addScriptTag({
    content: `
      window.__capya11yTabbable = function(root) {
        const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
        return Array.from((root||document).querySelectorAll(sel)).filter(el => {
          const style = window.getComputedStyle(el);
          return style.visibility !== 'hidden' && style.display !== 'none';
        });
      };
    `,
  });
}

interface FocusableInfo {
  selector: string;
  sourceAttr?: string;
  tag: string;
  tabIndex: number;
}

async function collectFocusables(page: Page): Promise<FocusableInfo[]> {
  return page.evaluate(() => {
    const tabbableFn = (window as unknown as {
      __capya11yTabbable?: (r?: ParentNode) => Element[];
    }).__capya11yTabbable;
    if (typeof tabbableFn !== "function") {
      throw new Error("tabbable helper was not injected");
    }
    const nodes = tabbableFn(document);
    const cssPath = (el: Element): string => {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts: string[] = [];
      let cur: Element | null = el;
      while (cur && cur.nodeType === 1 && parts.length < 5) {
        let part = cur.tagName.toLowerCase();
        const parent: Element | null = cur.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((c) => c.tagName === cur!.tagName);
          if (siblings.length > 1) {
            part += `:nth-of-type(${siblings.indexOf(cur) + 1})`;
          }
        }
        parts.unshift(part);
        cur = parent;
        if (cur && cur.id === "root") break;
      }
      return parts.join(" > ");
    };
    return nodes.map((el) => ({
      selector: cssPath(el),
      sourceAttr: el.getAttribute("data-capya11y-source") ?? undefined,
      tag: el.tagName.toLowerCase(),
      tabIndex: (el as HTMLElement).tabIndex,
    }));
  });
}

function hasVisibleFocusIndicator(styles: {
  outlineStyle: string;
  outlineWidth: string;
  boxShadow: string;
}): boolean {
  const outlineOk =
    styles.outlineStyle !== "none" &&
    styles.outlineStyle !== "" &&
    parseFloat(styles.outlineWidth || "0") > 0;
  const shadowOk = Boolean(styles.boxShadow && styles.boxShadow !== "none");
  return outlineOk || shadowOk;
}

/** tabbable-based focus order + focus-visible checks via Playwright keyboard. */
export async function runFocusChecks(page: Page): Promise<FocusHit[]> {
  await injectTabbable(page);
  const expected = await collectFocusables(page);
  const hits: FocusHit[] = [];

  if (expected.length === 0) return hits;

  // Positive tabindex scramble heuristic
  const positive = expected.filter((e) => e.tabIndex > 0);
  if (positive.length > 0) {
    for (const el of positive) {
      hits.push({
        kind: "focus-order",
        message: `Element uses positive tabindex=${el.tabIndex}, which can break natural focus order.`,
        selector: el.selector,
        sourceAttr: el.sourceAttr,
      });
    }
  }

  // Reset focus then Tab through
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    document.body.focus();
  });

  for (let i = 0; i < expected.length; i++) {
    await page.keyboard.press("Tab");
    const actual = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cssPath = (node: Element): string => {
        if (node.id) return `#${CSS.escape(node.id)}`;
        const parts: string[] = [];
        let cur: Element | null = node;
        while (cur && cur.nodeType === 1 && parts.length < 5) {
          let part = cur.tagName.toLowerCase();
          const parent: Element | null = cur.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((c) => c.tagName === cur!.tagName);
            if (siblings.length > 1) {
              part += `:nth-of-type(${siblings.indexOf(cur) + 1})`;
            }
          }
          parts.unshift(part);
          cur = parent;
          if (cur && cur.id === "root") break;
        }
        return parts.join(" > ");
      };
      const style = window.getComputedStyle(el);
      return {
        selector: cssPath(el),
        sourceAttr: el.getAttribute("data-capya11y-source") ?? undefined,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    const exp = expected[i];
    if (!actual) {
      hits.push({
        kind: "focus-order",
        message: `Expected focus on tabbable index ${i} (${exp?.selector ?? "?"}) but nothing received focus.`,
        selector: exp?.selector,
        sourceAttr: exp?.sourceAttr,
        index: i,
      });
      continue;
    }

    // Soft order check: if selectors diverge and neither is body, flag
    if (exp && actual.selector !== exp.selector && !actual.selector.includes(exp.tag)) {
      hits.push({
        kind: "focus-order",
        message: `Tab order mismatch at index ${i}: expected roughly ${exp.selector}, focused ${actual.selector}.`,
        selector: actual.selector,
        sourceAttr: actual.sourceAttr ?? exp.sourceAttr,
        index: i,
      });
    }

    if (
      !hasVisibleFocusIndicator({
        outlineStyle: actual.outlineStyle,
        outlineWidth: actual.outlineWidth,
        boxShadow: actual.boxShadow,
      })
    ) {
      hits.push({
        kind: "focus-visible",
        message: `Focused element lacks a visible focus indicator (outline/box-shadow).`,
        selector: actual.selector,
        sourceAttr: actual.sourceAttr,
        index: i,
      });
    }
  }

  return hits;
}
