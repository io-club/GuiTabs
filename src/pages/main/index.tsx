import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@suid/material";
import TemporaryDrawer from "./sidebar";
import { createSignal } from "solid-js";
import { Tabs as tabsData } from "../../data";
import { Tab, TheftDataEntry } from "../../types";
import { useAtom } from "solid-jotai";
import apiUrlAtom from "../../state";
import { Thief } from "./thief";

export default function App() {
  type Tabs =
    | {
        type: "preset";
        data: Tab;
      }
    | {
        type: "theft";
        data: TheftDataEntry;
      };
  const [tabs, setTabs] = createSignal<Tabs>();
  const [open, setOpen] = createSignal(false);
  const [apiDialogOpen, setApiDialogOpen] = createSignal(false);
  const [stealDialogOpen, setStealDialogOpen] = createSignal(false);
  const [apiURL, setAPIURL] = useAtom(apiUrlAtom);
  const [internalURL, setInternalURL] = createSignal("");

  const [dataVersionKey, setDataVersionKey] = createSignal(0);

  const mapTabs = (content: Tabs) => {
    if (content.type === "preset") {
      return tabsData[content.data.name].url.map((e, index) => {
        switch (tabsData[content.data.name].type) {
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
      });
    } else if (content.type === "theft") {
      return content.data.content.map((e, index) => {
        return (
          <>
            <p>
              第 {index + 1} 页，共 {content.data.pages} 页 👇
            </p>
            <img
              src={`${apiURL()}/${content.data.href}/${e}`}
              style={{
                width: `auto`,
                height: `auto`,
                "max-width": `100%`,
                "max-height": `100%`,
              }}
            ></img>
          </>
        );
      });
    }
  };

  return (
    <>
      <div>
        <TemporaryDrawer
          key={dataVersionKey()}
          tabs={tabsData}
          open={open()}
          onTabSelect={(title) => {
            setTabs({ type: "preset", data: tabsData[title] });
          }}
          onTheftData={(data) => {
            setTabs({ type: "theft", data: data });
          }}
          setOpen={setOpen}
        />

        <Button
          variant="text"
          size="small"
          onClick={() => {
            setOpen(true);
          }}
        >
          LIST
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            setStealDialogOpen(true);
          }}
        >
          Steal
        </Button>
        {
          <Dialog
            open={stealDialogOpen()}
            fullWidth
            onClose={() => setStealDialogOpen(false)}
          >
            <Thief
              onSubmit={() => setStealDialogOpen(false)}
              close={() => setStealDialogOpen(false)}
            />
          </Dialog>
        }
        {
          <Dialog
            open={apiDialogOpen()}
            fullWidth
            onClose={() => setApiDialogOpen(false)}
          >
            <DialogTitle>设置 API URL</DialogTitle>
            <DialogContent>
              <TextField
                label="API URL"
                value={internalURL()}
                onChange={(e) => setInternalURL(e.target.value)}
                fullWidth
                style={{
                  "margin-top": "0.5em",
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApiDialogOpen(false)}>取消</Button>
              <Button
                onClick={() => {
                  setAPIURL(internalURL());
                  setApiDialogOpen(false);
                }}
              >
                保存
              </Button>
            </DialogActions>
          </Dialog>
        }

        <a
          style={{
            "text-align": "right",
            "text-decoration": "overline",
            "font-weight": "bold",
            "margin-left": "10px",
          }}
        >
          {tabs()?.data?.name ?? "GuiTabs"}
        </a>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            setInternalURL(apiURL ?? "http://localhost:8000");
            setApiDialogOpen(true);
          }}
          style={{
            float: "right",
            "margin-right": "10px",
          }}
        >
          Theft API
        </Button>
      </div>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
        }}
      >
        {tabs() ? (
          mapTabs(tabs())
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
