
const element = (<layer-1>
    <p b="1">This is a children, and
        <ax>This is a child of a child.</ax>
    </p>
    <selfClosingElement />
    <layer-2>Whatever</layer-2>
    {<b>This shall be treated as another entry.
        <ac>This is a child of a child.</ac>
    </b>}
</layer-1>);

const element2 = (
    <layer-1>This is simply another entry.</layer-1>
)