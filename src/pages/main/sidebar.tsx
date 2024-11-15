import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  createTheme,
  styled,
} from "@suid/material";
import { DrawerProps } from "@suid/material/Drawer";
import { TheftData } from "../../types";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { useAtom } from "solid-jotai";
import { apiUrlAtom, currentTabNamesAtom, tabsStoreAtom } from "../../state";
import {
  ChevronLeftRounded,
  QueueMusicRounded,
  SearchRounded,
} from "@suid/icons-material";

import "./style.css";
import { drawerWidth, smallSizeWidth } from ".";
import { mapSheetString } from "../../tabs";

type Anchor = NonNullable<DrawerProps["anchor"]>;

export const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function TemporaryDrawer(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const allTagsTag = "all tabs";
  const open = () => props.open;

  const [theftData, setTheftData] = useAtom(tabsStoreAtom);
  const [currentTab, setCurrentTab] = useAtom(currentTabNamesAtom);
  const [searchTerm, setSearchTerm] = createSignal("");
  const [smallSize, setSmallSize] = createSignal(
    window.innerWidth < smallSizeWidth,
  );

  const [availableTags, setAvailableTags] = createSignal<Set<string>>(
    new Set([allTagsTag]),
  );

  const apiURL = useAtom(apiUrlAtom)[0];

  createEffect(() => {
    const handleResize = () => {
      setSmallSize(window.innerWidth < smallSizeWidth);
    };

    window.addEventListener("resize", handleResize);

    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
  });

  createEffect(async () => {
    const response = await fetch(apiURL() + "/list");
    const data = ((await response.json()) as string[]).map(
      mapSheetString,
    ) as TheftData;

    console.log(data);

    setTheftData(data);
    let newTags = new Set<string>([allTagsTag]);
    data.forEach((entry) => {
      if (entry.tags) {
        entry.tags.forEach((tag) => newTags.add(tag));
      }
    });
    setAvailableTags(newTags);
  });

  let [selectedTags, setSelectedTags] = createSignal([allTagsTag]);

  let filteredTheftData = () =>
    theftData().filter(
      (data) =>
        selectedTags().every((tag) => {
          return (data.tags ?? []).concat(allTagsTag).includes(tag);
        }) &&
        (data.name
          .toLowerCase()
          .replace(" ", "")
          .includes(searchTerm().toLowerCase().replace(" ", "")) ||
          (data.name ?? "")
            .toLowerCase()
            .replace(" ", "")
            .includes(searchTerm().toLowerCase().replace(" ", ""))),
    );

  const list = (anchor: Anchor) => (
    <Box
      sx={{
        width: anchor === "top" || anchor === "bottom" ? "auto" : drawerWidth,
      }}
      role="presentation"
    >
      <List disablePadding>
        {/* tab list */}
        {filteredTheftData().length === 0 && (
          <ListItem>
            <Typography
              variant="h5"
              color="textSecondary"
              sx={{
                display: "block",
                width: "100%",
                textAlign: "center",
                py: 8,
              }}
            >
              No result found
            </Typography>
          </ListItem>
        )}
        {filteredTheftData().map((entry) => (
          <ListItem disablePadding>
            <ListItemButton
              selected={
                currentTab().length > 0 && currentTab()[0] === entry.href
              }
              onClick={() => {
                setCurrentTab([entry.href]);
                smallSize() && props.setOpen(false);
              }}
            >
              <ListItemIcon sx={{ mr: -2 }}>
                <QueueMusicRounded />
              </ListItemIcon>
              <ListItemText primary={entry.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Typography
        variant="caption"
        sx={{ display: "block", width: "100%", textAlign: "center", py: 2 }}
      >
        <p>Made with 😈 by IO Club</p>
        <p>
          Github:{" "}
          <Link href="https://github.com/io-club/GuiTabs" target="_blank">
            GuiTabs
          </Link>
          &nbsp;
          <Link href="https://github.com/io-club/GuiTabsThief" target="_blank">
            GuiTabsThief
          </Link>
        </p>
      </Typography>
    </Box>
  );
  const anchor: Anchor = "left";
  return (
    <Drawer
      ModalProps={{
        onBackdropClick: () => {
          props.setOpen(false);
        },
      }}
      variant={!smallSize() ? "persistent" : "temporary"}
      anchor={anchor}
      open={open()}
      sx={{ zIndex: 9999 }}
    >
      <Box
        backgroundColor={createTheme().palette.background.paper}
        style={{ position: "sticky", top: 0, "z-index": 9999 }}
      >
        <DrawerHeader
          sx={{
            width: "var(--drawer-width)",
            gap: "8px",
            pr: smallSize() ? 2 : 1,
          }}
        >
          <Box class="SearchBox">
            <SearchRounded class="WoW" fontSize="small" />
            <input
              type="search"
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="Search"
              placeholder="Search"
              autocomplete="on"
            />
          </Box>
          {!smallSize() && (
            <IconButton
              size="small"
              onClick={() => {
                props.setOpen(false);
              }}
            >
              <ChevronLeftRounded />
            </IconButton>
          )}
        </DrawerHeader>
        <Divider />
        <Box class="TagsBox">
          {/* tags */}
          {Array.from(availableTags()).map((v) => (
            <Chip
              onClick={() => {
                const checked = !selectedTags().includes(v);
                if (v === allTagsTag) {
                  setSelectedTags([allTagsTag]);
                  return;
                }
                if (checked) {
                  setSelectedTags([
                    v,
                    ...selectedTags().filter((tag) => tag !== allTagsTag),
                  ]);
                } else {
                  const currenTags = selectedTags();
                  currenTags.splice(currenTags.indexOf(v), 1);
                  setSelectedTags([...currenTags]);
                }
                if (selectedTags().length === 0) {
                  setSelectedTags([allTagsTag]);
                }
              }}
              color={selectedTags().includes(v) ? "primary" : "default"}
              label={v}
            />
          ))}
        </Box>
        <Divider />
      </Box>
      {list(anchor)}
    </Drawer>
  );
}
