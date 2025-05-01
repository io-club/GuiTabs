import { Router, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import App from "./pages/main";

render(
  () => (
    <Router>
      <Route path="/*" component={App} />
    </Router>
  ),
  document.getElementById("root")
);
