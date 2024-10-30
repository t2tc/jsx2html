
const element = <div>
    <WhatIsThis />
    <x-sheet></x-sheet>
    <h1>Hello</h1>
    <p>This is a simple paragraph. If it is rendered, the test is successful.</p>
    <p style={{ color: "red" }}>This is a styled paragraph.</p>
</div>

let variable = "a variable";

const element2 = <div>
    <li>Here are some conventions.</li>
    <li>A node with only whitespace will be ignored.</li>
    <li>A node with only text will be converted to innerText. But,</li>
    <li>If it contains <b>{variable}</b>, Things can get complicated.</li>
</div>

document.body.appendChild(element);