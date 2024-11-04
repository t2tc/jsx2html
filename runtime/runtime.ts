
const svgNs = "http://www.w3.org/2000/svg";

const templateCache = new Map<string, Node>();
/**
 * Create a DOM node from a template string.
 * @param s - The template string.
 */
function tmpl(s: string) {
    if (templateCache.has(s)) {
        return document.importNode(templateCache.get(s)!, true);
    }
    const t = document.createElement("template");
    t.innerHTML = s;
    templateCache.set(s, t);
    const node = document.importNode(t.content, true);
    return node;
}

/**
 * Get the nth child of e. If n is an array, get the children of children of e at certain indices.
 * @param e - The element.
 * @param n - The index or array of indices.
 */
function c(e: Element, n: number | number[]): (Element | Text) {
    if (typeof n === "number") {
        return e.children[n];
    }
    // Handle array of indices by traversing down the children tree
    return n.reduce((elem, index) => (elem as Element).children[index], e);
}

/**
 * Set an attribute on an element.
 * @param e - The element.
 * @param a - The attribute name.
 * @param v - The attribute value.
 * @param ns - The namespace.
 */
function sA(e: Element, a: string, v: string, ns?: string) {
    if (ns) {
        if (ns == "svg") {
            e.setAttributeNS(svgNs, a, v);
        } else {
            e.setAttributeNS(ns, a, v);
        }
    } else {
        e.setAttribute(a, v);
    }
}

/**
 * Create a text node.
 * @param v - The text content.
 */
function cT(v: string) {
    return document.createTextNode(v);
}

/**
 * Set the text content of an element.
 * @param e - The element.
 * @param v - The text content.
 */
function sT(e: Element, v: string) {
    e.textContent = v;
}

export { c as __c, sA as __sA, cT as __cT, sT as __sT, tmpl as __tmpl };