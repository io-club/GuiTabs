import { Button } from "@suid/material";
import TemporaryDrawer from "./sidebar";
import { createSignal } from "solid-js";
import { Tabs } from "../../data";

export default function App() {
  const [value, setValue] = createSignal("GuiTabs");
  const [open, setOpen] = createSignal(false)
  return (
    <>
      <div>
        <TemporaryDrawer
          tabs={Tabs}
          open={open()}
          onTabSelect={(title) => {
            setValue(title);
          }}
          setOpen={setOpen}
        ></TemporaryDrawer>

        <Button variant="text" size="small" onClick={() => {
          setOpen(true)
        }}>
          LIST
        </Button>

        <a
          style={{
            "text-align": "right",
            "text-decoration": "overline",
            "font-weight": "bold",
            "margin-left": "10px",
          }}
        >
          {Tabs[value()] ? Tabs[value()].name : "GuiTabs"}
        </a>
      </div >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
        }}
      >
        {Tabs[value()] ? (
          Tabs[value()].url.map((e, index) => {
            switch (Tabs[value()].type) {
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


