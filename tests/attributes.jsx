
const identifier = "identifier";

const spreadAttribute = {
    spreadAttribute: "spread"
};

const a = <div stringAttribute="b"
    stringAttribute2='c'
    staticAttribute={1}
    attributeWithIdentifier={identifier}
    attribute-with-dash={"e"}
    attributeWithStringLiteral={"f"}
    attributeWithStringLiteral2={'g'}
    attributeWithTemplateLiteral={`h`}
    attributeWithBooleanLiteral={true}
    attributeWithRegExpLiteral={/regex/g}
    attributeWithNull={null}
    attributeWithUndefined={undefined}
    attributeWithArray={["a", "b", "c"]}
    attributeWithObject={{ "a": 1 }}
    attributeWithArrowFunction={() => 1}
    attributeWithArrowFunction2={() => {
        return 1;
    }}
    attributeWithoutValue
    jsxWithinAttribute={<div attribute="jsx">jsx</div>}
    {...spreadAttribute}
/>;

console.log(a);