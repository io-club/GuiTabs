import { createSignal } from "solid-js";
import {
  TextField,
  Select,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
} from "@suid/material";
import { useAtom } from "solid-jotai";
import apiUrlAtom from "../../state";

interface FormValues {
  url: string;
  name: string;
  mode: number;
  skip: number;
}

interface FormProps {
  onSubmit: () => void;
  close: () => void;
}

export function Thief(props: FormProps) {
  const [values, setValues] = createSignal<FormValues>({
    url: "",
    name: "",
    mode: 3,
    skip: 0,
  });

  const apiURL = useAtom(apiUrlAtom)[0];

  const handleSubmit = () => {
    fetch(apiURL(), {
      method: "POST",
      body: JSON.stringify(values()),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(() => {
        props.onSubmit();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <>
      <DialogTitle>偷</DialogTitle>
      <DialogContent
        style={{ "flex-direction": "column", display: "flex", gap: "1rem" }}
      >
        <FormControl style={{ "margin-top": "0.5em" }}>
          <TextField
            label="URL"
            value={values().url}
            onChange={(e) => setValues({ ...values(), url: e.target.value })}
            fullWidth
          />
        </FormControl>
        <FormControl>
          <TextField
            label="名字"
            value={values().name}
            onChange={(e) => setValues({ ...values(), name: e.target.value })}
          />
        </FormControl>
        <div style={{ display: "flex", "flex-direction": "row", gap: "1rem" }}>
          <FormControl fullWidth>
            <InputLabel>模式</InputLabel>
            <Select
              label="模式"
              value={values().mode}
              onChange={(e) => setValues({ ...values(), mode: e.target.value })}
              defaultValue={3}
            >
              <MenuItem value={1}>均值</MenuItem>
              <MenuItem value={2}>方差</MenuItem>
              <MenuItem value={3}>色彩</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="跳过帧数"
            type="number"
            value={values().skip}
            onChange={(e) =>
              setValues({ ...values(), skip: parseInt(e.target.value) })
            }
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.close}>取消</Button>
        <Button onClick={() => handleSubmit()}>提交</Button>
      </DialogActions>
    </>
  );
}
