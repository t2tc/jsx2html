import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parse, print, visit } from "./third_parties/recast/main.ts";
import { convert, convertJSXFragment } from "./transformer/convert";

function openWithEditor(fileName: string) {
    let editor = "cursor";
    let command = `${editor} ${fileName}`;
    execSync(command);
}

function parseCode(code: string) {
    return parse(code, { parser: require("recast/parsers/babel") });
}

function main() {
    let fileName = process.argv[2];
    console.log('fileName', fileName);
    if (!fileName) {
        fileName = "tests/deep.jsx";
    }
    if (!fileName.endsWith(".jsx")) {
        fileName += ".jsx";
    }
    const filePath = path.join(__dirname, "tests", fileName);
    const code = fs.readFileSync(filePath, "utf8");
    const ast = parseCode(code);
    convertJSXFragment(code, ast);
    convert(code, ast);
    console.log(print(ast).code);
}

main();
