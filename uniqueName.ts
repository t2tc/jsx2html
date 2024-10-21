import { JSXElement } from "estree-jsx";
import fs from "node:fs";

function loadSource(src: string) {
    let source = fs.readFileSync(src, 'utf8');
    return source;
}

const src = loadSource("tests/index-1.jsx");

let uniqueNameMap = new Map<string, number>();
function getUniqueName(tag: string) {
    if (uniqueNameMap.has(tag)) {
        let count = uniqueNameMap.get(tag)!;
        uniqueNameMap.set(tag, count + 1);
        return `${tag}#${count}`;
    } else {
        uniqueNameMap.set(tag, 2);
        return `${tag}#1`;
    }
}

// jsxElementMap gives every JSXElement a unique name like "div#1", "div#2", etc.
const jsxElementMap = new Map<string /* uniqueName */, JSXElement & { uniqueName: string }>();

const collectedJSXElements = new Set<string>();
// collectedJSXRoots is used to collect JSXElements that are root elements.
// a root is an element that is not a child of another JSXElement, nor an element inside a JSXExpressionContainer
// (that is, a bracketed expression like `<div>{<div></div>}</div>`).