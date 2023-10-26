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
      type: "png",
    },
    like_a_star: {
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
      type: "webp",
    },
    time_travel: {
      name: "time travel",
      url: [
        "/finger/time_travel/1.png",
        "/finger/time_travel/2.png",
        "/finger/time_travel/3.png",
        "/finger/time_travel/4.png",
        "/finger/time_travel/5.png",
        "/finger/time_travel/6.png",
      ],
      type: "png",
    },
    fenyechen: {
      name: "枫叶城",
      url: [
        "/finger/fenyechen/1.png",
        "/finger/fenyechen/2.png",
        "/finger/fenyechen/3.png",
      ],
      type: "png",
    },
    qijishan: {
      name: "奇迹山",
      url: [
        "/finger/qijishan/1.webp",
        "/finger/qijishan/2.webp",
        "/finger/qijishan/3.webp",
      ],
      type: "webp",
    },
    huahai: {
      name: "花海 电吉他",
      url: ["/finger/huahai/1.png", "/finger/huahai/2.png"],
      type: "png",
    },
    april_encounter: {
      name: "April Encounter",
      url: [
        "/strum/april_encounter/1.jpg",
        "/strum/april_encounter/2.jpg",
        "/strum/april_encounter/3.jpg",
      ],
      type: "jpg",
    },
    meihaoshiwu: {
      name: "美好事物",
      url: [
        "/strum/meihaoshiwu/1.jpg",
        "/strum/meihaoshiwu/2.jpg",
        "/strum/meihaoshiwu/3.jpg",
      ],
      type: "jpg",
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
          allTabs[value()].url.map((e, index) => {
            switch (allTabs[value()].type) {
              case "pdf":
                return <a>pdf gun !</a>;
              default:
                return (
                  <>
                    <p>第 {index + 1} 页 👇</p>
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
                );
            }
          })
        ) : (
          <img
            src="index.png"
            style={{
              width: `300px`,
              height: `300px`,
            }}
          ></img>
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
