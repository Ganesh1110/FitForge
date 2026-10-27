const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, durationSeconds, generateSample) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * blockAlign;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // audioFormat 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // PCM data
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generateSample(t, i, totalSamples)));
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const soundsDir = path.join(__dirname, '../assets/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// 1. Countdown beep: 880Hz with soft exponential decay (150ms)
const beepWav = createWavBuffer(44100, 0.15, (t, i, total) => {
  const env = Math.exp(-t * 20);
  return Math.sin(2 * Math.PI * 880 * t) * env * 0.8;
});
fs.writeFileSync(path.join(soundsDir, 'beep.wav'), beepWav);

// 2. Chime gong: Multi-harmonic chord (523.25Hz, 659.25Hz, 783.99Hz, 1046.5Hz) with bell decay (750ms)
const chimeWav = createWavBuffer(44100, 0.75, (t, i, total) => {
  const env = Math.exp(-t * 4);
  const tone1 = Math.sin(2 * Math.PI * 523.25 * t);
  const tone2 = Math.sin(2 * Math.PI * 659.25 * t) * 0.7;
  const tone3 = Math.sin(2 * Math.PI * 783.99 * t) * 0.5;
  const tone4 = Math.sin(2 * Math.PI * 1046.50 * t) * 0.3;
  return (tone1 + tone2 + tone3 + tone4) * 0.3 * env;
});
fs.writeFileSync(path.join(soundsDir, 'chime.wav'), chimeWav);

// 3. Rest chime: Gentle low gong (440Hz -> 330Hz) (500ms)
const restWav = createWavBuffer(44100, 0.5, (t, i, total) => {
  const env = Math.exp(-t * 5);
  const freq = 440 - t * 150;
  return Math.sin(2 * Math.PI * freq * t) * env * 0.7;
});
fs.writeFileSync(path.join(soundsDir, 'rest.wav'), restWav);

console.log('Audio chime assets generated successfully in assets/sounds/');
