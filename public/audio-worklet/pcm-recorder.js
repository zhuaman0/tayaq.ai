/**
 * PCM16 recorder AudioWorkletProcessor.
 *
 * Captures Float32 audio from the microphone, downsamples to 16kHz,
 * converts to PCM16 (Int16Array), and posts batches to the main thread.
 *
 * Gemini Live expects raw PCM16 at 16kHz, mono, little-endian, base64-encoded.
 */
class PCMRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.targetSampleRate = 16000
    this.sourceSampleRate = sampleRate // global, set by AudioContext
    this.ratio = this.sourceSampleRate / this.targetSampleRate
    // ~120ms batch at 16kHz = 1920 samples
    this.batchSize = 1920
    this.buffer = new Int16Array(this.batchSize)
    this.bufferIndex = 0
    this.resamplePosition = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true
    const channel = input[0] // mono only — first channel

    for (let i = 0; i < channel.length; i++) {
      // Simple linear resampling: pick samples at the target rate ratio
      this.resamplePosition += 1
      if (this.resamplePosition < this.ratio) continue
      this.resamplePosition -= this.ratio

      // Float32 [-1, 1] → Int16 [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, channel[i]))
      this.buffer[this.bufferIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff

      if (this.bufferIndex >= this.batchSize) {
        // Send the batch to the main thread
        this.port.postMessage(this.buffer.buffer.slice(0))
        this.bufferIndex = 0
      }
    }

    return true
  }
}

registerProcessor('pcm-recorder', PCMRecorder)
