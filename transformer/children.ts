import { namedTypes } from "ast-types";

function getJSXExpressionContainerValueForChild(node: namedTypes.JSXExpressionContainer) {
    if (node.expression.type === "JSXEmptyExpression") {
        return null;
    }
    return node.expression;
}

function processChildren(children: any[]) {
    return children.map(child => processChild(child));
}

function processChild(child: any) {

}

function processAppendChild() {

}

export { processChildren };
