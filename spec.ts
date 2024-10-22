
let templateMap = new Map<string, HTMLTemplateElement>();

function template(innerHTML: string): Element {
    const templateRoot = document.querySelector('template-root');
    if (!templateMap.has(innerHTML)) {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = innerHTML;
        templateMap.set(innerHTML, tmpl);
    }
    templateRoot!.appendChild(templateMap.get(innerHTML)!);
    return templateMap.get(innerHTML)!.content.firstElementChild!.cloneNode(true) as Element;
}

namespace spec {
    let case_1 = '<div></div>';
    // should compile to:
    // let case_1 = (function createCase1() {
    //    const div$1 = document.createElement('div');
    //    return div$1;
    // })();
    let case_2 = '<div><span></span></div>';
    // should compile to:
    // let case_2 = (function createCase2() {
    //    const div$1 = document.createElement('div');
    //    const span$1 = document.createElement('span');
    //    div$1.appendChild(span$1);
    //    return div$1;
    // })();
    // or using template and innerHTML:
    let case_2_tmpl = (() => {
        const tmpl = template('<div><span></span></div>');
        return tmpl;
    })

    let case_3 = `
        <div>
            <if condition={a.value}>
                <span></span>
            </if>
        </div>
    `
    // should compile to:
    // let case_3 = (function createCase3() {
    //    let div$1 = document.createElement('div');
    //    let if$1;
    //    effect(() => {
    //        if (a.value) {
    //            if$1 = document.createElement('span');
    //        } else {
    //            if$1 = document.createComment('if');
    //     });
    // })();
}
