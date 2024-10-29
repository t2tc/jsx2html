import fs from "node:fs";
import path from "node:path";

import { print } from "./third_parties/recast/main.ts";
import { convert, convertJSXFragment } from "./transformer/convert";
import { parseCode } from "./transformer/utils";

// globalThis.DEBUG = true;

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
