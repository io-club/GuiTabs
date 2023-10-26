import MailIcon from "@suid/icons-material/Mail";
import InboxIcon from "@suid/icons-material/MoveToInbox";
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@suid/material";
import { DrawerProps } from "@suid/material/Drawer";
import { createMutable } from "solid-js/store";

type Anchor = NonNullable<DrawerProps["anchor"]>;

export default function TemporaryDrawer(props) {
  const state = createMutable<{
    [K in Anchor]: boolean;
  }>({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  const toggleDrawer =
    (anchor: Anchor, open: boolean) => (event: MouseEvent | KeyboardEvent) => {
      if (event.type === "keydown") {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "Tab" || keyboardEvent.key === "Shift")
          return;
      }
      state[anchor] = open;
    };

  const list = (anchor: Anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 250 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List>
        <List>
          {Object.entries(props["tabs"]).map(([key, value]) => (
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  props["onClick"](key);
                }}
              >
                <ListItemIcon>{<InboxIcon />}</ListItemIcon>
                <ListItemText primary={value["name"]} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </List>
    </Box>
  );
  const anchor: Anchor = "left";
  return (
    <div>
      <Button onClick={toggleDrawer(anchor, true)}>list</Button>
      <Drawer
        anchor={anchor}
        open={state[anchor]}
        sx={{ zIndex: 9999 }}
        onClose={toggleDrawer(anchor, false)}
      >
        {list(anchor)}
      </Drawer>
    </div>
  );
}
