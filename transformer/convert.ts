import { visit, print, parse } from "./../third_parties/recast/main.ts";
import { Type, builders as b, builtInTypes, finalize } from "ast-types";
import { namedTypes } from "ast-types";
import { StatementKind } from "ast-types/gen/kinds";

import chalk from "chalk";
import { generateId, makeASTTemplate } from "../utils.ts";
import { BlockStatement } from "estree-jsx";

import { AttributeParsedResult, parseJSXAttributes } from "./attribute.ts";
import { getIdentifier } from "./identifier.ts";

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

function processIdentifier(identifier: Identifier) {
    if (identifier.namespace) {
        if (identifier.namespace === "svg") {
            identifier.namespace = "http://www.w3.org/2000/svg";
        }
    }
    return identifier;
}

function processAttributes(attributes: any[]) {

}

function processCreateElement(name: string, tag: string) {

}

function processJSXRoot() {

}

function processJSXChildren() {

}

type Identifier = {
    namespace: string | null;
    name: string;
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

function getChildren(children: any[]) {
    return children.map(child => {
        if (child.type === "JSXText") {
            return child.value;
        }
    });
}

function combineBlockStatements(blocks: BlockStatement[]) {
    return blocks.flatMap(block => block.body);
}

function convert(code: string, ast: any) {

    const $createElement = makeASTTemplate((name: string, tag: string) =>
        `let ${name} = document.createElement("${tag}");\n`);
    
    const $createElementNS = makeASTTemplate((name: string, tag: string, namespace: string) =>
        `let ${name} = document.createElementNS("${namespace}", "${tag}");\n`);

    const $setAttribute = makeASTTemplate((name: string, attribute: string, value: AttributeParsedResult) => {
        // console.log(chalk.green("value"), value);
        const valueString = value.type === "AttributeString" ? `"${value.value}"` : value.value;
        return `${name}.setAttribute("${attribute}", ${valueString});\n`;
    });
    
    const $createTextNode = makeASTTemplate((name: string, value: string) =>
        `let ${name} = document.createTextNode(\`${value}\`);\n`);

    const roots = getJSXRoots(ast);

    for (const root of roots) {
        console.log(chalk.red("root"), getIdentifier(root.openingElement.name).name);
        visit(root, {
            visitJSXElement(path) {
                if (path.node !== root && roots.has(path.node)) {
                    return false;
                }

                const id = processIdentifier(getIdentifier(path.node.openingElement.name));
                const generatedId = generateId(id.name);
                const attributes = parseJSXAttributes(path.node.openingElement);

                let declaration: StatementKind[] = [];
                if (id.namespace) {
                    declaration.push(...$createElementNS(generatedId, id.name, id.namespace));
                } else {
                    declaration.push(...$createElement(generatedId, id.name));
                }
                //                console.log(chalk.green("declaration"), print(declaration).code);

                for (const attribute of attributes) {
                    declaration.push(...$setAttribute(generatedId, attribute.name, attribute.value));
                }

                declaration = declaration.flat();

                this.traverse(path);

                if (declaration.length > 0) {
                    const block = b.blockStatement(declaration);
                    console.log(chalk.green("declaration"), print(block).code);
                    path.replace(block);
                }
            },

            visitJSXText(path) {
                console.log(chalk.yellow("text"), path.node.value);
                const text = path.node.value;
                const id = generateId("text");
                const block = $createTextNode(id, text);
                console.log(text, id, block);
                //  console.log(chalk.green("block"), print(block).code);
                //path.replace(block);
                this.traverse(path);
            }
        });
        console.log(chalk.red("root"), print(root).code);
    }

}

export { convert, convertJSXFragment };
