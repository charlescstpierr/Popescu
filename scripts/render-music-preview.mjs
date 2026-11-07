import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { MUSIC_SCORE, getMusicVoice, CHIP_WAVES, createChipNoise, getMusicStepEvents } from '../dist/audio.js';

const frequency = note => 440 * 2 ** ((note - 69) / 12);
const TABLE_SIZE = 2048;
const pulseCache = new Map();

function pulseTable(duty, harmonics, rolloff = 0) {
  const key = `${duty}:${harmonics}:${rolloff}`;
  if (pulseCache.has(key)) return pulseCache.get(key);
  const table = new Float32Array(TABLE_SIZE);
  let peak = 0;
  for (let i = 0; i < TABLE_SIZE; i++) {
    let value = 0;
    for (let h = 1; h <= harmonics; h++) value += 4 * Math.sin(Math.PI * h * duty) / (Math.PI * h) * Math.exp(-rolloff * (h - 1)) * Math.cos(2 * Math.PI * h * i / TABLE_SIZE);
    table[i] = value; peak = Math.max(peak, Math.abs(value));
  }
  for (let i = 0; i < TABLE_SIZE; i++) table[i] /= peak;
  pulseCache.set(key, table);
  return table;
}

function envelope(time, duration, level, preset) {
  const attack = Math.min(preset.attack ?? 0.003, duration * 0.2);
  const decay = Math.min(preset.decay ?? duration * 0.55, duration * 0.3);
  const release = Math.min(preset.release ?? 0.03, duration * 0.3);
  const sustain = Math.max(0.0002, level * (preset.sustain ?? 0.18));
  const releaseAt = Math.max(attack + decay, duration - release);
  if (time < attack) return 0.0001 * (level / 0.0001) ** (time / attack);
  if (time < attack + decay) return level * (sustain / level) ** ((time - attack) / decay);
  if (time < releaseAt) return sustain;
  return sustain * (0.0001 / sustain) ** ((time - releaseAt) / Math.max(0.0001, duration - releaseAt));
}

// This is an audition renderer, not a second score. All events and instrument
// envelopes come from the exact exports consumed by Web Audio in the game.
export function renderMusic(scene = 'battle', bars = 16, intensity = 0.65, sampleRate = 44100) {
  if (!Object.hasOwn(MUSIC_SCORE, scene)) throw new Error('scene must be menu or battle');
  if (!Number.isInteger(bars) || bars < 1 || bars > 64) throw new Error('bars must be an integer from 1 to 64');
  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 1) throw new Error('intensity must be from 0 to 1');
  const stepLength = 60 / MUSIC_SCORE[scene].bpm / 4;
  const duration = bars * 16 * stepLength;
  const samples = new Float32Array(Math.ceil((duration + 0.2) * sampleRate));
  const noise = createChipNoise(sampleRate, sampleRate);
  const events = [];
  for (let step = 0; step < bars * 16; step++) {
    for (const event of getMusicStepEvents(scene, step, intensity)) {
      events.push({ ...event, time: step * stepLength });
      const preset = getMusicVoice(scene, event.instrument);
      const wave = event.wave || preset.wave;
      const initialFrequency = event.note === undefined ? 0 : frequency(event.note);
      const pulse = CHIP_WAVES[wave];
      const table = pulse ? pulseTable(pulse.duty, Math.min(pulse.harmonics, Math.floor(sampleRate / 2 / initialFrequency)), pulse.rolloff) : null;
      const start = Math.round(step * stepLength * sampleRate);
      const length = Math.ceil(event.duration * sampleRate);
      const ratio = event.endNote === undefined ? 1 : frequency(event.endNote) / initialFrequency;
      const alpha = 1 / (1 + 2 * Math.PI * Math.min(preset.cutoff || 1000, sampleRate * 0.45) / sampleRate);
      let phase = 0, lastNoise = 0, filtered = 0;
      for (let i = 0; i < length && start + i < samples.length; i++) {
        const time = i / sampleRate;
        let value, gain;
        if (preset.noise) {
          const raw = noise[i % noise.length];
          filtered = alpha * (filtered + raw - lastNoise);
          lastNoise = raw;
          value = filtered;
          gain = event.level * (0.0001 / event.level) ** (time / event.duration);
        } else {
          let hz = initialFrequency * ratio ** (time / event.duration);
          if (preset.vibrato && event.duration > 0.16 && time >= 0.08) {
            const tick = 0.08 + Math.floor((time - 0.08) / 0.035) * 0.035;
            hz *= 2 ** (Math.sin(tick * 36) * preset.vibrato / 1200);
          }
          phase = (phase + hz / sampleRate) % 1;
          value = table ? table[Math.floor(phase * TABLE_SIZE)] : wave === 'triangle' ? 2 / Math.PI * Math.asin(Math.sin(phase * 2 * Math.PI)) : wave === 'square' ? (phase < 0.5 ? 1 : -1) : Math.sin(phase * 2 * Math.PI);
          gain = envelope(time, event.duration, event.level, preset);
        }
        samples[start + i] += value * gain;
      }
    }
  }
  let rawPeak = 0;
  for (const value of samples) rawPeak = Math.max(rawPeak, Math.abs(value));
  // Auditions are normalized independently of the user's saved game volume.
  const normalization = 0.86 / Math.max(0.001, rawPeak);
  let peak = 0, power = 0;
  for (let i = 0; i < samples.length; i++) {
    const fade = Math.min(1, i / (sampleRate * 0.003), (samples.length - i - 1) / (sampleRate * 0.15));
    samples[i] *= normalization * fade;
    peak = Math.max(peak, Math.abs(samples[i])); power += samples[i] ** 2;
  }
  return { samples, sampleRate, events, duration, peak, rms: Math.sqrt(power / samples.length) };
}

