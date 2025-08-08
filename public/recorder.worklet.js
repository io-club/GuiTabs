class FrameProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.frameSize =
      (options &&
        options.processorOptions &&
        options.processorOptions.frameSize) ||
      1024;
    this.stride =
      (options &&
        options.processorOptions &&
        options.processorOptions.stride) ||
      1;
    console.log(
      "FrameProcessor created with frameSize:",
      this.frameSize,
      "stride:",
      this.stride,
    );
    this.index = 0;
    this.i16 = new Int16Array(this.frameSize);
    this.port.onmessage = (e) => {
      const data = e.data || {};
      let needsReset = false;
      if (data.command === "setConfig") {
        if (
          typeof data.frameSize === "number" &&
          data.frameSize !== this.frameSize
        ) {
          console.log("Worklet received frameSize:", data.frameSize);
          this.frameSize = data.frameSize | 0;
          needsReset = true;
        }
        if (typeof data.stride === "number" && data.stride !== this.stride) {
          console.log("Worklet received stride:", data.stride);
          this.stride = data.stride | 0;
        }
      }
      if (needsReset) {
        this.i16 = new Int16Array(this.frameSize);
        this.index = 0;
        console.log(
          "Worklet updated config to frameSize:",
          this.frameSize,
          "stride:",
          this.stride,
        );
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    // Use first channel
    const channelData = input[0];
    if (!channelData) return true;

    // Debug: log occasionally to see if processing is happening
    if (this.index === 0) {
      console.log(
        "Worklet processing, frameSize:",
        this.frameSize,
        "input length:",
        channelData.length,
        "stride:",
        this.stride,
      );
    }

    for (let i = 0; i < channelData.length; i += this.stride) {
      if (this.index >= this.frameSize) {
        console.log("Worklet sending frame of size:", this.frameSize);
        const out = this.i16;
        this.port.postMessage(out, [out.buffer]);
        this.i16 = new Int16Array(this.frameSize);
        this.index = 0;
      }

      let v = channelData[i];
      if (v > 1) v = 1;
      else if (v < -1) v = -1;
      this.i16[this.index] =
        v < 0 ? Math.round(v * 32768) : Math.round(v * 32767);
      this.index++;
    }

    return true;
  }
}

registerProcessor("frame-processor", FrameProcessor);
