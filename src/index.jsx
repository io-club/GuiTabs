import { Router } from "@solidjs/router";
import { render } from "solid-js/web";
import App from "./pages/main"
render(
    () => (
        <Router>
            <App />
        </Router>
    ),
    document.getElementById("root")
);