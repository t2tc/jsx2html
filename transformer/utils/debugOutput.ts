import chalk from "chalk";

function debugOutput<T>(fn: (...args: any[]) => T, formatter: (result: T) => string = result => String(result)) {
    const startTime = performance.now();
    return (...args: any[]) => {
        if (args.length > 0) {
            console.log(chalk.bgYellow(`${fn.name} started with args: ${args}`));
        } else {
            console.log(chalk.bgYellow(`${fn.name} started`));
        }
        const result = fn(...args);
        const endTime = performance.now();
        console.log(chalk.bgYellow(`${fn.name} took ${endTime - startTime} ms`));
        if (result !== undefined) {
            const formattedResult = formatter(result);
            console.log(chalk.bgYellow(`${fn.name} returned: ${formattedResult}`));
        } else {
            console.log(chalk.bgYellow(`${fn.name} returned`));
        }
        return result;
    }
}

export default debugOutput;
