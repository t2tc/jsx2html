import fs from "node:fs";
import path from "node:path";

import { print } from "./third_parties/recast/main.ts";
import { convert, convertJSXFragment } from "./transformer/convert";
import { parseCode } from "./transformer/utils";
import debugOutput from "./transformer/utils/debugOutput.ts";

// globalThis.DEBUG = true;

function writeFile(filePath: string, code: string) {
    fs.writeFileSync(filePath, code, "utf8");
}

function convertFileName(fileName: string) {
    if (fileName.endsWith(".jsx")) {
        fileName = fileName.slice(0, -4);
    }
    fileName += ".compiled.js";
    return fileName;
}
const main = debugOutput(
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
        convert(ast);
        console.log(print(ast).code);

        // writeFile(convertFileName(fileName), print(ast).code);
    });

main();
