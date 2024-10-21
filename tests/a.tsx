
let React = {
    createElement: (tag: string, props: Record<string, string>, ...children: (string | Record<string, string>)[]) => {
        return { tag, props, children };
    }
}

function clickHandler() {
    console.log('clicked');
}

let Foo = {
    Bar: <svg:circle on:click={clickHandler}></svg:circle>
}

let a = <svg:circle></svg:circle>;
let b = <Foo.Bar></Foo.Bar>;