class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    // inputs[0][0] 은 Float32Array
    const inputChannel = inputs[0][0];
    if (inputChannel) {
      // main thread 로 전송
      this.port.postMessage(inputChannel);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
