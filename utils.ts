import { parse } from "@babel/parser";

function containsOnlyWhitespace(str: string): boolean {
    return str.trim() === "";
}

function cleanWhitespaceAfterLinebreaks(str: string): string {
    return str.replace(/\n\s+/g, " ");
}

function parseStatements(statements: string) {
    return parse(statements).program.body;
}

function makeASTTemplate<T extends (...args: any[]) => string>(templateFunction: T) {
    return (...args: Parameters<T>) => parseStatements(templateFunction(...args));
}

function formalizeName(name: string) {
    return name.replace(/-/g, "_");
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

export { containsOnlyWhitespace, cleanWhitespaceAfterLinebreaks, parseStatements, makeASTTemplate, generateId };
