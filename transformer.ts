import { parse, print, visit } from "./third_parties/recast/main.ts";
import { builders as b } from "ast-types";

import { ExpressionKind, StatementKind, LiteralKind } from "ast-types/lib/gen/kinds";
import { namedTypes } from "ast-types/gen/namedTypes";
import { NodePath } from "ast-types/lib/node-path";

import { cleanWhitespaceAfterLinebreaks, containsOnlyWhitespace } from "./utils";
import fs from "node:fs";

let f = fs.readFileSync("tests/deep.jsx", 'utf8');

let e = parse(f, { parser: require("recast/parsers/babel") });

function replaceJSXFragment(path: NodePath) {
    path.replace(b.jsxElement(b.jsxOpeningElement(b.jsxIdentifier("fragment"), []), b.jsxClosingElement(b.jsxIdentifier("fragment")), path.node.children));
    this.traverse(path);
}

if (f.includes("<>")) /* source code contains JSX fragment */ {
    visit(e, {
        visitJSXFragment(path) {
            path.replace(b.jsxElement(b.jsxOpeningElement(b.jsxIdentifier("fragment"), []), b.jsxClosingElement(b.jsxIdentifier("fragment")), path.node.children));
            this.traverse(path);
        }
    })
}

function tagNameInvariant(node: namedTypes.JSXIdentifier | namedTypes.JSXMemberExpression | namedTypes.JSXNamespacedName): asserts node is namedTypes.JSXIdentifier {
    if (node.type === "JSXMemberExpression" || node.type === "JSXNamespacedName") {
        let tag = print(node).code;
        let errorMsg = `Illegal tag name: <${tag}>. Namespaced tags (e.g. <svg:circle>) or member expressions (e.g. <Foo.Bar>) are not supported in @tanim/dom-operation.`;
        throw new Error(errorMsg);
    }
}

function collectAttributes(attrs: (namedTypes.JSXAttribute | namedTypes.JSXSpreadAttribute)[]) {
    return (attrs.map((attr) => {
        if (attr.type === "JSXAttribute") {
            let key: string;
            if (attr.name.type === "JSXNamespacedName") {
                key = attr.name.namespace.name + ":" + attr.name.name.name;
            } else {
                key = attr.name.name;
            }
            let value = attr.value;
            if (value === null || value === undefined || value.type === "BooleanLiteral") {
                return b.objectProperty(b.stringLiteral(key), b.booleanLiteral(true));
            } else if (value.type === "Literal") {
                return b.objectProperty(b.stringLiteral(key), b.literal(value.value));
            } else if (value.type === "JSXExpressionContainer") {
                if (value.expression.type === "JSXEmptyExpression") {
                    throw new Error("JSX attributes must only be assigned a non-empty expression.");
                }
                return b.objectProperty(b.stringLiteral(key), value.expression);
            } else if (value.type === "StringLiteral") {
                return b.objectProperty(b.stringLiteral(key), b.stringLiteral(value.value));
            } else if (value.type === "JSXElement" || value.type === "JSXFragment" || value.type === "JSXText") {
                throw new Error("@tanim/dom-operation forbids nesting JSX elements within JSX attributes. Please use a JSX expression container instead.");
            } else {
                throw new Error("Unexpected node type: " + value.type);
            }
        } else if (attr.type === "JSXSpreadAttribute") {
            return b.spreadElement(attr.argument);
        }
    }).filter(attr => attr !== null) ?? []) as (namedTypes.ObjectProperty | namedTypes.SpreadElement)[];
}

