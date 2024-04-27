import {
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
  Theme,
  Toolbar,
  styled,
} from "@suid/material";
import TemporaryDrawer, { DrawerHeader } from "./sidebar";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { useAtom } from "solid-jotai";
import {
  apiStorageAtom,
  apiUrlAtom,
  currentTabNamesAtom,
  defaultApiUrl,
  enableAPI,
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
import { TheftDataEntry } from "../../types";
import { useSearchParams } from "@solidjs/router";
import { APIManagerDialog } from "./api";

export const drawerWidth = 240;
export const smallSizeWidth = 800;

export default function App() {
  const [params, setParams] = useSearchParams();
  const searchURL = params["apiURL"];

  const [currentTabName, setCurrentTabName] = useAtom(currentTabNamesAtom);
  const tabs = useAtom(tabsStoreAtom)[0];

  const [open, setOpen] = createSignal(false);
  const [apiDialogOpen, setApiDialogOpen] = createSignal(!!searchURL);
  const [infoOpen, setInfoOpen] = createSignal(false);
  const [infoAnchorEl, setInfoAnchorEl] = createSignal<HTMLElement | null>(
    null
  );
  const [stealDialogOpen, setStealDialogOpen] = createSignal(false);
  const [api, setAPI] = useAtom(apiStorageAtom);
  const [apiURL, setAPIURL] = useAtom(apiUrlAtom);
  const [smallSize, setSmallSize] = createSignal(
    window.innerWidth < smallSizeWidth
  );
  const [tabsNameOverflow, setTabsNameOverflow] = createSignal(false);

  const [addingAPI, setAddingAPI] = createSignal<string>(searchURL);

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
    if (!(JSON.parse(api() ?? "[]") as string[]).includes(searchURL)) {
      setAddingAPI(searchURL);
      setApiDialogOpen(true);
    } else {
      setAddingAPI(undefined);
      setApiDialogOpen(false);
      setAPIURL(searchURL);
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

    if (currentTabName().length === 0) {
      // set activate tab on URL params change
      const searchTab = params["tabName"];
      if (tabs().length > 0 && searchTab) {
        const foundTab = tabs().find((t) => t.name === searchTab);
        if (foundTab) {
          setCurrentTabName([foundTab.name]);
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
      tabHeadingWidth.toString() + "px"
    );

    const tabsNameBlockWidth = document
      .getElementById("tabsNameBlock")
      .getBoundingClientRect().width;

    setTabsNameOverflow(tabsNameBlockWidth > tabHeadingWidth - 80);
  };

  const getCurrentTab = (): TheftDataEntry | null => {
    return tabs().find((t) => t.name === currentTabName()[0]) ?? null;
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

  const mapTab = (content: TheftDataEntry) => {
    return content.content.map((e, index) => {
      return (
        <>
          <p>
            第 {index + 1} 页，共 {content.pages} 页 👇
          </p>
          <img
            src={`${apiURL()}${content.href}/${e}`}
            style={{
              width: `auto`,
              height: `auto`,
              "max-width": `100%`,
              "max-height": `100%`,
              filter: content.meta?.invert ? "invert(1)" : "none",
            }}
          ></img>
        </>
      );
    });
  };

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
          <div
            id="tabHeading"
            class={open() && !smallSize() ? "TabHeading Hide" : "TabHeading"}
          >
            <div class={tabsNameOverflow() ? "GuiTabs Overflow" : "GuiTabs"}>
              <div id="tabsNameBlock">{getCurrentTab()?.name ?? "GuiTabs"}</div>
            </div>
            {getCurrentTab() !== null && metaButton(getCurrentTab())}
          </div>
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
        {getCurrentTab() !== null ? (
          mapTab(getCurrentTab())
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
