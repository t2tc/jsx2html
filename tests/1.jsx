
const App = () => {
    let a = ref(0);

    setInterval(() => {
        a.value++;
    }, 1000);

    return (<div class="bg-red-300 rounded-lg">
        <div class="text-center">
            <h1 class="text-4xl font-bold">
                {() => <div></div>}
                <span class="text-2xl">
                </span>
            </h1>
        </div>

    </div>);
}

export default App;
