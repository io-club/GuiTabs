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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from "@suid/material";
import { useAtom } from "solid-jotai";
import apiUrlAtom from "../../state";

interface FormValues {
  url: string;
  name: string;
  mode: number;
  skip: number;
  invert: boolean;
  similarity: number;
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
    invert: false,
    similarity: 0.85,
  });
  const [lock, setLock] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [done, setDone] = createSignal(false);
  const [similarityNotValid, setSimilarityNotValid] = createSignal(false);

  const apiURL = useAtom(apiUrlAtom)[0];

  const handleSubmit = () => {
    setLock(true);
    fetch(apiURL(), {
      method: "POST",
      body: JSON.stringify(values()),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.status !== 200) {
          setError("拉了");
        }
        setDone(true);
        setLock(false);
        props.onSubmit();
      })
      .catch((error) => {
        console.error("Error:", error);
        setLock(false);
      });
  };

  return (
    <>
      <DialogTitle>偷</DialogTitle>
      <DialogContent
        style={{ "flex-direction": "column", display: "flex", gap: "1rem" }}
      >
        {error() !== null && <Alert severity="error">{error()}</Alert>}
        {done() && (
          <Alert
            severity="success"
            action={
              <Button
                onClick={() => {
                  window.location.reload();
                }}
              >
                刷新
              </Button>
            }
          >
            好了
          </Alert>
        )}
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
          <FormControl>
            <TextField
              label="相似度"
              error={similarityNotValid()}
              defaultValue={0.85}
              onChange={(e) => {
                if (Number.isNaN(parseFloat(e.target.value))) {
                  setSimilarityNotValid(true);
                  return;
                }
                const n = parseFloat(e.target.value);
                if (n < 0 || n > 1) {
                  setSimilarityNotValid(true);
                  return;
                }
                setSimilarityNotValid(false);
                setValues({
                  ...values(),
                  similarity: n,
                });
              }}
            />
          </FormControl>
          <TextField
            label="跳过帧数"
            type="number"
            value={values().skip}
            defaultValue={0}
            onChange={(e) =>
              setValues({ ...values(), skip: parseInt(e.target.value) })
            }
          />
        </div>
        <FormControl sx={{ ml: 1 }} size="small">
          <FormControlLabel
            control={
              <Checkbox
                onChange={(e) => {
                  setValues({
                    ...values(),
                    invert: e.target.checked,
                  });
                }}
              />
            }
            label="反转"
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.close}>取消</Button>
        <Button
          disabled={
            lock() ||
            values().url === "" ||
            values().name === "" ||
            similarityNotValid()
          }
          onClick={() => handleSubmit()}
          startIcon={lock() && <CircularProgress size={16} />}
        >
          提交
        </Button>
      </DialogActions>
    </>
  );
}
