function isFirstLetterUpperCase(name: string) {
    return name[0] === name[0].toUpperCase();
}

function isFirstLetterLowerCase(name: string) {
    return name[0] === name[0].toLowerCase();
}

export default {
    jsx: true,
    compilerOptions: {
        identifier: [
            {
                rule: isFirstLetterUpperCase,
                process: ({name}: {name: string}) => name.slice(1).toLowerCase(),
            },
            {
                rule: isFirstLetterLowerCase,
                process: ({name}: {name: string}) => name,
            },
        ]
    }
}