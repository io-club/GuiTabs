import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  TextField,
} from "@suid/material";
import { apiUrlAtom, apiStorageAtom, enableAPI } from "../../state";
import { createEffect, createSignal } from "solid-js";
import { useAtom } from "solid-jotai";
import { Delete } from "@suid/icons-material";

interface APIManagerDialogProps {
  openHook: [boolean, (open: boolean) => void];
  adding?: string;
}

export function APIManagerDialog(props: APIManagerDialogProps) {
  const [internalURL, setInternalURL] = createSignal(props.adding ?? "");

  const [api, setAPI] = useAtom(apiStorageAtom);
  const [apiURL, setApiURL] = useAtom(apiUrlAtom);

  createEffect(() => {
    if (props.adding !== undefined) {
      setInternalURL(props.adding);
    }
  });

  return (
    <Dialog
      open={props.openHook[0]}
      fullWidth
      onClose={() => props.openHook[1](false)}
    >
      <DialogTitle>设置 API URL</DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            "flex-direction": "row",
            gap: "1rem",
            "align-items": "flex-end",
          }}
        >
          <TextField
            label="URL"
            value={internalURL()}
            onChange={(e) => setInternalURL(e.target.value)}
            fullWidth
            size="small"
            style={{
              "margin-top": "0.5em",
            }}
          />
          <Button
            onClick={() => {
              enableAPI(internalURL(), [api(), setAPI], [apiURL(), setApiURL]);
            }}
            variant="contained"
            size="small"
            sx={{ height: "40px" }}
            disabled={internalURL() === ""}
          >
            增加
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "margin-top": "1rem",
          }}
        >
          {(JSON.parse(api() ?? "[]") as string[]).map((url) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "row",
                gap: "1rem",
                "align-items": "flex-end",
                "justify-content": "space-between",
              }}
            >
              <FormControl>
                <FormControlLabel
                  control={
                    <Radio
                      checked={url === apiURL()}
                      onChange={() => {
                        enableAPI(url, [api(), setAPI], [apiURL(), setApiURL]);
                      }}
                    />
                  }
                  label={url}
                />
              </FormControl>
              <IconButton
                onClick={() => {
                  const storageArray = JSON.parse(api()) as string[];
                  storageArray.splice(storageArray.indexOf(url), 1);
                  setAPI(JSON.stringify(storageArray));
                }}
              >
                <Delete />
              </IconButton>
            </div>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            props.openHook[1](false);
          }}
        >
          好了
        </Button>
      </DialogActions>
    </Dialog>
  );
}
