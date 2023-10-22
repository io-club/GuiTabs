import { Route, Router, Routes } from "@solidjs/router"
import { render } from "solid-js/web";
import { lazy } from "solid-js";
const Tabs = lazy(() => import("./tabs"));
const Todo = lazy(() => import("./todo"));
// import {Todo} from "./todo";
// import Tabs from "./tabs";

function App() {

    return <>
        <h1 >Guitar Tabs Home</h1>
        <nav>
            <a href="/tabs">Tabs</a>
            <a href="/todo">Todo</a>
        </nav>
        <Routes>
            <Route path="/tabs" component={Tabs} />
            <Route path="/todo" component={Todo} />
        </Routes>
    </>
};

render(() =>
    <Router>
        <App />
    </Router>, document.getElementById('root'));