function processChild(node: namedTypes.JSXElement): {
    tag: string;
    attributes: (namedTypes.ObjectProperty | namedTypes.SpreadElement)[];
    children: any[];
} {
    tagNameInvariant(node.openingElement.name);
    let tag = node.openingElement.name.name;
    let attributes = collectAttributes(node.openingElement.attributes ?? []);

    const { staticAttributes, dynamicAttributes } = transformAttributes(attributes);
    console.log(staticAttributes, dynamicAttributes);

    let children: (namedTypes.StringLiteral |
        namedTypes.JSXElement |
        namedTypes.JSXEmptyExpression |
        ExpressionKind |
        namedTypes.SpreadElement |
    {
        type: string,
        tag: string,
        attributes: (namedTypes.ObjectProperty | namedTypes.SpreadElement)[],
        children: any[]
    }
    )[] = [];

    node.children!.forEach((child, index) => {
        if (child.type === "JSXElement") {
            let result = { ...processChild(child), type: "processedJSXChild" };
            children.push(result);
        } else if (child.type === "JSXText") {
            // remove whitespace between two JSXElements that are used for formatting
            if (index == 0 && containsOnlyWhitespace(child.value)) {
                return;
            }
            if (index == children!.length - 1 && containsOnlyWhitespace(child.value)) {
                return;
            }
            if (typeof children![index - 1] !== "undefined" && children![index - 1].type === "JSXElement"
                && typeof children![index + 1] !== "undefined" && children![index + 1].type === "JSXElement") {
                if (containsOnlyWhitespace(child.value)) {
                    return;
                }
            }
            children.push(b.stringLiteral(cleanWhitespaceAfterLinebreaks(child.value)));
        } else if (child.type === "JSXExpressionContainer") {
            const expr = child.expression;
            if (expr.type == "JSXEmptyExpression") {
                return;
            }
            children.push(child.expression)    // These expression can still contain JSXElements, needs to traverse later.
        } else if (child.type === "JSXSpreadChild") {
            children.push(b.spreadElement(child.expression));
        }
    })

    return { tag, attributes, children };
}

function transformAttributes(attrs: (namedTypes.ObjectProperty | namedTypes.SpreadElement)[]) {
    let staticAttributes: Record<string, any>[] = [];
    let dynamicAttributes: any[] = [];
    let spreadAtrributes: any[] = [];

    attrs.forEach(attr => {
        if (attr.type === "ObjectProperty") {
            const key = attr.key as namedTypes.StringLiteral;
            const value = attr.value;
            if (value.type === "StringLiteral" || value.type === "Literal" || value.type === "BooleanLiteral" || value.type === "NumericLiteral" || value.type === "NullLiteral") {
                staticAttributes.push({ key: key.value, value: value.value })
            } else {
                dynamicAttributes.push({ key: key.value, value });
            }
        }
    })

    return { staticAttributes, dynamicAttributes, spreadAtrributes };
}

function visitJSXElementRoot(path: NodePath<namedTypes.JSXElement>) {
    let node = path.node;
    tagNameInvariant(node.openingElement.name);
    let tag = node.openingElement.name.name;

    const attributes = collectAttributes(node.openingElement.attributes ?? []);
    const { staticAttributes, dynamicAttributes } = transformAttributes(attributes);
    console.log(staticAttributes, dynamicAttributes);

    let attributeAssignments = b.objectExpression(attributes);

    const children = node.children;
    let processedChildrenElems = new Map<number, any>();

    let processedChildren = (children!.map((child, index) => {
        if (child.type === "JSXElement") {
            let result = processChild(child);
            processedChildrenElems.set(index, result);
            return null;
        } else if (child.type === "JSXText") {
            // remove whitespace between two JSXElements that are used for formatting
            if (index == 0 && containsOnlyWhitespace(child.value)) {
                return null;
            }
            if (index == children!.length - 1 && containsOnlyWhitespace(child.value)) {
                return null;
            }
            if (typeof children![index - 1] !== "undefined" && children![index - 1].type === "JSXElement"
                && typeof children![index + 1] !== "undefined" && children![index + 1].type === "JSXElement") {
                if (containsOnlyWhitespace(child.value)) {
                    return null;
                }
            }
            return b.stringLiteral(cleanWhitespaceAfterLinebreaks(child.value));
        } else if (child.type === "JSXExpressionContainer") {
            return child.expression;    // These expression can still contain JSXElements, needs to traverse later.
        } else if (child.type === "JSXSpreadChild") {
            return b.spreadElement(child.expression);
        } else {
            return null;
        }
    }).filter(child => child !== null) ?? []) as (ExpressionKind | namedTypes.SpreadElement)[];

    this.traverse(path);
}

visit(e, {
    visitJSXElement(path) {
        visitJSXElementRoot.bind(this)(path);
    }
}
)

console.log(print(e).code);
