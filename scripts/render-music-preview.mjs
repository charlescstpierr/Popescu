import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
    if (value.startsWith('--')) pairs.push([value.slice(2), all[index + 1]]);
    return pairs;
  }, []));
  const scene = args.scene || 'battle';
  const result = renderMusic(scene, Number(args.bars || 16), Number(args.intensity || 0.65));
  const output = path.resolve(args.out || `qa-output/toma-${scene}-preview.wav`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, encodeWav(result.samples, result.sampleRate));
  console.log(JSON.stringify({ output, scene, seconds: result.duration, notesAndDrums: result.events.length, peak: result.peak, rms: result.rms }));
}
