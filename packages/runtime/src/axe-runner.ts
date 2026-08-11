import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "playwright";
import type { AxeNodeHit } from "./map-to-finding.js";

async function readSourceAttr(page: Page, selector: string): Promise<string | undefined> {
  try {
    return await page.locator(selector).first().getAttribute("data-capya11y-source") ?? undefined;
  } catch {
    return undefined;
  }
}

/** Run axe-core (WCAG 2.2 AA tags) against the mounted page. */
export async function runAxeOnPage(page: Page): Promise<AxeNodeHit[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const hits: AxeNodeHit[] = [];
  for (const v of results.violations) {
    for (const node of v.nodes) {
      const target = node.target.map(String);
      const selector = target[0] ?? "body";
      const sourceAttr = await readSourceAttr(page, selector);
      hits.push({
        axeRuleId: v.id,
        help: v.help,
        helpUrl: v.helpUrl,
        impact: v.impact,
        html: node.html,
        target,
        sourceAttr,
        failureSummary: node.failureSummary,
      });
    }
  }
  return hits;
}
