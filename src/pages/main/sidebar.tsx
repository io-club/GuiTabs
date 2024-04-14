import InboxIcon from "@suid/icons-material/MoveToInbox";
import {
  Box,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
} from "@suid/material";
import { DrawerProps } from "@suid/material/Drawer";
import { ListItemTab, TabMap, TheftData, TheftDataEntry } from "../../types";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { useAtom } from "solid-jotai";
import apiUrlAtom from "../../state";
import { ChevronLeftRounded } from "@suid/icons-material";

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
  tabs: TabMap;
  onTabSelect: (title: string) => void;
  onTheftData: (data: TheftDataEntry) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  key: string | number;
}) {
  const open = () => props.open;
  const originTabs: ListItemTab[] = Object.entries(props.tabs).map(
    ([key, value]) => {
      let tags = ["default"];
      if (Array.isArray(value.tag)) {
        tags = [...tags, ...value.tag];
      } else if (value.tag) {
        tags = [value.tag, ...tags];
      }
      return {
        ...value,
        key: key,
        tags: tags,
        selected: value.tag ? false : true,
      };
    }
  );

  const [theftData, setTheftData] = createSignal<TheftData>([]);
  const [theftEnabled, setTheftEnabled] = createSignal(true);
  const [smallSize, setSmallSize] = createSignal(window.innerWidth < 520);
  const apiURL = useAtom(apiUrlAtom)[0];

  createEffect(() => {
    const handleResize = () => {
      setSmallSize(window.innerWidth < 520);
    };

    window.addEventListener("resize", handleResize);

    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
  });

  createEffect(async () => {
    const response = await fetch(apiURL() + "/list");
    const data = (await response.json()) as TheftData;
    setTheftData(data);
  });

  // get all tags in tabs and delete dup tags
  const allTags = originTabs
    .map((tab) => tab.tags)
    .reduce((prev, curr) => prev.concat(curr))
    .filter((tag, index, self) => self.indexOf(tag) === index);

  let [selectedTags, setSelectedTags] = createSignal(["default"]);

  let filteredTabs = () =>
    originTabs.filter((tab) =>
      tab.tags.some((tag) => selectedTags().includes(tag))
    );

  const list = (anchor: Anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 250 }}
      role="presentation"
    >
      <Box>
        {/* tags */}
        <FormGroup sx={{ p: 3 }}>
          {allTags.map((v) => (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  onChange={(e, checked) => {
                    if (checked) {
                      setSelectedTags([v, ...selectedTags()]);
                    } else {
                      const currenTags = selectedTags();
                      currenTags.splice(currenTags.indexOf(v), 1);
                      setSelectedTags([...currenTags]);
                    }
                  }}
                  checked={selectedTags().includes(v)}
                />
              }
              label={v}
            />
          ))}
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                onChange={(e, checked) => {
                  setTheftEnabled(checked);
                }}
                checked={theftEnabled()}
              />
            }
            label="theft"
          />
        </FormGroup>
      </Box>
      <Divider />
      <List>
        {/* tab list */}
        {filteredTabs().map((tab) => (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                props.onTabSelect(tab.key);
                smallSize() && props.setOpen(false);
              }}
            >
              <ListItemIcon>{<InboxIcon />}</ListItemIcon>
              <ListItemText primary={tab["name"]} />
            </ListItemButton>
          </ListItem>
        ))}
        {theftEnabled() &&
          theftData().map((data) => (
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  props.onTheftData(data);
                  smallSize() && props.setOpen(false);
                }}
              >
                <ListItemIcon>{<InboxIcon />}</ListItemIcon>
                <ListItemText primary={data["name"]} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
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
      <DrawerHeader>
        <IconButton
          size="small"
          onClick={() => {
            props.setOpen(false);
          }}
        >
          <ChevronLeftRounded />
        </IconButton>
      </DrawerHeader>
      <Divider />
      {list(anchor)}
    </Drawer>
  );
}
