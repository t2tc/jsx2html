
function simpleChildIter(props) {
    return <div>
        {(props.children || []).map(child => <div>{child}</div>)}
    </div>
}

export default simpleChildIter;
