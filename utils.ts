import { parse } from "./third_parties/recast/main.ts";
import chalk from "chalk";
import { StatementKind } from "ast-types/lib/gen/kinds";

// All parsing should be using babel parser, which supports jsx better.
function parseCode(code: string) {
    return parse(code, { parser: require("recast/parsers/babel") });
}

function containsOnlyWhitespace(str: string): boolean {
    return str.trim() === "";
}

function cleanWhitespaceAfterLinebreaks(str: string): string {
    return str.replace(/\n\s+/g, " ");
}

function parseStatements(statements: string) {
    let body: StatementKind[] = [];
    try {
        body = parseCode(statements).program.body;
    } catch (e) {
        console.error(chalk.red("Error[parseStatements]:"), chalk.green("statements:"), statements);
        throw e;
    }
    if ("DEBUG" in globalThis && globalThis.DEBUG) {
        console.log(chalk.red("DEBUG[parseStatements]:"), chalk.green("statements:"), `[${body.map((stmt) => stmt.type).join(", ")}]`);
    }
    return body;
}

function makeASTTemplate<T extends (...args: any[]) => string>(templateFunction: T) {
    return (...args: Parameters<T>) => {
        if ("DEBUG" in globalThis && globalThis.DEBUG) {
            console.log(chalk.red("DEBUG[makeASTTemplate]:"), chalk.green("templateGenerated:"), templateFunction(...args));
        }
        const statements = templateFunction(...args);
        return parseStatements(statements);
    };
}

function formalizeName(name: string) {
    return name.replace(/-/g, "_").replace(/\./g, "_");
}

const counter = new Map<string, number>();

function generateId(name: string) {
    name = formalizeName(name);
    if (!counter.has(name)) {
        counter.set(name, 0);
    }
    counter.set(name, counter.get(name)! + 1);
    return `${name}${counter.get(name)}`;
}

export { parseCode,
    containsOnlyWhitespace,
    cleanWhitespaceAfterLinebreaks,
    parseStatements,
    makeASTTemplate,
    generateId
};
