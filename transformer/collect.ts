import { NodePath } from "ast-types/lib/node-path";
import { namedTypes, builders as b } from "ast-types";
import chalk from "chalk";
import { visit } from "../third_parties/recast/main.ts";

import { generateId } from "./utils.ts";
import { getIdentifier } from "./identifier.ts";
import { AttributeParsedResult, parseJSXAttributes } from "./attribute.ts";

type StaticContentNode = {
    id: string;
    attributes: Record<string, string>;
    children: (StaticContentNode | string)[];
    dynamicMarker: string;
}

function traverseParent(path: NodePath<namedTypes.JSXElement>, nameMap: Map<namedTypes.JSXElement | namedTypes.JSXText, string>) {
    function traverseParentInternal(path: NodePath<namedTypes.JSXElement>, parents: string[]) {
        if (path.parentPath.node.type !== "JSXElement") {
            return parents;
        } else {
            const parentId = nameMap.get(path.parentPath.node)!;
            return traverseParentInternal(path.parent, [parentId, ...parents]);
        }
    }

    return traverseParentInternal(path, []);
}

// 第一次遍历，获取所有 JSXElement 节点，并记录其路径。其中，不属于任何其他 JSXElement 的节即为根节点。
// 也就是说，形如 <A><B>{<C></C></B></A> 中，<A> 和 <C> 都是根节点。
// 现阶段的实现中，根节点将被翻译成 iffe 语句，而子节点只会被添加到其父节点的 children 中。
// 这一个过程也会为每个 JSXElement 命名。
function collect(ast: any) {

    const rootSet = new Set<string>();
    // A set that marks the JSXElement that contains only JSXText.
    const textOnlyJSXElementSet = new Set<string>();
    // A set that marks the JSXElement that contains only static content.
    const staticSet = new Set<string>();

    // A bidirectional map between JSXElement and its name.
    // 因为 JSXElement 在整个生命周期并不会被频繁创建和销毁，所以不考虑 GC。
    // And, since we'll just be storing these small strings, it's fine to use a Map.
    const nameMap = new Map<namedTypes.JSXElement | namedTypes.JSXText, string>();
    const elementMap = new Map<string, namedTypes.JSXElement | namedTypes.JSXText>();

    // A tree that records the parent-child relationship of JSXElement.
    // The key is the id of the element, and the value is an array of its parents' ids, ordered from the root to itself.
    const pathMap = new Map<string, string[]>();

    // A map that records the children of each JSXElement and JSXText.
    // This map takes only the direct children (to appendChild)
    const childrenMap = new Map<string, string[]>();

    // A map that records the attributes of each JSXElement.
    const attributeMap = new Map<string, AttributeParsedResult[]>();

    visit(ast, {
        visitJSXElement(path) {
            const id = getIdentifier(path.node.openingElement.name);
            // 为每个 JSXElement 命名。id 被实现为一种非常简单的累加模式，即它的 tagName + 数字。
            // 如果 namespace 存在，则 namespace 也会被包含在 id 中。
            // The counter will not reset itself during the whole process.
            const generatedId = generateId(id.name);

            const attributes = parseJSXAttributes(path.node.openingElement);
            attributeMap.set(generatedId, attributes);

            nameMap.set(path.node, generatedId);
            elementMap.set(generatedId, path.node);

            if (path.parentPath.node.type !== "JSXElement") {
                rootSet.add(generatedId);
            } else {
                const parentId = nameMap.get(path.parentPath.node)!;
                pathMap.set(generatedId, traverseParent(path, nameMap));

                // Add this element to its parent's children
                if (!childrenMap.has(parentId)) {
                    childrenMap.set(parentId, []);
                }
                childrenMap.get(parentId)!.push(generatedId);
            }

            if (path.node.children && path.node.children.length > 0) {
                if (containsOnlyJSXText(path)) {
                    textOnlyJSXElementSet.add(generatedId);
                }
            }

            this.traverse(path);
        },
        visitJSXText(path) {
            const id = generateId("_text");
            const parentId = nameMap.get(path.parentPath.node)!;

            nameMap.set(path.node, id);
            elementMap.set(id, path.node);

            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }
            childrenMap.get(parentId)!.push(id);
            this.traverse(path);
        }
    });

    console.log(chalk.bgYellow("childrenMap"));
    //    console.log(childrenMap);

    console.log(chalk.bgYellow("elementMap"));
    console.log(elementMap);

    console.log(chalk.bgYellow("pathMap"));
    //    console.log(pathMap);

    return { rootSet, nameMap, elementMap, pathMap, childrenMap, textOnlyJSXElementSet, attributeMap };
}

function containsOnlyJSXText(node: NodePath<namedTypes.JSXElement>) {
    return node.node.children?.every(child => child.type === "JSXText") ?? false;
}

function mergeJSXTexts(texts: namedTypes.JSXText[]) {
    return texts.map(text => text.value).join("");
}

export { collect as collectJSXElementRelationships, containsOnlyJSXText, mergeJSXTexts };
