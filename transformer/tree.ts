import chalk from 'chalk';

type TreeNode<T> = {
    content: T; 
    children: TreeNode<T>[];

    addChild: (child: TreeNode<T>) => () => void;
    newChild: (content: T) => TreeNode<T>;
}

function makeTreeClass<T>(content?: T) {
    class Tree implements TreeNode<T> {
        content: T;
        children: TreeNode<T>[];

        constructor(ctorContent?: T) {
            this.content = ctorContent ?? content ?? ({} as T);
            this.children = [];
            this.addChild = this.addChild.bind(this);
            this.newChild = this.newChild.bind(this);
        }

        addChild = (child: TreeNode<T>) => () => {
            this.children.push(new Tree(child.content));
            return () => {
                this.children = this.children.filter(c => c !== child);
            }
        }

        newChild = (childContent: T) => {
            let child = new Tree(childContent);
            this.children.push(child);
            return child;
        }
    }

    return Tree;
}

type TreeAccessors<T> = {
    getContent: (node: T) => string | number;
    getChildren: (node: T) => T[];
}

function logTree<T>(
    tree: T, 
    {
        getContent = (node: any) => node.content,
        getChildren = (node: any) => node.children,
    }: Partial<TreeAccessors<T>> = {},
    indent = 0,
    isLast = true,
    parentPrefixes: string[] = []
): void {
    // Create the current line's prefix
    const currentPrefix = indent === 0 ? '' : (isLast ? '└── ' : '├── ');
    
    // Get children using accessor
    const children = getChildren(tree);
    if (!(children instanceof Array)) {
        throw new Error("children must be an array.");
    }
    
    // Build the content string with child count if there are children
    const childCount = children.length > 0 ? ` (${children.length})` : '';
    const content = `${getContent(tree)}${childCount}`;

    // Choose color based on indent level (cycling through colors)
    const colors = [chalk.blue, chalk.green, chalk.yellow, chalk.magenta, chalk.cyan];
    const colorFn = colors[indent % colors.length];
    
    // Build the full line with proper indentation
    const indentation = parentPrefixes.join('');
    console.log(`${indentation}${currentPrefix}${colorFn(content)}`);

    // Prepare the prefix for children
    const childPrefix = indent === 0 ? '' : (isLast ? '    ' : '│   ');
    const newParentPrefixes = [...parentPrefixes, childPrefix];

    // Recursively log children
    children.forEach((child, index) => {
        const isLastChild = index === children.length - 1;
        logTree(
            child,
            { getContent, getChildren },
            indent + 1,
            isLastChild,
            newParentPrefixes
        );
    });
}

export { makeTreeClass, logTree };
