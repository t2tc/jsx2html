import { namedTypes } from "ast-types";
import { AttributeParsedResult } from "./attribute.ts";
import { print } from "../third_parties/recast/main.ts";

function getJSXExpressionContainerValue(node: namedTypes.JSXExpressionContainer, containerType: "attribute" | "children"): Omit<AttributeParsedResult, "name"> {
    if (containerType === "children") {
        if (node.expression.type === "JSXEmptyExpression") {
            throw new Error("JSX children must only be assigned a non-empty expression.");
        }
    }

    if (node.expression.type === "RegExpLiteral") {
        // TODO: handle regex. this is now a workaround.
        return {
            type: "Code",
            value: node.expression.extra!.raw
        }
    }

    if (node.expression.type === "NullLiteral") {
        return {
            type: "Code",
            value: "null"
        }
    }

    if (node.expression.type === "Literal" ||
        node.expression.type === "StringLiteral" ||
        node.expression.type === "BooleanLiteral" ||
        node.expression.type === "NumericLiteral"
    ) {

        return {
            type: "AttributeString",
            value: String(node.expression.value)
        };
    }

    return {
        type: "Code",
        value: print(node.expression).code
    };
}

export { getJSXExpressionContainerValue };
