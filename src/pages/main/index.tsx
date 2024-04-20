import {
  Box,
  Breakpoint,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  TextField,
  Theme,
  Toolbar,
  styled,
} from "@suid/material";
import TemporaryDrawer, { DrawerHeader } from "./sidebar";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { Tabs as tabsData } from "../../data";
import { UnionTabs } from "../../types";
import { useAtom } from "solid-jotai";
import apiUrlAtom, { defaultApiUrl } from "../../state";
import MuiAppBar, {
  AppBarProps as MuiAppBarProps,
} from "@suid/material/AppBar";
import { Thief } from "./thief";
import {
  InfoOutlined,
  MenuRounded,
  SmartDisplayRounded,
} from "@suid/icons-material";

import "./style.css";

export const drawerWidth = 240;
export const smallSizeWidth = 800;

export default function App() {
  const [tabs, setTabs] = createSignal<UnionTabs>();
  const [open, setOpen] = createSignal(false);
  const [apiDialogOpen, setApiDialogOpen] = createSignal(false);
  const [infoOpen, setInfoOpen] = createSignal(false);
  const [infoAnchorEl, setInfoAnchorEl] = createSignal<HTMLElement | null>(
    null
  );
  const [stealDialogOpen, setStealDialogOpen] = createSignal(false);
  const [apiURL, setAPIURL] = useAtom(apiUrlAtom);
  const [internalURL, setInternalURL] = createSignal("");
  const [smallSize, setSmallSize] = createSignal(
    window.innerWidth < smallSizeWidth
  );
  const [tabsNameOverflow, setTabsNameOverflow] = createSignal(false);

  const [dataVersionKey, setDataVersionKey] = createSignal(0);

  createEffect(() => {
    // init if null
    if (typeof apiURL() !== "string") setAPIURL(defaultApiUrl);

    // add CSS variables to root
    const root = document.documentElement;
    root.style.setProperty("--drawer-width", drawerWidth + "px");
  });

  // show the drawer if tabs is empty
  createEffect(() => {
    if (!tabs()) {
      setTimeout(() => {
        setOpen(true);
      }, 225);
    }
  });

  const handleResize = () => {
    setSmallSize(window.innerWidth < smallSizeWidth);
    const tabHeadingWidth =
      window.innerWidth -
      (document.getElementById("headingButtons")?.getBoundingClientRect()
        .width ?? 0) -
      70;

    const root = document.documentElement;
    root.style.setProperty(
      "--tab-heading-width",
      tabHeadingWidth.toString() + "px"
    );

    const tabsNameBlockWidth = document
      .getElementById("tabsNameBlock")
      .getBoundingClientRect().width;

    console.log(tabsNameBlockWidth, tabHeadingWidth);

    setTabsNameOverflow(tabsNameBlockWidth > tabHeadingWidth - 80);
  };

  createEffect(() => {
    window.addEventListener("resize", handleResize);

    handleResize();

    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
  });

  const Main = styled("main")(({ theme }: { theme: Theme<Breakpoint> }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: "calc(-1 * var(--drawer-width))",
  }));

  interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
  }

  const AppBar = styled(MuiAppBar)<AppBarProps>(
    ({ theme }: { theme: Theme<Breakpoint> }) => ({
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      boxShadow: "none",
      borderBottom: `1px solid ${theme.palette.divider}`,
    })
  );

  const mapTabs = (content: UnionTabs) => {
    if (content.type === "preset") {
      return content.data.url.map((e, index) => {
        switch (content.data.type) {
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
              src={`${apiURL()}${content.data.href}/${e}`}
              style={{
                width: `auto`,
                height: `auto`,
                "max-width": `100%`,
                "max-height": `100%`,
                filter: content.data.meta?.invert ? "invert(1)" : "none",
              }}
            ></img>
          </>
        );
      });
    }
  };

  const metaButton = (tab: UnionTabs) => {
    if (tab.type !== "theft") {
      return;
    }
    const meta = tab.data.meta;
    if (!meta) {
      return;
    }
    return (
      <>
        {meta.name && (
          <>
            <IconButton
              onClick={(event) => {
                setInfoAnchorEl(event.target as HTMLElement);
                setInfoOpen(!infoOpen());
              }}
            >
              <InfoOutlined />
            </IconButton>
            <Menu
              open={infoOpen() && infoAnchorEl() !== null}
              anchorEl={infoAnchorEl()}
              onClose={() => {
                setInfoOpen(false);
                setInfoAnchorEl(null);
              }}
            >
              <List dense disablePadding subheader={<ListItem>参数</ListItem>}>
                {Object.entries(meta).map(([key, value]) => (
                  <ListItem dense>
                    <ListItemText
                      primary={key}
                      secondary={
                        typeof value === "string" ? value : value.toString()
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Menu>
          </>
        )}
        {meta.url && (
          <a href={meta.url} target="_blank">
            <IconButton color="primary">
              <SmartDisplayRounded />
            </IconButton>
          </a>
        )}
      </>
    );
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="absolute"
        style={
          open() &&
          !smallSize() && {
            width: "calc(100% - var(--drawer-width))",
            "margin-left": "var(--drawer-width)",
          }
        }
      >
        <Toolbar>
          <IconButton
            size="small"
            onClick={() => {
              setOpen(true);
            }}
            class={open() && !smallSize() ? "Hideable Hide" : "Hideable"}
          >
            <MenuRounded />
          </IconButton>
          <div
            id="tabHeading"
            class={open() && !smallSize() ? "TabHeading Hide" : "TabHeading"}
          >
            <div class={tabsNameOverflow() ? "GuiTabs Overflow" : "GuiTabs"}>
              <div id="tabsNameBlock">{tabs()?.data?.name ?? "GuiTabs"}</div>
            </div>
            {tabs() && metaButton(tabs())}
          </div>
          {
            <Dialog
              open={stealDialogOpen()}
              fullWidth
              onClose={() => setStealDialogOpen(false)}
            >
              <Thief
                onSubmit={() => {
                  // setStealDialogOpen(false);
                  setDataVersionKey(dataVersionKey() + 1);
                }}
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
          <div
            id="headingButtons"
            style={{ display: "flex", "flex-wrap": "nowrap" }}
          >
            {
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  transition: "225ms",
                  opacity: tabsNameOverflow() ? 1 : 0,
                }}
              />
            }
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setOpen(false);
                setStealDialogOpen(true);
              }}
            >
              Steal
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setOpen(false);
                setInternalURL(apiURL());
                setApiDialogOpen(true);
              }}
            >
              API
            </Button>
          </div>
        </Toolbar>
      </AppBar>
      <Main
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          "margin-left":
            (open() && !smallSize() ? drawerWidth : 0).toString() + "px",
        }}
      >
        <DrawerHeader />
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
      </Main>
      <TemporaryDrawer
        key={dataVersionKey()}
        tabs={tabsData}
        open={open()}
        onTabSelect={(title) => {
          setInfoOpen(false);
          setInfoAnchorEl(null);
          setTabs({ type: "preset", data: tabsData[title] });
          handleResize();
        }}
        onTheftData={(data) => {
          setInfoOpen(false);
          setInfoAnchorEl(null);
          setTabs({ type: "theft", data: data });
          handleResize();
        }}
        setOpen={setOpen}
      />
    </Box>
  );
}
