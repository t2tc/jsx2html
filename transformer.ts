import { parse, print, visit } from "recast";
import { builders as b } from "ast-types";

import { ExpressionKind, StatementKind, LiteralKind } from "ast-types/lib/gen/kinds";
import { namedTypes } from "ast-types/gen/namedTypes";
import { NodePath } from "ast-types/lib/node-path";

const VoidElements = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
];

const $id = b.identifier;
const $return = b.returnStatement;
const $call = b.callExpression;
const $this = b.thisExpression;

type AbstractJSX = {
    tag: string,
    namespace?: string,
    attributes?: Record<string, string>,
    children?: (AbstractJSX | string)[],
}

function loadConfig(config: Record<string, any>) {

}

namespace Generator {
    // declares a variable
    export const $let = (id: string) => b.variableDeclaration("let", [b.variableDeclarator($id(id))]);

    // initializes a variable
    export const $letInit = (id: string, init: ExpressionKind) => b.variableDeclaration("let", [b.variableDeclarator($id(id), init)]);

    // assigns a value to a variable
    export const $assign = (id: string, value: ExpressionKind) => b.expressionStatement(b.assignmentExpression("=", $id(id), value));

    // assigns a value to a variable only if it is null (or undefined)
    export const $assignIfNull = (id: string, value: ExpressionKind) => b.assignmentExpression("??=", $id(id), value);

    // calls something inside a immediately invoked function expression
    export const $iffe = (statements: StatementKind[]) => $call(b.arrowFunctionExpression([], b.blockStatement(statements)), []);

    export namespace Document {
        /// since the effect() call cannot return anything, the following JSX code `<div></div>` cannot be transformed to the following code:
        /// let el = document.createElement("div");
        /// but rather to:
        /// let el;
        /// effect(() => el = document.createElement("div"));

        /// as you might see below, every DOM call is all assign statements rather than variable declarations
        export const $createElement = (id: string, tag: string) => {
            return $assign(id, $call($id("document.createElement"), [b.stringLiteral(tag)]));
        }
        export const $createElementNS = (id: string, tag: string, namespace: string) => {
            return $assign(id, $call($id("document.createElementNS"), [b.stringLiteral(namespace), b.stringLiteral(tag)]));
        }
        export const $createSVGElement = (id: string, tag: string) => {
            return $createElementNS(id, tag, "http://www.w3.org/2000/svg");
        }
        export const $appendChildren = (parentId: string, childrenIds: string[]) => {
        }
    }

    export namespace Reactive {
        // simply calls something inside a function named 'effect', as vue has already implemented
        export const $effectWrapper = (effect: StatementKind[], effectName: string) => {
            return $call($id("effect"), [b.functionExpression($id(effectName), [], b.blockStatement(effect))]);
        }
    }

    export namespace Element {
        export const $setAttribute = (elementId: string, key: string, value: ExpressionKind) => {
            return b.expressionStatement($call(b.memberExpression($id(elementId), $id("setAttribute")), [b.stringLiteral(key), value]));
        }
        export const $appendChild = (parentId: string, childId: string) => {
            return b.expressionStatement($call(b.memberExpression($id(parentId), $id("appendChild")), [$id(childId)]));
        }
        export const $removeChild = (parentId: string, childId: string) => {
            return b.expressionStatement($call(b.memberExpression($id(parentId), $id("removeChild")), [$id(childId)]));
        }
        export const $insertBefore = (parentId: string, newChildId: string, refChildId: string) => {
            return b.expressionStatement($call(b.memberExpression($id(parentId), $id("insertBefore")), [$id(newChildId), $id(refChildId)]));
        }
        export const $removeAttribute = (elementId: string, key: string) => {
            return b.expressionStatement($call(b.memberExpression($id(elementId), $id("removeAttribute")), [b.stringLiteral(key)]));
        }

    }

}

import fs from "node:fs";

let f = fs.readFileSync("tests/deep.jsx", 'utf8');

let e = parse(f, { parser: require("recast/parsers/babel") });

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

function containsOnlyWhitespace(str: string): boolean {
    return str.trim() === "";
}

function cleanWhitespaceAfterLinebreaks(str: string): string {
    return str.replace(/\n\s+/g, " ");
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

function isComponentTagName(tagName: string) {
    return tagName[0] === tagName[0].toUpperCase(); // yes, this is currently the only way to distingush components from HTML elements
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

    let $createElement = (tag: string) => $call($id("document.createElement"), [b.stringLiteral(tag)]);

    let stmts: any[] = [
        Generator.$letInit("root", $createElement(tag)),
        Generator.$letInit("attrs", attributeAssignments),
        Generator.$letInit("children", b.arrayExpression(processedChildren)),

        $return($id("el")),
    ]

    let iffeDecl = Generator.$iffe(stmts);

    path.replace(iffeDecl);
    this.traverse(path);
}

visit(e, {
    visitJSXElement(path) {
        visitJSXElementRoot.bind(this)(path);
    }
}
)

console.log(print(e).code);

