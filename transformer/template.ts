
/// 一个数组，表示从根节点到当前节点的路径。
type ChildrenLocator = number[];

function extractStaticAndDynamicContent(node: ASTNode): {
    staticContent: StaticContentNode} {
    visit(node, {
        visitJSXElement(path) {
        }
    });

    return { staticContent: {} };
}

function makeStaticContentTemplate(node: StaticContentNode) {
}