export function encodeWav(samples, sampleRate) {
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return wav;
}

export function measureAudio(samples, sampleRate) {
  let peak = 0, power = 0, clipped = 0;
  const windows = [];
  const size = Math.round(sampleRate * 0.01);
  for (let start = 0; start < samples.length; start += size) {
    let windowPeak = 0, windowPower = 0;
    const end = Math.min(samples.length, start + size);
    for (let i = start; i < end; i++) {
      if (!Number.isFinite(samples[i])) throw new Error('non-finite audio sample');
      const value = Math.abs(samples[i]);
      peak = Math.max(peak, value); windowPeak = Math.max(windowPeak, value);
      power += value * value; windowPower += value * value;
      if (value >= 1) clipped++;
    }
    windows.push({ time: start / sampleRate, peak: windowPeak, rms: Math.sqrt(windowPower / (end - start)) });
  }
  return { peak, rms: Math.sqrt(power / samples.length), clipped, windows };
}

// Optional Chromium QA. This runs AudioManager's real Web Audio graph without
// audition normalization, including its gain buses, envelopes and voice limits.
export async function renderAudioPreview({ events = [], seconds = 4, music = true, volume = 1, sourcePath = fileURLToPath(new URL('../dist/audio.js', import.meta.url)) } = {}) {
  if (!Number.isFinite(seconds) || seconds < 0.08 || seconds > 120) throw new Error('seconds must be from 0.08 to 120');
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new Error('volume must be from 0 to 1');
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const page = await browser.newPage();
    const source = fs.readFileSync(sourcePath, 'utf8');
    const result = await page.evaluate(async ({ source, events, seconds, music, volume }) => {
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      const { AudioManager } = await import(url);
      URL.revokeObjectURL(url);
      const sampleRate = 44100;
      const context = new OfflineAudioContext(1, Math.ceil(seconds * sampleRate), sampleRate);
      let created = 0, maximumVoices = 0, maximumSfxVoices = 0;
      const adapter = new Proxy(context, {
        get(target, key) {
          // Rendering is advanced explicitly at 40 ms checkpoints below.
          if (key === 'state') return 'running';
          if (['resume', 'suspend', 'close'].includes(key)) return () => Promise.resolve();
          if (['createOscillator', 'createBufferSource'].includes(key)) return (...args) => { created++; return target[key](...args); };
          const value = target[key];
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
      globalThis.AudioContext = class { constructor() { return adapter; } };
      let seed = 42;
      Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const audio = new AudioManager({ volume });
      audio.setScene('battle');
      await audio.unlock();
      audio._clearClock();
      if (!music) { audio._stopVoices(); audio._musicBus.gain.value = 0; }
      const pending = [...events].sort((a, b) => a.at - b.at);
      const tick = () => {
        if (music) audio._schedule();
        while (pending.length && pending[0].at <= context.currentTime + 0.0001) {
          const event = pending.shift();
          for (let i = 0; i < (event.count || 1); i++) audio.sfx(event.name);
        }
        maximumVoices = Math.max(maximumVoices, audio._voices.size);
        maximumSfxVoices = Math.max(maximumSfxVoices, [...audio._voices].filter(voice => voice.kind === 'sfx').length);
      };
      tick();
      let pause = context.suspend(0.04);
      const rendering = context.startRendering();
      for (let step = 1; step * 0.04 < seconds; step++) {
        await pause;
        tick();
        if ((step + 1) * 0.04 < seconds) pause = context.suspend((step + 1) * 0.04);
        await context.resume();
      }
      const buffer = await rendering;
      const samples = Array.from(buffer.getChannelData(0));
      audio.destroy();
      return { samples, sampleRate, created, maximumVoices, maximumSfxVoices };
    }, { source, events, seconds, music, volume });
    return { ...result, samples: Float32Array.from(result.samples), ...measureAudio(result.samples, result.sampleRate) };
  } finally {
    await browser.close();
  }
}

export const SOUND_PREVIEWS = {
  shots: { seconds: 2.4, music: false, events: Array.from({ length: 10 }, (_, i) => ({ at: 0.16 + i * 0.16, name: 'shoot' })) },
  kills: { seconds: 2.4, music: false, events: Array.from({ length: 8 }, (_, i) => ({ at: 0.16 + i * 0.24, name: 'kill', count: 300 })) },
  pickups: { seconds: 4, music: false, events: [
    ...Array.from({ length: 9 }, (_, i) => ({ at: 0.16 + i * 0.16, name: 'collect' })),
    { at: 2.24, name: 'collect' }, { at: 2.72, name: 'coin' }, { at: 3.12, name: 'coin' },
  ] },
  hurt: { seconds: 2, music: false, events: [{ at: 0.16, name: 'kill' }, { at: 0.64, name: 'hit' }, { at: 1.28, name: 'hit' }] },
  stingers: { seconds: 6, music: false, events: [{ at: 0.16, name: 'level' }, { at: 1.28, name: 'chest' }, { at: 2.4, name: 'victory' }, { at: 4.16, name: 'defeat' }] },
  music: { seconds: 8, music: true, events: [] },
  combat: { seconds: 8, music: true, events: [
    ...Array.from({ length: 42 }, (_, i) => ({ at: 0.16 + i * 0.16, name: 'shoot' })),
    ...Array.from({ length: 26 }, (_, i) => ({ at: 0.24 + i * 0.24, name: 'kill', count: 300 })),
    ...Array.from({ length: 34 }, (_, i) => ({ at: 0.32 + i * 0.16, name: 'collect' })),
    { at: 1.6, name: 'coin' }, { at: 2.4, name: 'hit' }, { at: 3.2, name: 'truth' },
    { at: 4, name: 'rooster' }, { at: 4.8, name: 'hit' }, { at: 5.6, name: 'level' },
  ] },
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
    return pairs;
  }, []));
  const scene = args.scene || 'battle';
  if (args.effects) {
    const scenario = SOUND_PREVIEWS[args.effects];
    if (!scenario) throw new Error(`effects must be one of ${Object.keys(SOUND_PREVIEWS).join(', ')}`);
    const result = await renderAudioPreview({ ...scenario, volume: Number(args.volume ?? 1), ...(args.source ? { sourcePath: path.resolve(args.source) } : {}) });
    const output = path.resolve(args.out || `qa-output/toma-${args.effects}.wav`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, encodeWav(result.samples, result.sampleRate));
    const { samples, ...measurements } = result;
    fs.writeFileSync(output.replace(/\.wav$/, '') + '.json', JSON.stringify(measurements, null, 2) + '\n');
    const { windows, ...summary } = measurements;
    console.log(JSON.stringify({ output, ...summary }));
    process.exitCode = result.clipped ? 1 : 0;
  } else {
    const result = renderMusic(scene, Number(args.bars || 16), Number(args.intensity || 0.65));
    const output = path.resolve(args.out || `qa-output/toma-${scene}-preview.wav`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, encodeWav(result.samples, result.sampleRate));
    console.log(JSON.stringify({ output, scene, seconds: result.duration, notesAndDrums: result.events.length, peak: result.peak, rms: result.rms }));
  }
}
