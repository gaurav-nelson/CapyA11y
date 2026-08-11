import type { JsxOpeningElement, JsxSelfClosingElement, Node } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import type { DetectWhen, Rule } from "./schema.js";

type JsxElementLike = JsxOpeningElement | JsxSelfClosingElement;

export function getElementName(el: JsxElementLike): string {
  return el.getTagNameNode().getText();
}

export function getPropNames(el: JsxElementLike): Set<string> {
  const names = new Set<string>();
  for (const attr of el.getAttributes()) {
    if (attr.getKind() === SyntaxKind.JsxAttribute) {
      const name = attr.asKindOrThrow(SyntaxKind.JsxAttribute).getNameNode().getText();
      names.add(name);
    }
  }
  return names;
}

export function getPropLiteralValue(
  el: JsxElementLike,
  prop: string,
): string | boolean | undefined {
  for (const attr of el.getAttributes()) {
    if (attr.getKind() !== SyntaxKind.JsxAttribute) continue;
    const a = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
    if (a.getNameNode().getText() !== prop) continue;
    const init = a.getInitializer();
    if (!init) return true; // boolean shorthand
    if (init.getKind() === SyntaxKind.StringLiteral) {
      return init.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
    }
    if (init.getKind() === SyntaxKind.JsxExpression) {
      const expr = init.asKindOrThrow(SyntaxKind.JsxExpression).getExpression();
      if (!expr) return true;
      if (expr.getKind() === SyntaxKind.TrueKeyword) return true;
      if (expr.getKind() === SyntaxKind.FalseKeyword) return false;
      if (expr.getKind() === SyntaxKind.StringLiteral) {
        return expr.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
      }
    }
  }
  return undefined;
}

export function hasProp(el: JsxElementLike, name: string): boolean {
  return getPropNames(el).has(name);
}

function getVisibleText(el: JsxElementLike): string {
  const parent = el.getParent();
  if (!parent) return "";
  // Self-closing: no children
  if (el.getKind() === SyntaxKind.JsxSelfClosingElement) return "";
  // Opening element → parent JsxElement has children
  if (parent.getKind() === SyntaxKind.JsxElement) {
    const jsx = parent.asKindOrThrow(SyntaxKind.JsxElement);
    return jsx
      .getJsxChildren()
      .map((c) => {
        if (c.getKind() === SyntaxKind.JsxText) {
          return c.getText().trim();
        }
        if (c.getKind() === SyntaxKind.JsxExpression) {
          const expr = c.asKindOrThrow(SyntaxKind.JsxExpression).getExpression();
          if (expr?.getKind() === SyntaxKind.StringLiteral) {
            return expr.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
          }
        }
        return "";
      })
      .join(" ")
      .trim();
  }
  return "";
}

function hasOnlyIconChildren(el: JsxElementLike): boolean {
  const parent = el.getParent();
  if (!parent || parent.getKind() !== SyntaxKind.JsxElement) return false;
  const jsx = parent.asKindOrThrow(SyntaxKind.JsxElement);
  const children = jsx.getJsxChildren().filter((c) => {
    if (c.getKind() === SyntaxKind.JsxText) return c.getText().trim().length > 0;
    return true;
  });
  if (children.length === 0) return true; // icon-only empty or self-closing style
  return children.every((c) => {
    if (c.getKind() === SyntaxKind.JsxSelfClosingElement) {
      const name = c.asKindOrThrow(SyntaxKind.JsxSelfClosingElement).getTagNameNode().getText();
      return /Icon$/.test(name) || name === "svg";
    }
    if (c.getKind() === SyntaxKind.JsxElement) {
      const open = c.asKindOrThrow(SyntaxKind.JsxElement).getOpeningElement();
      const name = open.getTagNameNode().getText();
      return /Icon$/.test(name) || name === "svg";
    }
    return false;
  });
}

