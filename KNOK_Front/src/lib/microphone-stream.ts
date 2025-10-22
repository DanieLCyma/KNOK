export default class MicrophoneStream {
  private bufferSize: number;
  private inputChannels: number;
  private outputChannels: number;
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private eventTarget = new EventTarget();

  constructor(opts?: {
    bufferSize?: number;
    inputChannels?: number;
    outputChannels?: number;
  }) {
    this.bufferSize = opts?.bufferSize ?? 4096;
    this.inputChannels = opts?.inputChannels ?? 1;
    this.outputChannels = opts?.outputChannels ?? 1;
  }

  async setStream(mediaStream: MediaStream) {
    this.stream = mediaStream;
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.context.createMediaStreamSource(mediaStream);
    this.scriptProcessor = this.context.createScriptProcessor(
      this.bufferSize,
      this.inputChannels,
      this.outputChannels
    );

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.context.destination);

    this.scriptProcessor.onaudioprocess = (e) => {
      const raw = e.inputBuffer.getChannelData(0);
      const float32Array = new Float32Array(raw);
      this.eventTarget.dispatchEvent(new CustomEvent("data", { detail: float32Array }));
    };
  }

  stop() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.scriptProcessor?.disconnect();
    if (this.context && this.context.state !== "closed") {
      this.context.close();
    }
  }

  destroy() {
    this.stop();
  }

  [Symbol.asyncIterator]() {
    const queue: Float32Array[] = [];
    let resolveNext: ((value: IteratorResult<Float32Array>) => void) | null = null;

    this.eventTarget.addEventListener("data", (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (resolveNext) {
        resolveNext({ value: data, done: false });
        resolveNext = null;
      } else {
        queue.push(data);
      }
    });

    return {
      next: (): Promise<IteratorResult<Float32Array>> =>
        queue.length > 0
          ? Promise.resolve({ value: queue.shift()!, done: false })
          : new Promise((resolve) => {
              resolveNext = resolve;
            }),
    };
  }

  static toRaw(chunk: Float32Array): Float32Array {
    return chunk;
  }
}