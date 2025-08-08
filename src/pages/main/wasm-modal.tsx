import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@suid/material";
import { createSignal, createEffect } from "solid-js";
import {
  WASI as BrowserWASI,
  WASIProcExit,
  File as WasiFile,
  OpenFile,
  ConsoleStdout,
} from "@bjorn3/browser_wasi_shim";

interface WasmModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------- Utilities ----------
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
function freqToNote(freqHz: number) {
  const n = 69 + 12 * Math.log2(freqHz / 440);
  const nearest = Math.round(n);
  const cents = Math.round((n - nearest) * 100);
  const name = NOTE_NAMES[((nearest % 12) + 12) % 12];
  const octave = Math.floor(nearest / 12) - 1;
  const refHz = 440 * Math.pow(2, (nearest - 69) / 12);
  return { name: `${name}${octave}`, refHz, cents };
}

function align(n: number, a: number): number {
  return (n + (a - 1)) & ~(a - 1);
}

type DftArrays = { freqs: Float32Array; mags: Float32Array };
function invokeDftWithInt16(
  instance: WebAssembly.Instance,
  samples: Int16Array,
): DftArrays | null {
  const memory = (instance.exports as any).memory as WebAssembly.Memory;
  const dft = (instance.exports as any).dft as Function | undefined;
  if (!(memory instanceof WebAssembly.Memory) || typeof dft !== "function")
    return null;

  const pageSize = 64 * 1024;
  const oldByteLen = memory.buffer.byteLength;
  const inputBytes = samples.length * 2; // Int16
  const rLenBytes = 2; // Int16
  const outCapacity = samples.length; // match frame size
  const outBytes = outCapacity * 4; // Float32 per array

  const totalNeeded = inputBytes + rLenBytes + 2 + align(outBytes * 2, 4);
  const additionalPages = Math.ceil(totalNeeded / pageSize) || 1;
  memory.grow(additionalPages);
  const buf = memory.buffer;

  const inPtr = oldByteLen;
  const rLenPtr = inPtr + inputBytes;
  const outFreqPtr = align(rLenPtr + rLenBytes, 4);
  const outMagPtr = outFreqPtr + outBytes;

  new Uint8Array(buf, inPtr, inputBytes).set(new Uint8Array(samples.buffer));
  new DataView(buf, rLenPtr, rLenBytes).setInt16(0, 0, true);
  new Uint8Array(buf, outFreqPtr, outBytes).fill(0);
  new Uint8Array(buf, outMagPtr, outBytes).fill(0);

  // dft(ptr, count, freqOut*, magOut*, r_len*)
  dft(inPtr, samples.length, outFreqPtr, outMagPtr, rLenPtr);

  const outLen = new DataView(buf, rLenPtr, rLenBytes).getInt16(0, true);
  const len = Math.max(0, Math.min(outLen, outCapacity));

  return {
    freqs: new Float32Array(buf, outFreqPtr, len),
    mags: new Float32Array(buf, outMagPtr, len),
  };
}

