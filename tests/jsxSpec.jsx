
const simpleJsx = <div>Simple JSX</div>;
const simpleJsxWithNamespace = <svg:circle cx={10} cy={10} r={10} />;
const simpleJsxWithMemberExpression = <svg.circle cx={10} cy={10} r={10} />;

const simpleJsx2 = <p class="text-bold text-blue">Simple JSX</p>;
const simpleJsx3 = <h2 class="text-bold text-blue" style={{ color: 'red' }}>Simple JSX</h2>;
const simpleJsx4 = <canvas class="text-bold text-blue" style={{ color: 'red' }} onClick={() => alert('Hello')}>Simple JSX</canvas>;
const simpleJsx5 = <audio class="text-bold text-blue" style={{ color: 'red' }} onClick={() => alert('Hello')}>Simple JSX</audio>;
const simpleFragment = <></>;
const simpleSelfClosingElement = <br whatever="hello" />;

let g = { g: "hello" };
let g2 = ["data-foo", "data-bar"];
let c = <div a="hello" b="hello" d={12} e={"hello2"} f={() => { return "hello" }} {...g} {...g2} h></div>;
// let c = <div a=<p>this is surprising legal, but should be avoided.</p> s=<> a fragment is also legal, but vscode doesn't even render it properly. </> b="hello" d={12} e={"hello2"} f={()=>{ return "hello"}} {...g} {...g2} h></div>;

const arr = [1, 2, 3, 4, 5];

//const jsxWithInAJsx = <for each={arr}>{
//    (item) => <div>{item}</div>
//}</for>;

const jsxSpreadAttrTest = <div {...{ class: 'text-bold text-blue' }}>Simple JSX</div>;
const jsxSpreadTest2 = <svg {...{ class: 'text-bold text-blue', style: { color: 'red' } }}>Simple JSX</svg>;

function thatReturnJsx() {
    let a = 0;
    return <>
        <svg>
            <svg:circle cx={10} cy={10} r={10} />
        </svg>
        <div static-one>contains only static.</div>
        <div>may contain {a} dynamic content.</div>
        <div>this is a static root,
            and this is in middle,
            <>
                <p> but contains a {expression} makes it dynamic, unless specified. also {...arr2} got spreaded.  </p></>
        </div>
    </>
}
