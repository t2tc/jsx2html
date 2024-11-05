
import { visit } from "../third_parties/recast/main.ts";
import { namedTypes, builders as b } from "ast-types";

// tl: Managing empty JSXText can be tricky since whitespaces are involved in HTML and CSS.
// We use some not-so-complete methods to remove empty JSXText.
function removeEmptyJSXText(ast: any) {
    function stringContainsOnlyWhitespaceAndNewlines(str: string) {
        return /^[\s\n]*$/.test(str);
    }

    function trimHeadAndTailWhitespace(text: string) {
        return text.trim();
    }

    visit(ast, {
        visitJSXText(path) {
            const parent = path.parentPath.node as namedTypes.JSXElement;
            const index = parent.children!.indexOf(path.node);
            const value = path.node.value;

            if (index === 0 && stringContainsOnlyWhitespaceAndNewlines(value)) {
                path.replace();
                return false;
            }

            if (index === parent.children!.length - 1 && stringContainsOnlyWhitespaceAndNewlines(path.node.value)) {
                path.replace();
                return false;
            }

            if (stringContainsOnlyWhitespaceAndNewlines(value)) {
                path.replace(b.jsxText(" "));
            } else {
                path.replace(b.jsxText(trimHeadAndTailWhitespace(value)));
            }
            return false;
        }
    });
}

function preprocess(ast: any) {
    removeEmptyJSXText(ast);
}

export { preprocess };
