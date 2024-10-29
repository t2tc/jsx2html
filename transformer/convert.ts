import { visit, print } from "./../third_parties/recast/main.ts";
import { builders as b, namedTypes } from "ast-types";
import { StatementKind } from "ast-types/gen/kinds";
import { NodePath } from "ast-types/lib/node-path";
import chalk from "chalk";
import { generateId } from "./utils.ts";

import { parseJSXAttributes } from "./attribute.ts";
import { getIdentifier, processIdentifier } from "./identifier.ts";

import { $createElement, $createElementNS, $createTextNode, $iffe, $setAttribute } from "./builders.ts";
import { logTree } from "./tree.ts";

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

function processAttributes(attributes: any[]) {

}

function processCreateElement(name: string, tag: string) {

}

function processJSXRoot() {

}

function processJSXChildren() {

}

// 第一次遍历，获取所有 JSXElement 节点，并记录其路径。其中，不属于任何其他 JSXElement 的节点即为根节点。
// 也就是说，形如 <A><B>{<C></C></B></A> 中，<A> 和 <C> 都是根节点。
// 现阶段的实现中，根节点将被翻译成 iffe 语句，而子节点只会被添加到其父节点的 children 中。
// 这一个过程也会为每个 JSXElement 命名。
function getJSXRoots(ast: any) {
    const rootSet = new Set<string>();

    // A bidirectional map between JSXElement and its name.
    // 因为 JSXElement 在整个生命周期并不会被频繁创建和销毁，所以不考虑 GC。
    const nameMap = new Map<namedTypes.JSXElement, string>();
    const elementMap = new Map<string, namedTypes.JSXElement>();

    // A tree that records the parent-child relationship of JSXElement.
    // The key is the id of the element, and the value is an array of its parents' ids, ordered from the root to itself.
    const pathMap = new Map<string, string[]>();

    visit(ast, {
        visitJSXElement(path) {
            const id = getIdentifier(path.node.openingElement.name);
            // 为每个 JSXElement 命名。id 被实现为一种非常简单的累加模式，即它的 tagName + 数字。
            // 如果 namespace 存在，则 namespace 也会被包含在 id 中。
            // The counter will not reset itself during the whole process.
            const generatedId = generateId(id.name);

            nameMap.set(path.node, generatedId);
            elementMap.set(generatedId, path.node);

            if (path.parentPath.node.type !== "JSXElement") {
                rootSet.add(generatedId); 
            } else {
//               traverseParent(path, [generatedId]);
            }
            this.traverse(path);
        },
    });

//    console.log(pathMap);

    return { rootSet, nameMap, elementMap };
}


function combineBlockStatements(blocks: (namedTypes.BlockStatement | namedTypes.EmptyStatement)[]) {
    return b.blockStatement(blocks.flatMap(block => block.type === "BlockStatement" ? block.body : []));
}

function convert(code: string, ast: any) {
    const { rootSet, nameMap, elementMap } = getJSXRoots(ast);

    for (const root of rootSet) {
        console.log(chalk.red("root"), getIdentifier(elementMap.get(root)!.openingElement.name).name);
        visit(elementMap.get(root)!, {
            visitJSXElement(path) {
                if (nameMap.get(path.node) !== root && rootSet.has(nameMap.get(path.node)!)) {   // which is another root within, may be surround by other roots
                    return false;
                }
                const id = getIdentifier(path.node.openingElement.name);
                const generatedId = nameMap.get(path.node)!;

                const attributes = parseJSXAttributes(path.node.openingElement);

                let declaration: StatementKind[] = [];
                if (id.namespace) {
                    declaration.push(...$createElementNS(generatedId, id.name, id.namespace));
                } else {
                    declaration.push(...$createElement(generatedId, id.name));
                }

                for (const attribute of attributes) {
                    declaration.push(...$setAttribute(generatedId, attribute));
                }

                declaration = declaration.flat();

                this.traverse(path);

                const block = b.blockStatement(declaration);
                path.replace(block);
            },
            visitJSXText(path) {
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

    for (const root of rootSet) {
        visit(elementMap.get(root)!, {
            visitJSXElement(path) {
                const identifier = getIdentifier(path.node.openingElement.name);
                const children = path.node.children as unknown[] as (namedTypes.BlockStatement | namedTypes.EmptyStatement)[];
                const processedChildren = combineBlockStatements(children);

                console.log(chalk.cyan("processedChildren"), print(processedChildren).code);

                this.traverse(path);
                path.scope
            }
        });
    }
}

export { convert, convertJSXFragment };
