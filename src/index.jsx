import { Route, Router, Routes } from "@solidjs/router";
import { render } from "solid-js/web";
import { Button } from "@suid/material";
import TemporaryDrawer from "./tabs";

import { createSignal } from "solid-js";

function App() {
  const [value, setValue] = createSignal("GuiTabs");
  let allTabs = {
    Peace: {
      name: "Peace",
      url: ["/finger/peace/1.png"],
    },
    "like a star": {
      name: "like a star",
      url: [
        "/finger/like_a_star/1.webp",
        "/finger/like_a_star/2.webp",
        "/finger/like_a_star/3.webp",
        "/finger/like_a_star/4.webp",
        "/finger/like_a_star/5.webp",
        "/finger/like_a_star/6.webp",
        "/finger/like_a_star/7.webp",
      ],
    },
  };
  return (
    <>
      <div>
        <Button variant="text" size="small">
          <TemporaryDrawer
            tabs={allTabs}
            onClick={(title) => {
              setValue(title);
            }}
          ></TemporaryDrawer>
        </Button>
        <a
          style={{
            "text-align": "right",
            "text-decoration": "overline",
            "font-weight": "bold",
            "margin-left": "10px",
          }}
        >
          {allTabs[value()] ? allTabs[value()].name : "GuiTabs"}
        </a>
      </div>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
        }}
      >
        {allTabs[value()] ? (
          allTabs[value()].url.map((e, index) => (
            <>
              第 {index + 1} 页 👇
              <img
                src={`${e}`}
                style={{
                  width: `auto`,
                  height: `auto`,
                  "max-width": `100%`,
                  "max-height": `100%`,
                }}
              ></img>
            </>
          ))
        ) : (
          <img src="t.webp"></img>
        )}
      </div>
    </>
  );
}

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById("root")
);
