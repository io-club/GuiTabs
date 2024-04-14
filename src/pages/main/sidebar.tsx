import InboxIcon from "@suid/icons-material/MoveToInbox";
import {
  Box,
  Checkbox,
  Drawer,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@suid/material";
import { DrawerProps } from "@suid/material/Drawer";
import { ListItemTab, TabMap, TheftData, TheftDataEntry } from "../../types";
import { createEffect, createSignal } from "solid-js";
import { useAtom } from "solid-jotai";
import apiUrlAtom from "../../state";

type Anchor = NonNullable<DrawerProps["anchor"]>;

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
  const apiURL = useAtom(apiUrlAtom)[0];

  
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
      <Box sx={{ my: 2 }}>
        {/* tags */}
        <FormGroup>
          {allTags.map((v) => (
            <FormControlLabel
              control={
                <Checkbox
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
        </FormGroup>
      </Box>
      <List>
        {/* tab list */}
        {filteredTabs().map((tab) => (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                props.onTabSelect(tab.key);
                props.setOpen(false);
              }}
            >
              <ListItemIcon>{<InboxIcon />}</ListItemIcon>
              <ListItemText primary={tab["name"]} />
            </ListItemButton>
          </ListItem>
        ))}
        {theftData().map((data) => (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                props.onTheftData(data);
                props.setOpen(false);
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
    <>
      <Drawer
        ModalProps={{
          onBackdropClick: () => {
            props.setOpen(false);
          },
        }}
        anchor={anchor}
        open={open()}
        sx={{ zIndex: 9999 }}
      >
        {list(anchor)}
      </Drawer>
    </>
  );
}
