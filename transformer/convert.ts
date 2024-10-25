import { visit, print, parse } from "./../third_parties/recast/main.ts";
import { Type, builders as b, builtInTypes, finalize } from "ast-types";
import { namedTypes } from "ast-types";
import { StatementKind } from "ast-types/gen/kinds";

import chalk from "chalk";
import { generateId, makeASTTemplate } from "../utils.ts";

function convertJSXFragment(code: string, ast: any) {
    if (code.includes("<>")) /* source code contains JSX fragment */ {
        visit(ast, {
            visitJSXFragment(path) {
                path.replace(b.jsxElement(b.jsxOpeningElement(b.jsxIdentifier("fragment"), []), b.jsxClosingElement(b.jsxIdentifier("fragment")), path.node.children));
                this.traverse(path);
            }
        })
    }
}

function processJSXRoot() {

}

function processJSXChildren() {

}

type IdentifierType = {
    namespace: string | null;
    name: string;
}

function getIdentifier(node: namedTypes.JSXIdentifier | namedTypes.JSXMemberExpression | namedTypes.JSXNamespacedName): IdentifierType {
    if (node.type === "JSXIdentifier") {
        return {
            namespace: null,
            name: node.name
        };
    } else if (node.type === "JSXNamespacedName") {
        return {
            namespace: node.namespace.name,
            name: node.name.name
        };
    } else if (node.type === "JSXMemberExpression") {
        return {
            namespace: null,
            name: print(node).code
        };
    }
    throw new Error("Invalid identifier type");
}

function getAttributes(node: namedTypes.JSXElement["openingElement"]) {
    if (!node.attributes) {
        return [];
    }
    if (node.attributes.some(attr => attr.type === "JSXSpreadAttribute")) {
        // TODO: handle spread attributes
        return [];
    }
    // @ts-ignore
    return node.attributes.map(getFromJSXAttribute);
}

function getFromJSXAttribute(node: namedTypes.JSXAttribute) {
    //    console.log(`node.value.type: ${node.value?.type}`);
    if (node.value?.type === "JSXExpressionContainer") {
        return {
            name: node.name.name,
            value: getValueFromJSXExpressionContainer(node.value)
        }
    }
    if (node.value?.type === "StringLiteral") {
        return {
            name: node.name.name,
            value: node.value.value
        }
    }
    return {
        name: node.name.name,
        value: String(node.value)
    }
}

function getValueFromJSXExpressionContainer(node: namedTypes.JSXExpressionContainer) {
    //  console.log(chalk.blue("expression type"), node.expression.type);
    if (node.expression.type === "JSXEmptyExpression") {
        throw new Error("JSX attributes must only be assigned a non-empty expression.");
    }
    if (node.expression.type === "Literal" ||
        node.expression.type === "StringLiteral" ||
        node.expression.type === "BooleanLiteral" ||
        node.expression.type === "NumericLiteral"
    ) {
        console.log(chalk.yellow("value"), String(node.expression.value));
        return String(node.expression.value);
    }
    return print(node.expression).code;
}

function iffe(statements: StatementKind[]) {
    return b.callExpression(b.arrowFunctionExpression([], b.blockStatement(statements)), []);
}

function getJSXRoots(ast: any) {
    const set = new Set<namedTypes.JSXElement>();

    visit(ast, {
        visitJSXElement(path) {
            if (path.parentPath.node.type == "JSXElement") {
                return false;
            } else {
                set.add(path.node);
            }
            this.traverse(path);
        },
    });

    return set;
}

const counter = new Map<string, number>();

function getChildren(children: any[]) {
    return children.map(child => {
        if (child.type === "JSXText") {
            return child.value;
        }
    });
}

function convert(code: string, ast: any) {

    const $createElement = makeASTTemplate((name: string, tag: string) =>
        `let ${name} = document.createElement("${tag}");\n`);
    const $setAttribute = makeASTTemplate((name: string, attribute: string, value: string) =>
        `${name}.setAttribute("${attribute}", "${value}");\n`);

    const roots = getJSXRoots(ast);

    for (const root of roots) {
        console.log(chalk.red("root"), getIdentifier(root.openingElement.name).name);
        visit(root, {
            visitJSXElement(path) {
                if (path.node !== root && roots.has(path.node)) {
                    return false;
                }

                const id = getIdentifier(path.node.openingElement.name);
                const attributes = getAttributes(path.node.openingElement);
                const children = getChildren(path.node.children || []);

                let declaration: StatementKind[] = [];
                declaration.push(...$createElement(generateId(id.name), id.name));
                //                console.log(chalk.green("declaration"), print(declaration).code);

                for (const attribute of attributes) {
                    declaration.push(...$setAttribute(generateId(id.name), attribute.name, attribute.value));
                }

                declaration = declaration.flat();

                this.traverse(path);

                if (declaration.length > 0) {
                    const block = b.blockStatement(declaration);
                    console.log(chalk.green("declaration"), print(block).code);
                    path.replace(block);
                }

            },
        });
        console.log(chalk.red("root"), print(root).code);
    }

}

export { convert, convertJSXFragment };