// ---------- Component ----------
export default function WasmModal(props: WasmModalProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  // simplified: no stdout/stderr/exports in UI
  const [wasmInstance, setWasmInstance] =
    createSignal<WebAssembly.Instance | null>(null);
  const [micActive, setMicActive] = createSignal(false);
  const [frameSize, setFrameSize] = createSignal(2048); // Better resolution for low freqs
  let audioContext: AudioContext | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let micStream: MediaStream | null = null;
  const [micSampleRate, setMicSampleRate] = createSignal<number | null>(null);
  const [effectiveMicSampleRate, setEffectiveMicSampleRate] = createSignal<
    number | null
  >(null);
  const [micProcessingStride, setMicProcessingStride] = createSignal<number>(1);
  const [micFrequencies, setMicFrequencies] = createSignal<number[] | null>(
    null,
  );
  const [micMainHz, setMicMainHz] = createSignal<number | null>(null);
  const [maxRow, setMaxRow] = createSignal<string | null>(null);
  let allTimeMaxMag = 0;
  const [currentFreqs, setCurrentFreqs] = createSignal<number[]>([]);
  const [currentMaxMag, setCurrentMaxMag] = createSignal<number | null>(null);

  const runWasiBinary = async () => {
    setLoading(true);
    setError(null);

    try {
      // Set up stdio capture
      let capturedStdout = "";
      let capturedStderr = "";
      const stdoutFd = ConsoleStdout.lineBuffered((line: string) => {
        capturedStdout += (capturedStdout ? "\n" : "") + line;
      });
      const stderrFd = ConsoleStdout.lineBuffered((line: string) => {
        capturedStderr += (capturedStderr ? "\n" : "") + line;
      });
      const stdinFd = new OpenFile(new WasiFile([]));

      const wasi = new BrowserWASI([], [], [stdinFd, stdoutFd, stderrFd]);

      const url = "/Listen.wasm";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
        );
      }
      const buf = await res.arrayBuffer();
      const { instance, module } = await WebAssembly.instantiate(buf, {
        wasi_snapshot_preview1: (wasi as any).wasiImport,
      } as any);

      setWasmInstance(instance as any);

      const names = WebAssembly.Module.exports(module).map((e) => e.name);
      if (!names.includes("_start")) {
        setError(
          "Module has no _start export. It may be a library (no WASI entrypoint).",
        );
        return;
      }

      // Start the process
      let code: number | null = null;
      try {
        code = (wasi as any).start(instance as any);
      } catch (e) {
        if (e instanceof WASIProcExit) {
          code = e.code;
        } else {
          throw e;
        }
      }
    } catch (err) {
      console.error("Failed to run WASI binary:", err);
      let message: string;
      if (err instanceof Error) {
        message = `${err.name}: ${err.message}\n${err.stack ?? ""}`;
      } else if (typeof err === "string") {
        message = err;
      } else if (err == null) {
        message = "Unknown error (no details)";
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          message = String(err);
        }
      }
      setError(message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    stopMic();
    props.onClose();
  };

  async function startMic() {
    if (micActive()) return;
    try {
      console.log("Starting mic with frame size:", frameSize());
      const TARGET_SAMPLE_RATE = 8000;
      audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setMicSampleRate(audioContext.sampleRate);

      const stride = Math.max(
        1,
        Math.round(audioContext.sampleRate / TARGET_SAMPLE_RATE),
      );
      setMicProcessingStride(stride);
      setEffectiveMicSampleRate(audioContext.sampleRate / stride);

      console.log(
        "Sample rate:",
        audioContext.sampleRate,
        "-> effective:",
        audioContext.sampleRate / stride,
        " (stride: ",
        stride,
        ")",
      );

      await audioContext.audioWorklet.addModule("/recorder.worklet.js");
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = audioContext.createMediaStreamSource(micStream);
      workletNode = new AudioWorkletNode(audioContext, "frame-processor");
      src.connect(workletNode);
      workletNode.connect(audioContext.destination);
      // Configure frame size after creation to avoid cloning issues in some browsers
      try {
        console.log("Sending frame size to worklet:", frameSize());
        workletNode.port.postMessage({
          command: "setConfig",
          frameSize: frameSize(),
          stride: stride,
        });
      } catch {}

      workletNode.port.onmessage = (e) => {
        const frame = e.data as Int16Array;
        console.log("Received frame:", frame?.length, "samples");
        if (!frame || frame.length <= 0) return;
        callDftWithInt16(frame);
      };

      setMicActive(true);
    } catch (err) {
      console.error("Mic start error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to start microphone: ${msg}`);
      stopMic();
    }
  }

  function stopMic() {
    if (workletNode) {
      try {
        workletNode.disconnect();
      } catch {}
      workletNode = null;
    }
    if (audioContext) {
      try {
        audioContext.close();
      } catch {}
      audioContext = null;
    }
    if (micStream) {
      for (const t of micStream.getTracks()) {
        try {
          t.stop();
        } catch {}
      }
      micStream = null;
    }
    setMicActive(false);
  }

  function callDftWithInt16(samples: Int16Array) {
    console.log("callDftWithInt16 called with", samples.length, "samples");
    const instance = wasmInstance();
    if (!instance) return;
    try {
      const result = invokeDftWithInt16(instance, samples);
      console.log(
        "DFT result:",
        result ? `${result.freqs.length} bins` : "null",
      );
      if (!result) return;

      const list = Array.from(result.freqs);
      setMicFrequencies(list);
      const sr = effectiveMicSampleRate();
      if (sr && list.length > 0) {
        // pick by max magnitude
        let maxIdx = 0;
        let maxMag = result.mags[0];
        for (let i = 1; i < result.mags.length; i++) {
          if (result.mags[i] > maxMag) {
            maxMag = result.mags[i];
            maxIdx = i;
          }
        }
        if (maxMag > allTimeMaxMag) allTimeMaxMag = maxMag;
        setCurrentMaxMag(maxMag);
        const raw = list[maxIdx] * sr;
        console.log(
          "Max frequency:",
          raw.toFixed(1),
          "Hz, magnitude:",
          maxMag.toFixed(3),
        );
        const alpha = 0.25;
        const prev = micMainHz();
        const smooth = prev == null ? raw : alpha * raw + (1 - alpha) * prev;
        setMicMainHz(smooth);
        // Threshold against all-time max (20%)
        // Use a more lenient threshold for low frequencies
        const threshold =
          allTimeMaxMag > 0 ? 0.1 * allTimeMaxMag : maxMag * 0.3;
        if (maxMag < threshold) {
          setMaxRow(null);
          setCurrentFreqs([]);
        } else {
          // Find all frequencies that pass the threshold
          const passingFreqs: number[] = [];
          const passingRows: string[] = [];

          for (let i = 0; i < result.mags.length; i++) {
            // More lenient threshold for low frequencies (first 20% of bins)
            const binThreshold =
              i < result.mags.length * 0.2 ? threshold * 0.5 : threshold;
            if (result.mags[i] >= binThreshold) {
              const freq = list[i] * sr;
              passingFreqs.push(freq);
              const { name, refHz, cents } = freqToNote(freq);
              passingRows.push(
                `${i}: ${freq.toFixed(1)} Hz  →  ${name} (${refHz.toFixed(1)} Hz, ${cents >= 0 ? "+" : ""}${cents} cents)`,
              );
            }
          }

          setCurrentFreqs(passingFreqs);
          setMaxRow(passingRows.length > 0 ? passingRows.join("\n") : null);
        }
      } else {
        setMicMainHz(null);
        setMaxRow(null);
        setCurrentFreqs([]);
      }
    } catch (e) {
      // ignore frame errors
      console.error("DFT error:", e);
    }
  }

  // Auto-run exactly when the modal opens
  createEffect(() => {
    if (props.open) {
      runWasiBinary();
    }
  });

  // Generate note frequencies for the progress bar
  const MIN_HZ = 50;
  const MAX_HZ = 880; // Truncate to A5 for better focus on guitar range

  function generateNoteTicks(minFreq = MIN_HZ, maxFreq = MAX_HZ) {
    const notes: Array<{
      freq: number;
      label: string;
      position: number;
      isOctave: boolean;
    }> = [];
    const startNote = 21; // A0
    const endNote = 87; // C8

    for (let note = startNote; note <= endNote; note++) {
      const freq = 440 * Math.pow(2, (note - 69) / 12);
      if (freq >= minFreq && freq <= maxFreq) {
        const noteIndex = note % 12;
        const noteName = NOTE_NAMES[noteIndex];
        const octave = Math.floor(note / 12) - 1;
        notes.push({
          freq,
          label: `${noteName}${octave}`,
          position:
            (Math.log2(freq) - Math.log2(minFreq)) /
            (Math.log2(maxFreq) - Math.log2(minFreq)),
          isOctave: noteIndex === 0, // Emphasize C notes as octave markers
        });
      }
    }
    return notes;
  }

  const noteTicks = generateNoteTicks();

  const guitarStandard: Array<{
    label: string;
    freq: number;
    position: number;
  }> = [
    { label: "E2", freq: 82.4069, position: 0 },
    { label: "A2", freq: 110.0, position: 0 },
    { label: "D3", freq: 146.832, position: 0 },
    { label: "G3", freq: 195.998, position: 0 },
    { label: "B3", freq: 246.942, position: 0 },
    { label: "E4", freq: 329.628, position: 0 },
  ].map((m) => ({
    ...m,
    position:
      (Math.log2(m.freq) - Math.log2(MIN_HZ)) /
      (Math.log2(MAX_HZ) - Math.log2(MIN_HZ)),
  }));

  // Calculate frequency resolution for given frame size and sample rate
  function getFreqResolution(
    frameSize: number,
    sampleRate: number = 44100,
  ): number {
    return sampleRate / frameSize;
  }

  return (
    <Dialog open={props.open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>听</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {loading() && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Running /Listen.wasm…</Typography>
            </Box>
          )}

          {error() && <Alert severity="error">{error()}</Alert>}

          {!loading() && !error() && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  fontFamily: "monospace",
                  bgcolor: "grey.100",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                <div>
                  {wasmInstance() ? "WASM ready" : "Loading…"}
                  {" · "}
                  {micActive() ? "Listening" : "Idle"}
                </div>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Resolution:{" "}
                    {effectiveMicSampleRate()
                      ? getFreqResolution(
                          frameSize(),
                          effectiveMicSampleRate(),
                        ).toFixed(1)
                      : "--"}{" "}
                    Hz
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Sample rate:{" "}
                    {effectiveMicSampleRate()
                      ? `${(effectiveMicSampleRate() || 0).toFixed(0)} Hz (${micSampleRate()!.toFixed(0)} Hz / ${micProcessingStride()})`
                      : "--"}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 1,
                  fontFamily: "monospace",
                  bgcolor: "grey.100",
                  p: 2,
                  borderRadius: 1,
                  maxHeight: "240px",
                  overflow: "auto",
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Dominant frequency:{" "}
                  {micMainHz() ? `${micMainHz().toFixed(1)} Hz` : "--"}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      position: "relative",
                      height: 40,
                      bgcolor: "white",
                      borderRadius: 1,
                      p: 0.5,
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {/* Note ticks (semitones, emphasize octaves) */}
                    {noteTicks.map((tick) => (
                      <Box
                        sx={{
                          position: "absolute",
                          left: `${tick.position * 100}%`,
                          top: 0,
                          height: "100%",
                          width: tick.isOctave ? 2 : 1,
                          bgcolor: tick.isOctave ? "grey.600" : "white",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "8px",
                          color: "grey.600",
                        }}
                      >
                        {tick.isOctave && (
                          <Typography
                            variant="caption"
                            sx={{
                              transform: "translateX(-100%)",
                              writingMode: "vertical-rl",
                              textOrientation: "mixed",
                              fontSize: "8px",
                              lineHeight: 1,
                            }}
                          >
                            {tick.label}
                          </Typography>
                        )}
                      </Box>
                    ))}

                    {/* Standard guitar tuning markers */}
                    {guitarStandard.map((mark) => (
                      <>
                        <Box
                          sx={{
                            position: "absolute",
                            left: `${mark.position * 100}%`,
                            top: 0,
                            height: "100%",
                            width: 2,
                            bgcolor: "#1e88e5",
                            borderRadius: 1,
                            zIndex: 2,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            position: "absolute",
                            left: `${mark.position * 100}%`,
                            top: 0,
                            transform: "translateX(calc(-100% - 3px))",
                            color: "#1e88e5",
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            fontSize: "8px",
                            lineHeight: 1,
                            zIndex: 2,
                          }}
                        >
                          {mark.label}
                        </Typography>
                      </>
                    ))}

                    {/* Current frequency indicators */}
                    {currentFreqs().map((freq, index) => (
                      <Box
                        sx={{
                          position: "absolute",
                          left: `${((Math.log2(freq) - Math.log2(MIN_HZ)) / (Math.log2(MAX_HZ) - Math.log2(MIN_HZ))) * 100}%`,
                          top: 0,
                          height: "100%",
                          width: 3,
                          bgcolor: index === 0 ? "red" : "orange",
                          borderRadius: 1,
                          zIndex: 1,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                {/* Debug info for low frequency bins */}
                {micFrequencies() && micFrequencies()!.length > 0 && (
                  <Box
                    sx={{ mb: 1, fontSize: "10px", color: "text.secondary" }}
                  >
                    <Typography variant="caption">
                      Low freq bins:{" "}
                      {micFrequencies()!
                        .slice(0, 5)
                        .map(
                          (f, i) =>
                            `${i}:${(f * (effectiveMicSampleRate() || 48000)).toFixed(0)}Hz`,
                        )
                        .join(" ")}{" "}
                      | Max mag: {currentMaxMag()?.toFixed(3) || "N/A"} |
                      Threshold:{" "}
                      {allTimeMaxMag > 0
                        ? (0.1 * allTimeMaxMag).toFixed(3)
                        : "N/A"}
                    </Typography>
                  </Box>
                )}
              </Box>

              {wasmInstance() && (
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant={micActive() ? "outlined" : "contained"}
                    onClick={() => (micActive() ? stopMic() : startMic())}
                    disabled={!wasmInstance()}
                  >
                    {micActive() ? "Stop mic" : "Start mic"}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
