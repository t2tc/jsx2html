import { visit, print } from "./../third_parties/recast/main.ts";
import { builders as b, namedTypes } from "ast-types";
import { StatementKind } from "ast-types/gen/kinds";
import { NodePath } from "ast-types/lib/node-path";
import chalk from "chalk";
import { generateId } from "./utils.ts";

import { parseJSXAttributes } from "./attribute.ts";
import { getIdentifier, Identifier, processIdentifier } from "./identifier.ts";

import { $appendChild, $createElement, $createElementNS, $createTextNode, $iffe, $return, $setAttribute, $setInnerText } from "./builders.ts";
import { logTree } from "./tree.ts";
import { collectJSXElementRelationships, containsOnlyJSXText, mergeJSXTexts } from "./collect.ts";

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

function getCreateElementStatement(generatedId: string, id: Identifier) {
    if (id.namespace) {
        return $createElementNS(generatedId, id.name, id.namespace);
    } else {
        return $createElement(generatedId, id.name);
    }
}

function createAppendStatement(id: string, childrenMap: Map<string, string[]>) {
    const stmts: StatementKind[] = [];
    for (const child of childrenMap.get(id)!) {
        stmts.push(...$appendChild(id, child));
    }
    return stmts;
}

function convert(ast: any) {
    const { rootSet, nameMap, elementMap, pathMap, childrenMap } = collectJSXElementRelationships(ast);

    const statementsMap = new Map<string, StatementKind[]>();

    for (const root of rootSet) {
        console.log(chalk.red("root"), getIdentifier(elementMap.get(root)!.openingElement.name).name);
        visit(elementMap.get(root)!, {
            visitJSXElement(path) {
                //                if (nameMap.get(path.node) !== root && rootSet.has(nameMap.get(path.node)!)) {   // which is another root within, may be surround by other roots
                //                    return false;
                //                }
                const id = getIdentifier(path.node.openingElement.name);
                const generatedId = nameMap.get(path.node)!;

                const attributes = parseJSXAttributes(path.node.openingElement);

                let stmts: StatementKind[] = [];
                stmts.push(...getCreateElementStatement(generatedId, id));

                for (const attribute of attributes) {
                    stmts.push(...$setAttribute(generatedId, attribute));
                }

                if (path.node.children && path.node.children.length > 0) {
                    if (containsOnlyJSXText(path)) {
                        stmts.push(...$setInnerText(generatedId, mergeJSXTexts(path.node.children as namedTypes.JSXText[])));
                    }
                }

                stmts = stmts.flat();

                this.traverse(path);
                statementsMap.set(generatedId, stmts);
                path.replace(b.blockStatement(stmts));
            },
            visitJSXText(path) {
                console.log(chalk.green("JSXText"), path.node.value);
                const text = path.node.value;
                if (text.trim() === "") {
                    path.replace(b.emptyStatement());
                    return false;
                }
                const id = generateId("text");
                const block = $createTextNode(id, text);
                this.traverse(path);
                path.replace(b.blockStatement(block));
            }
        });
    }

    function combineBlockStatements(blocks: (namedTypes.BlockStatement | namedTypes.EmptyStatement)[]) {
        return blocks.flatMap(block => block.type === "BlockStatement" ? block.body : []);
    }

    visit(ast, {
        visitJSXElement(path) {
            const children = path.node.children as unknown[] as (namedTypes.BlockStatement | namedTypes.EmptyStatement)[];
            const processedChildren = combineBlockStatements(children);

            const statements = statementsMap.get(nameMap.get(path.node)!)!;

            const returnStmt = $return(nameMap.get(path.node)!);

            statements.push(...processedChildren);
            statements.push(...createAppendStatement(nameMap.get(path.node)!, childrenMap));
            statements.push(...returnStmt);

            const block = $iffe(statements);

            console.log(chalk.bgRedBright("PROCESS ROOT"));
            console.log(chalk.cyan("block"), print(block).code);
            console.log(chalk.cyan("statements"), print(b.blockStatement(statements)).code);

            this.traverse(path);
            path.replace(block);
        }
    });

    console.log(ast.program.body[0]);
}

export { convert, convertJSXFragment };
