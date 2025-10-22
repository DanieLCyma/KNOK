class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    // inputs[0][0]는 Float32Array(마이크 채널 입력)
    const inputChannel = inputs[0][0];
    if (inputChannel) {
      // main thread로 데이터 전송 (예: React에서 받을 수 있음)
      this.port.postMessage(inputChannel);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);