function collectHtmlForTargets(sourceFile: Node): Set<string> {
  const targets = new Set<string>();
  sourceFile.forEachDescendant((node) => {
    if (
      node.getKind() !== SyntaxKind.JsxOpeningElement &&
      node.getKind() !== SyntaxKind.JsxSelfClosingElement
    ) {
      return;
    }
    const el = node as JsxElementLike;
    if (getElementName(el) !== "label") return;
    const htmlFor = getPropLiteralValue(el, "htmlFor");
    if (typeof htmlFor === "string" && htmlFor.length > 0) targets.add(htmlFor);
  });
  return targets;
}

function findParentFormGroupFieldId(el: JsxElementLike): string | undefined {
  let current: Node | undefined = el.getParent();
  while (current) {
    if (current.getKind() === SyntaxKind.JsxElement) {
      const open = current.asKindOrThrow(SyntaxKind.JsxElement).getOpeningElement();
      if (getElementName(open) === "FormGroup") {
        const fieldId = getPropLiteralValue(open, "fieldId");
        if (typeof fieldId === "string") return fieldId;
        // FormGroup with label but no fieldId still does not associate — return empty marker
        return propsHasLabel(open) ? "" : undefined;
      }
    }
    current = current.getParent();
  }
  return undefined;
}

function propsHasLabel(el: JsxElementLike): boolean {
  return hasProp(el, "label");
}

/** True when control has label via htmlFor/id or FormGroup fieldId/id match. */
export function hasAccessibleNameAssociation(el: JsxElementLike): boolean {
  const id = getPropLiteralValue(el, "id");
  if (typeof id === "string" && id.length > 0) {
    const htmlForTargets = collectHtmlForTargets(el.getSourceFile());
    if (htmlForTargets.has(id)) return true;

    const formGroupFieldId = findParentFormGroupFieldId(el);
    if (formGroupFieldId !== undefined && formGroupFieldId === id) return true;
  }
  return false;
}

function decorativeIconChildMissingHidden(el: JsxElementLike): boolean {
  const parent = el.getParent();
  if (!parent || parent.getKind() !== SyntaxKind.JsxElement) return false;
  const jsx = parent.asKindOrThrow(SyntaxKind.JsxElement);
  for (const c of jsx.getJsxChildren()) {
    let childEl: JsxElementLike | undefined;
    if (c.getKind() === SyntaxKind.JsxSelfClosingElement) {
      childEl = c.asKindOrThrow(SyntaxKind.JsxSelfClosingElement);
    } else if (c.getKind() === SyntaxKind.JsxElement) {
      childEl = c.asKindOrThrow(SyntaxKind.JsxElement).getOpeningElement();
    }
    if (!childEl) continue;
    const name = getElementName(childEl);
    if (!/Icon$/.test(name) && name !== "svg") continue;
    if (!hasProp(childEl, "aria-hidden") && !hasProp(childEl, "ariaHidden")) {
      return true;
    }
  }
  return false;
}

const POOR_LINK_TEXTS = new Set([
  "click here",
  "here",
  "read more",
  "more",
  "link",
  "learn more",
]);

