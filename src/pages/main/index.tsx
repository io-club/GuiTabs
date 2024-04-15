import {
  Box,
  Breakpoint,
  Button,
  ButtonBase,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { createEffect, createSignal, on, onCleanup } from "solid-js";
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
  const [smallSize, setSmallSize] = createSignal(window.innerWidth < 520);

  const [dataVersionKey, setDataVersionKey] = createSignal(0);

  // init if null
  createEffect(() => {
    if (typeof apiURL() !== "string") setAPIURL(defaultApiUrl);
  });

  // show the drawer if tabs is empty
  createEffect(() => {
    if (!tabs()) {
      setTimeout(() => {
        setOpen(true);
      }, 225);
    }
  });

  createEffect(() => {
    const handleResize = () => {
      setSmallSize(window.innerWidth < 520);
    };

    window.addEventListener("resize", handleResize);

    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
  });

  const drawerWidth = 240;

  const Main = styled("main")(({ theme }: { theme: Theme<Breakpoint> }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
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
                  <ListItem>
                    <ListItemText primary={key} secondary={value} />
                  </ListItem>
                ))}
              </List>
            </Menu>
          </>
        )}
        <a href={meta.url} target="_blank">
          <IconButton color="primary">
            <SmartDisplayRounded />
          </IconButton>
        </a>
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
            width: `calc(100% - ${drawerWidth}px)`,
            "margin-left": `${drawerWidth}px`,
          }
        }
      >
        <Toolbar>
          <IconButton
            size="small"
            onClick={() => {
              setOpen(true);
            }}
            sx={{
              transition: "355ms cubic-bezier(0, 0, 0.2, 1) 225ms",
              transform: `translateX(${!open() ? "0" : "-2em"})`,
              opacity: !open() ? 1 : 0,
              cursor: !open() ? "pointer" : "default",
            }}
          >
            <MenuRounded />
          </IconButton>
          <div
            style={{
              transition: "transform 355ms cubic-bezier(0, 0, 0.2, 1) 225ms",
              transform: `translateX(${!open() ? "0" : "-2em"})`,
            }}
          >
            <span
              style={{
                "text-align": "right",
                "text-decoration": "overline",
                "font-weight": "bold",
                transform: "translateY(0.1em)",
                display: "inline-block",
                margin: "0 10px",
              }}
            >
              {tabs()?.data?.name ?? "GuiTabs"}
            </span>
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
                  setStealDialogOpen(false);
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
          <div style={{ "flex-grow": 1 }}></div>
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
        }}
        onTheftData={(data) => {
          setInfoOpen(false);
          setInfoAnchorEl(null);
          setTabs({ type: "theft", data: data });
        }}
        setOpen={setOpen}
      />
    </Box>
  );
}
