import {
  Alert,
  Box,
  Breakpoint,
  Button,
  CssBaseline,
  Dialog,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  Popover,
  Theme,
  Toolbar,
  styled,
} from "@suid/material";
import TemporaryDrawer, { DrawerHeader } from "./sidebar";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { useAtom, useAtomValue } from "solid-jotai";
import {
  apiStorageAtom,
  apiUrlAtom,
  currentTabAtom,
  currentTabNamesAtom,
  defaultApiUrl,
  tabsStoreAtom,
} from "../../state";
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
import type { TheftDataEntry } from "../../types";
import { useSearchParams } from "@solidjs/router";
import { APIManagerDialog } from "./api";
import ContentViewer from "./sheet";
import { mapSheetString } from "../../tabs";
import WasmModal from "./wasm-modal";

export const drawerWidth = 240;
export const smallSizeWidth = 800;

export default function App() {
  const [params, setParams] = useSearchParams();
  const searchURL = params["apiURL"];

  const [currentTabName, setCurrentTabName] = useAtom(currentTabNamesAtom);
  const currentTab = useAtomValue(currentTabAtom);
  const tabs = useAtom(tabsStoreAtom)[0];

  const [open, setOpen] = createSignal(false);
  const [apiDialogOpen, setApiDialogOpen] = createSignal(false);
  const [infoOpen, setInfoOpen] = createSignal(false);
  const [infoAnchorEl, setInfoAnchorEl] = createSignal<HTMLElement | null>(
    null,
  );
  const [stealDialogOpen, setStealDialogOpen] = createSignal(false);
  const [wasmModalOpen, setWasmModalOpen] = createSignal(false);
  const [api, setAPI] = useAtom(apiStorageAtom);
  const [apiURL, setAPIURL] = useAtom(apiUrlAtom);
  const [apiURLChanged, setAPIURLChanged] = createSignal(false);
  const [apiButtonAnchorEl, setAPIButtonAnchorEl] =
    createSignal<HTMLElement | null>(null);
  const [smallSize, setSmallSize] = createSignal(
    window.innerWidth < smallSizeWidth,
  );
  const [tabsNameOverflow, setTabsNameOverflow] = createSignal(false);

  const [addingAPI, setAddingAPI] = createSignal<string>("");

  // init if null
  if (typeof apiURL() !== "string") {
    setAPIURL(defaultApiUrl);
  }
  if (typeof api() !== "string") {
    setAPI(JSON.stringify([apiURL()]));
  }

  // get API URL from URL params
  if (!searchURL) {
    setAddingAPI(undefined);
    setApiDialogOpen(false);
  } else {
    const parsedAPIURLs = JSON.parse(api() ?? "[]") as string[];

    if (!parsedAPIURLs.includes(searchURL)) {
      setAddingAPI(searchURL);
      setApiDialogOpen(true);
    } else {
      setAddingAPI(undefined);
      setApiDialogOpen(false);
      if (apiURL() !== searchURL) {
        setAPIURL(searchURL);
        setAPIURLChanged(true);
        setTimeout(() => {
          setAPIURLChanged(false);
        }, 2000);
      }
    }
  }

  createEffect(() => {
    // set URL params on API URL change
    const apiUrl = apiURL();
    if (apiUrl && currentTabName().length > 0) {
      setParams({ apiURL: apiUrl, tabName: currentTabName()[0] });
    }
  });

  createEffect(() => {
    // add CSS variables to root
    const root = document.documentElement;
    root.style.setProperty("--drawer-width", drawerWidth + "px");

    setAPIButtonAnchorEl(document.getElementById("apiButton"));

    if (currentTabName().length === 0) {
      // set activate tab on URL params change
      const searchTab =
        (params["tabName"] ?? "").length > 0
          ? mapSheetString(params["tabName"]).name
          : undefined;
      if (tabs().length > 0 && searchTab) {
        const foundTab = tabs().find((t) => t.name === searchTab);
        if (foundTab) {
          setCurrentTabName([foundTab.href]);
        }
      } else if (!searchTab) {
        // show the drawer if tabs is empty
        setTimeout(() => {
          setOpen(true);
        }, 225);
      }
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
      tabHeadingWidth.toString() + "px",
    );

    const tabsNameBlockWidth = document
      .getElementById("tabsNameBlock")
      .getBoundingClientRect().width;

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
    }),
  );

  const metaButton = (tab: TheftDataEntry) => {
    const meta = tab.meta;
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
          {currentTab && (
            <div
              id="tabHeading"
              class={open() && !smallSize() ? "TabHeading Hide" : "TabHeading"}
            >
              <div class={tabsNameOverflow() ? "GuiTabs Overflow" : "GuiTabs"}>
                <div id="tabsNameBlock">
                  {(currentTab() as TheftDataEntry).name ?? "GuiTabs"}
                </div>
              </div>
              {currentTab() && metaButton(currentTab() as TheftDataEntry)}
            </div>
          )}
          {
            <Dialog
              open={stealDialogOpen()}
              fullWidth
              onClose={() => setStealDialogOpen(false)}
            >
              <Thief close={() => setStealDialogOpen(false)} />
            </Dialog>
          }
          {
            <APIManagerDialog
              openHook={[apiDialogOpen(), setApiDialogOpen]}
              adding={addingAPI()}
            />
          }
          <WasmModal
            open={wasmModalOpen()}
            onClose={() => setWasmModalOpen(false)}
          />
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
                setWasmModalOpen(true);
              }}
            >
              Listen
            </Button>
            <Button
              id="apiButton"
              variant="text"
              size="small"
              onClick={() => {
                setOpen(false);
                setApiDialogOpen(true);
              }}
            >
              API
            </Button>
            <Popover
              open={apiURLChanged()}
              anchorEl={apiButtonAnchorEl()}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              elevation={1}
            >
              <Alert>API URL 已更改</Alert>
            </Popover>
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
        {currentTabName() !== null ? (
          <ContentViewer />
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
      <TemporaryDrawer open={open()} setOpen={setOpen} />
    </Box>
  );
}
