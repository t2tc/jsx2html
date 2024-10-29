import { namedTypes } from "ast-types";
import chalk from "chalk";
import { print } from "../third_parties/recast/main.ts";
import { getIdentifier } from "./identifier.ts";

type AttributeParsedResult = {
    type: "AttributeString" | "Code";
    name: string;
    value: string;
} | {
    type: "SpreadAttribute";
    value: string;
}

function getJSXExpressionContainerValueForAttribute(node: namedTypes.JSXExpressionContainer): Omit<AttributeParsedResult, "name"> {
    console.log(chalk.blue("expression type"), node.expression.type);

    if (node.expression.type === "JSXEmptyExpression") {
        throw new Error("JSX attributes must only be assigned a non-empty expression.");
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

        console.log(chalk.yellow("value"), String(node.expression.value));
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

function parseJSXAttributes(node: namedTypes.JSXElement["openingElement"]) {
    if (!node.attributes) {
        return [];
    }
    return node.attributes.map(attr => {
        if (attr.type === "JSXSpreadAttribute") {
            return parseJSXSpreadAttribute(attr);
        }
        return parseJSXAttribute(attr);
    });
}

function parseJSXSpreadAttribute(node: namedTypes.JSXSpreadAttribute): AttributeParsedResult {
    const shallSpread = print(node.argument).code;
    return {
        type: "SpreadAttribute",
        value: shallSpread
    }
}

// JSX Attributes can be either a string or a code block.
// String attributes will be simply handled here.
// Code blocks wrapped in curly braces will be handled in `extractJSXExpressionContainerValue`.
// There are still some cases that is valid for babel parser, but not for editors like vscode (see `node.value.type`).
// These cases will be ignored.
function parseJSXAttribute(node: namedTypes.JSXAttribute): AttributeParsedResult {
    console.log(chalk.red("node"), print(node).code);
    console.log(chalk.green("node.name"), print(node.name).code);
    const name = getIdentifier(node.name);
    if (!node.value) {  // should be treated as a boolean.
        return {
            name: name.name,
            type: "AttributeString",
            value: "true"
        }
    }

    switch (node.value.type) {
        case "JSXExpressionContainer":
            return {
                name: name.name,
                ...getJSXExpressionContainerValueForAttribute(node.value)
            }
        case "StringLiteral":
            return {
                name: name.name,
                type: "AttributeString",
                value: node.value.value
            }
        default:
            throw new Error(`Unsupported attribute value type: ${node.value.type}. This might need to be surrounded by curly braces.`);
    }
}

export { parseJSXAttributes, parseJSXAttribute, type AttributeParsedResult };
