import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parse, print } from "./third_parties/recast/main.ts";
import { convert, convertJSXFragment } from "./transformer/convert";
import { parseCode } from "./utils.ts";

globalThis.DEBUG = true;
    
function openWithEditor(fileName: string) {
    let editor = "cursor";
    let command = `${editor} ${fileName}`;
    execSync(command);
}

function main() {
    let fileName = process.argv[2];
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