function matchesWhen(el: JsxElementLike, when: DetectWhen): boolean {
  const props = getPropNames(el);
  const name = getElementName(el);

  if (when.tagName && name !== when.tagName) return false;

  if (when.variant?.length) {
    const v = getPropLiteralValue(el, "variant");
    if (typeof v !== "string" || !when.variant.includes(v)) return false;
  }

  if (when.missingProps?.length) {
    for (const p of when.missingProps) {
      if (props.has(p)) return false;
    }
  }

  if (when.hasProps?.length) {
    for (const p of when.hasProps) {
      if (!props.has(p)) return false;
    }
  }

  if (when.missingAnyOfProps?.length) {
    const hasAny = when.missingAnyOfProps.some((p) => props.has(p));
    if (hasAny) return false;
  }

  if (when.propEquals) {
    for (const [key, expected] of Object.entries(when.propEquals)) {
      const actual = getPropLiteralValue(el, key);
      if (actual !== expected) return false;
    }
  }

  if (when.propTruthy?.length) {
    for (const p of when.propTruthy) {
      const v = getPropLiteralValue(el, p);
      if (v === false || v === undefined) return false;
    }
  }

  if (when.noVisibleText) {
    const text = getVisibleText(el);
    const onlyIcons = hasOnlyIconChildren(el);
    if (text.length > 0 && !onlyIcons) return false;
    // For Button with text children that aren't icons, fail match
    if (text.length > 0) return false;
  }

  if (when.missingAlt) {
    if (name !== "img" && name !== "Avatar") return false;
    if (props.has("alt")) return false;
  }

  if (when.unlabeledControl) {
    const controls = new Set(["input", "select", "textarea", "TextInput", "TextArea", "FormSelect"]);
    if (!controls.has(name)) return false;
    if (props.has("aria-label") || props.has("aria-labelledby") || props.has("ariaLabelledBy")) {
      return false;
    }
    // Visible <label htmlFor> or PatternFly FormGroup fieldId association counts.
    if (hasAccessibleNameAssociation(el)) return false;
  }

  if (when.clickableWithoutKeyboard) {
    if (!props.has("onClick")) return false;
    if (["button", "a", "Button", "Link"].includes(name)) return false;
    if (props.has("onKeyDown") || props.has("onKeyPress") || props.has("role")) return false;
  }

  if (when.poorLinkText) {
    if (name !== "a" && name !== "Link") return false;
    const text = getVisibleText(el).toLowerCase();
    if (!text || !POOR_LINK_TEXTS.has(text)) return false;
  }

  if (when.hasIsDisabled) {
    if (!props.has("isDisabled")) return false;
  }

  if (when.decorativeIconChildMissingHidden) {
    if (!decorativeIconChildMissingHidden(el)) return false;
  }

  if (when.formGroupMissingFieldId) {
    if (name !== "FormGroup") return false;
    if (!props.has("label")) return false;
    if (props.has("fieldId")) return false;
  }

  if (when.toastWithoutLiveRegion) {
    if (name !== "AlertGroup") return false;
    const isToast = getPropLiteralValue(el, "isToast");
    if (isToast !== true && !props.has("isToast")) return false;
    // isToast shorthand counts
    if (!props.has("isToast")) return false;
    if (props.has("isLiveRegion")) return false;
  }

  if (when.role) {
    const role = getPropLiteralValue(el, "role");
    if (role !== when.role) return false;
  }

  return true;
}

function importMatches(
  el: JsxElementLike,
  from?: string,
  component?: string,
): boolean {
  if (!from || !component) return true;
  const sourceFile = el.getSourceFile();
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const mod = imp.getModuleSpecifierValue();
    if (mod !== from && !mod.startsWith(from)) continue;
    for (const named of imp.getNamedImports()) {
      if (named.getName() === component) return true;
      if (named.getAliasNode()?.getText() === component) return true;
    }
    // default import alias unlikely for PF
  }
  // If component name matches but no import found, still allow for fixtures
  // that omit imports — only enforce when imports exist for that name
  const anyImportOfComponent = imports.some((imp) =>
    imp.getNamedImports().some((n) => n.getName() === component),
  );
  if (!anyImportOfComponent) return true;
  return false;
}

export function elementMatchesRule(el: JsxElementLike, rule: Rule): boolean {
  const name = getElementName(el);
  const { detect } = rule;

  if (detect.component && name !== detect.component) return false;
  if (detect.tagName && name !== detect.tagName) return false;
  if (!detect.component && !detect.tagName) {
    // rules must specify component or tagName unless when.tagName is set
    if (!detect.when.tagName && !detect.when.missingAlt && !detect.when.unlabeledControl && !detect.when.clickableWithoutKeyboard && !detect.when.poorLinkText) {
      return false;
    }
  }

  if (!importMatches(el, detect.from, detect.component)) return false;
  return matchesWhen(el, detect.when);
}

export function collectJsxElements(sourceFile: Node): JsxElementLike[] {
  const elements: JsxElementLike[] = [];
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.JsxOpeningElement) {
      elements.push(node.asKindOrThrow(SyntaxKind.JsxOpeningElement));
    } else if (node.getKind() === SyntaxKind.JsxSelfClosingElement) {
      elements.push(node.asKindOrThrow(SyntaxKind.JsxSelfClosingElement));
    }
  });
  return elements;
}
