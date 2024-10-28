import { namedTypes } from "ast-types";
import chalk from "chalk";
import { print } from "../third_parties/recast/main.ts";
import { getIdentifier } from "./identifier.ts";

type AttributeParsedResult = {
    type: "AttributeString" | "Code";
    value: string;
}

function extractJSXExpressionContainerValue(node: namedTypes.JSXExpressionContainer): AttributeParsedResult {
    console.log(chalk.blue("expression type"), node.expression.type);
    if (node.expression.type === "JSXEmptyExpression") {
        throw new Error("JSX attributes must only be assigned a non-empty expression.");
    }
    if (node.expression.type === "Literal" ||
        node.expression.type === "StringLiteral" ||
        node.expression.type === "BooleanLiteral" ||
        node.expression.type === "NumericLiteral" ||
        node.expression.type === "NullLiteral" ||
        node.expression.type === "RegExpLiteral"
    ) {
        console.log(chalk.yellow("value"), String(node.expression.value));
        return {
            type: "AttributeString",
            value: String(node.expression.value)
        };
    }
    console.log(chalk.red("expression"), print(node.expression).code);
    return {
        type: "Code",
        value: print(node.expression).code
    };
}

function parseJSXAttributes(node: namedTypes.JSXElement["openingElement"]) {
    if (!node.attributes) {
        return [];
    }
    if (node.attributes.some(attr => attr.type === "JSXSpreadAttribute")) {
        return [];
        // TODO: handle spread attributes
        const spreadAttributes = node.attributes.filter(attr => attr.type === "JSXSpreadAttribute");
        const attributes = node.attributes.filter(attr => attr.type !== "JSXSpreadAttribute");
        console.log(chalk.red("spreadAttributes"), spreadAttributes);
        console.log(chalk.red("attributes"), attributes);
        return attributes.map(parseJSXAttribute);
    }
    // @ts-ignore
    return node.attributes.map(parseJSXAttribute);
}

// JSX Attributes can be either a string or a code block.
// String attributes will be simply handled here.
// Code blocks wrapped in curly braces will be handled in `extractJSXExpressionContainerValue`.
// There are still some cases that is valid for babel parser, but not for editors like vscode (see `node.value.type`).
// These cases will be ignored.
function parseJSXAttribute(node: namedTypes.JSXAttribute): { name: string, value: AttributeParsedResult } {
    console.log(chalk.red("node"), print(node).code);
    console.log(chalk.green("node.name"), print(node.name).code);
    const name = getIdentifier(node.name);
    if (!node.value) {  // should be treated as a boolean.
        return {
            name: name.name,
            value: {
                type: "AttributeString",
                value: "true"
            }
        }
    }
    
    switch (node.value.type) {
        case "JSXExpressionContainer":
            return {
                name: name.name,
                value: extractJSXExpressionContainerValue(node.value)
            }
        case "StringLiteral":
            return {
                name: name.name,
                value: {
                    type: "AttributeString",
                    value: node.value.value
                }
            }
        default:
            throw new Error(`Unsupported attribute value type: ${node.value.type}. This might need to be surrounded by curly braces.`);
    }
}

export { parseJSXAttributes, parseJSXAttribute, type AttributeParsedResult };
