import chalk from "chalk";
import { makeASTTemplate } from "../utils";
import { AttributeParsedResult } from "./attribute";

const $createElement = makeASTTemplate((name: string, tag: string) =>
    `let ${name} = document.createElement("${tag}");\n`);

const $createElementNS = makeASTTemplate((name: string, tag: string, namespace: string) =>
    `let ${name} = document.createElementNS("${namespace}", "${tag}");\n`);

const $setAttribute = makeASTTemplate((name: string, attribute: AttributeParsedResult) => {
    console.log(chalk.green("value"), attribute);
    if (attribute.type === "SpreadAttribute") {
        return `setSpreadAttributes(${name}, ${attribute.value});\n`;
    } else {
        const valueString = attribute.type === "AttributeString" ? `"${attribute.value}"` : attribute.value;
        return `${name}.setAttribute("${attribute.name}", ${valueString});\n`;
    }
});

const $createTextNode = makeASTTemplate((name: string, value: string) =>
    `let ${name} = document.createTextNode(\`${value}\`);\n`);

export { $createElement, $createElementNS, $setAttribute, $createTextNode };
