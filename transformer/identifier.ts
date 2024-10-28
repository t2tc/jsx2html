import { print } from "../third_parties/recast/main.ts";
import { namedTypes } from "ast-types";

type Identifier = {
    namespace: string | null;
    name: string;
}

function getIdentifier(node: namedTypes.JSXIdentifier | namedTypes.JSXMemberExpression | namedTypes.JSXNamespacedName): Identifier {
    if (node.type === "JSXIdentifier") {
        return {
            namespace: null,
            name: node.name
        };
    } else if (node.type === "JSXNamespacedName") {
        return {
            namespace: node.namespace.name,
            name: node.name.name
        };
    } else if (node.type === "JSXMemberExpression") {
        return {
            namespace: null,
            name: print(node).code
        };
    }
    throw new Error("Invalid identifier type");
}

export { getIdentifier, type Identifier };