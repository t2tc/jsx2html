import { visit, print } from "./../third_parties/recast/main.ts";
import { builders as b, namedTypes } from "ast-types";
import { StatementKind } from "ast-types/gen/kinds";

import { parseJSXAttributes } from "./attribute.ts";
import { getIdentifier, Identifier } from "./identifier.ts";

import { $appendChild, $createElement, $createElementNS, $iffe, $return, $setAttribute, $setInnerText } from "./builders.ts";

import { collectJSXElementRelationships, mergeJSXTexts } from "./collect.ts";
import { debugOutput } from "./utils/debugOutput.ts";

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

const createAppendStatement = debugOutput(function createAppendStatement(id: string, childrenMap: Map<string, string[]>) {
    const stmts: StatementKind[] = [];

    if (!childrenMap.has(id)) {
        return [];
    }
    for (const child of childrenMap.get(id)!) {
        stmts.push(...$appendChild(id, child));
    }
    return stmts;
});

function convert(ast: any) {
    const { rootSet, nameMap, elementMap, childrenMap, textOnlyJSXElementSet, attributeMap } = collectJSXElementRelationships(ast);

    const statementsMap = new Map<string, StatementKind[]>();

    for (const root of rootSet) {
        visit(elementMap.get(root)!, {
            visitJSXElement(path) {
                //                if (nameMap.get(path.node) !== root && rootSet.has(nameMap.get(path.node)!)) {   // which is another root within, may be surround by other roots
                //                    return false;
                //                }
                const id = getIdentifier(path.node.openingElement.name);
                const generatedId = nameMap.get(path.node)!;

                const attributes = attributeMap.get(generatedId)!;

                let stmts: StatementKind[] = [];
                stmts.push(...getCreateElementStatement(generatedId, id));

                for (const attribute of attributes) {
                    stmts.push(...$setAttribute(generatedId, attribute));
                }

                if (textOnlyJSXElementSet.has(generatedId)) {
                    stmts.push(...$setInnerText(generatedId, mergeJSXTexts(path.node.children as namedTypes.JSXText[])));
                }

                stmts = stmts.flat();

                this.traverse(path);

                statementsMap.set(generatedId, stmts);

                path.replace(b.blockStatement(stmts));
            },
            visitJSXText(path) {
                const text = path.node.value;
                const id = nameMap.get(path.node)!;
//                if (!jsxElementPureTextSet.has(id)) {
//                    const block = b.blockStatement($createTextNode(id, text));
//                    console.log(chalk.bgYellow("JSXText"), print(block).code);
//                }
                this.traverse(path);
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

            this.traverse(path);
            path.replace(block);
        }
    });
}

export { convert, convertJSXFragment };
