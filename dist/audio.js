// Original score, "Égo en cavale". Playback and the WAV preview use these same notes.
const MIDI = (note) => 440 * 2 ** ((note - 69) / 12);
const clamp01 = value => Math.min(1, Math.max(0, value));
const MAX_VOICES = 32;
const MAX_SFX_VOICES = 14;
const LOOK_AHEAD = 0.14;
const STEP_MS = 40;

export const MUSIC_SCORE = Object.freeze({
  menu: { title: 'Miroir, mon beau miroir', bpm: 104, bars: 8 },
  battle: { title: 'Égo en cavale', bpm: 150, bars: 32 },
});

// [sixteenth-note position, MIDI note, length in sixteenth notes].
// A seven-note call returns verbatim. The answers share its syncopated rhythm.
const HOOK = [[0, 76, 2], [3, 83, 1], [4, 81, 2], [6, 79, 2], [8, 76, 2], [11, 79, 1], [12, 78, 3]];
const MAIN = [
  HOOK,
  [[0, 79, 3], [4, 76, 2], [7, 72, 1], [8, 76, 2], [11, 81, 1], [12, 79, 3]],
  HOOK,
  [[0, 74, 3], [4, 81, 2], [7, 78, 1], [8, 76, 2], [11, 78, 1], [12, 74, 3]],
  [[0, 76, 2], [3, 83, 1], [4, 81, 2], [6, 79, 2], [8, 83, 2], [11, 81, 1], [12, 79, 3]],
  [[0, 79, 3], [4, 84, 2], [7, 83, 1], [8, 81, 2], [11, 79, 1], [12, 76, 3]],
  [[0, 81, 2], [3, 76, 1], [4, 79, 2], [6, 76, 2], [8, 72, 2], [11, 74, 1], [12, 76, 3]],
  [[0, 75, 2], [3, 78, 1], [4, 81, 2], [6, 78, 2], [8, 75, 2], [11, 71, 1], [12, 75, 2], [15, 71, 0.8]],
];
const BRIDGE = [
  [[0, 71, 3], [4, 74, 1], [6, 76, 2], [8, 79, 3], [12, 76, 2], [15, 74, 0.8]],
  [[0, 72, 3], [4, 76, 1], [6, 79, 2], [8, 83, 3], [12, 81, 2], [15, 79, 0.8]],
  [[0, 74, 3], [4, 79, 1], [6, 83, 2], [8, 86, 3], [12, 83, 2], [15, 79, 0.8]],
  [[0, 78, 3], [4, 81, 1], [6, 78, 2], [8, 76, 3], [12, 74, 3]],
  [[0, 76, 2], [3, 81, 1], [4, 79, 2], [6, 76, 2], [8, 72, 3], [12, 76, 3]],
  [[0, 79, 2], [3, 83, 1], [4, 79, 2], [6, 76, 2], [8, 71, 3], [12, 76, 3]],
  [[0, 72, 2], [3, 76, 1], [4, 79, 2], [6, 83, 2], [8, 84, 2], [11, 83, 1], [12, 79, 3]],
  [[0, 78, 2], [3, 81, 1], [4, 87, 2], [6, 83, 2], [8, 81, 2], [11, 78, 1], [12, 75, 2], [15, 71, 0.8]],
];
const BATTLE_CHORDS = [[40, 43, 47], [36, 40, 43], [43, 47, 50], [38, 42, 45], [40, 43, 47], [36, 40, 43], [33, 36, 40], [35, 39, 42]];
const BRIDGE_CHORDS = [BATTLE_CHORDS[0], BATTLE_CHORDS[1], BATTLE_CHORDS[2], BATTLE_CHORDS[3], BATTLE_CHORDS[6], BATTLE_CHORDS[0], BATTLE_CHORDS[1], BATTLE_CHORDS[7]];
const MENU_CHORDS = [BATTLE_CHORDS[2], BATTLE_CHORDS[1], BATTLE_CHORDS[0], BATTLE_CHORDS[3], BATTLE_CHORDS[2], BATTLE_CHORDS[1], BATTLE_CHORDS[6], BATTLE_CHORDS[7]];
const BASS_RHYTHM = [[0, 0, 2.6], [3, 0, 0.8], [6, 7, 1.5], [8, 12, 2.4], [11, 7, 0.8], [14, 0, 1.5]];

export const CHIP_VOICES = Object.freeze({
  lead: { wave: 'pulse25', attack: 0.004, decay: 0.025, sustain: 0.72, release: 0.025, priority: 6, vibrato: 5 },
  harmony: { wave: 'pulse125', attack: 0.006, decay: 0.03, sustain: 0.55, release: 0.025, priority: 2 },
  bass: { wave: 'triangle', attack: 0.002, decay: 0.035, sustain: 0.64, release: 0.014, priority: 5 },
  bassClick: { wave: 'pulse25', attack: 0.001, decay: 0.018, sustain: 0.1, release: 0.012, priority: 2 },
  arp: { wave: 'pulse125', attack: 0.002, decay: 0.018, sustain: 0.26, release: 0.012, priority: 1 },
  stab: { wave: 'pulse25', attack: 0.002, decay: 0.025, sustain: 0.28, release: 0.02, priority: 1 },
  kick: { wave: 'sine', attack: 0.001, decay: 0.035, sustain: 0.25, release: 0.04, priority: 4 },
  snareBody: { wave: 'triangle', attack: 0.001, decay: 0.025, sustain: 0.12, release: 0.025, priority: 3 },
  snare: { noise: true, cutoff: 1450, priority: 4 },
  hat: { noise: true, cutoff: 6400, priority: 1 },
  openHat: { noise: true, cutoff: 5600, priority: 1 },
  tom: { wave: 'triangle', attack: 0.001, decay: 0.03, sustain: 0.2, release: 0.025, priority: 3 },
});

export function createChipNoise(length, sampleRate = 44100) {
  const samples = new Float32Array(length);
  const hold = Math.max(1, Math.round(sampleRate / 11025));
  let bits = 0x5a17, sample = 0;
  for (let i = 0; i < length; i++) {
    if (i % hold === 0) {
      bits ^= bits << 13; bits ^= bits >>> 17; bits ^= bits << 5;
      sample = ((bits >>> 0) % 4) / 1.5 - 1;
    }
    samples[i] = sample;
  }
  return samples;
}

export function getMusicStepEvents(scene, step, intensity = 0.35) {
  const battle = scene === 'battle';
  const score = MUSIC_SCORE[battle ? 'battle' : 'menu'];
  const tick = Math.floor(Math.max(0, Number(step) || 0)) % (score.bars * 16);
  const bar = Math.floor(tick / 16), at = tick % 16, section = Math.floor(bar / 8);
  const energy = Number.isFinite(intensity) ? clamp01(intensity) : 0.35;
  const length = 60 / score.bpm / 4;
  const bridge = battle && section === 1;
  const chord = (battle ? (bridge ? BRIDGE_CHORDS : BATTLE_CHORDS) : MENU_CHORDS)[bar % 8];
  const phrase = (bridge ? BRIDGE : MAIN)[bar % 8];
  const events = [];
  const add = (instrument, note, duration, level, extra = {}) => events.push({ instrument, ...(note === null ? {} : { note }), duration, level, ...extra });
  for (const [position, pitch, beats] of phrase) if (position === at) {
    const note = pitch - (battle ? 0 : 12);
    add('lead', note, length * beats * 0.94, battle ? 0.135 : 0.11, { wave: bridge || !battle ? 'pulse125' : 'pulse25' });
    if (battle && section >= 2 && at % 4 === 0) {
      const third = ({ 0: 4, 2: 4, 3: 3, 4: 3, 6: 3, 7: 4, 9: 3, 11: 3 })[note % 12] || 3;
      add('harmony', note + third, length * beats * 0.86, section === 3 ? 0.037 : 0.028, { pan: 0.12 });
    }
  }
  for (const [position, offset, beats] of BASS_RHYTHM) if (position === at && (battle || ![3, 11].includes(at))) {
    add('bass', chord[0] + offset + (battle ? 0 : 12), length * beats, at === 0 ? 0.17 : 0.135);
    if (battle && (at === 0 || at === 8)) add('bassClick', chord[0] + offset + 12, 0.045, 0.026);
  }
  const arpOn = battle ? (at % 4 === 2 || energy >= 0.35 && at % 2 === 0 || energy >= 0.75 && at % 2 === 1) : at % 4 === 2;
  if (arpOn) add('arp', chord[[0, 1, 2, 1, 0, 2, 1, 2][Math.floor(at / 2) % 8]] + 24, length * 0.64, battle ? 0.027 : 0.023, { pan: at % 4 ? -0.14 : 0.14 });
  if (battle && !bridge && (at === 2 || at === 10)) for (const note of chord) add('stab', note + 24, length * 0.9, 0.021, { pan: -0.08 });
  if (at === 0 || at === 8 || battle && (at === 6 || energy > 0.6 && at === 11)) add('kick', 49, 0.13, battle ? 0.19 : 0.11, { endNote: 25 });
  if (at === 12 || at === 4 && (!bridge || energy > 0.6)) {
    add('snare', null, 0.13, battle ? 0.105 : 0.045);
    add('snareBody', 52, 0.08, battle ? 0.065 : 0.035, { endNote: 39 });
  }
  if (battle ? at % 2 === 0 || energy > 0.7 : at % 4 === 2) add(at === 14 ? 'openHat' : 'hat', null, at === 14 ? 0.085 : 0.026, battle ? 0.022 : 0.013, { pan: 0.1 });
  if (battle && bar % 8 === 7 && at >= 12) {
    if (at === 14) add('snare', null, 0.065, 0.075);
    if (at === 13 || at === 15) add('tom', at === 13 ? 57 : 50, 0.1, 0.105, { endNote: at === 13 ? 45 : 38 });
  }
  // A low two-note brass wink at the 16-bar turnaround, not another lead to follow.
  if (battle && bar % 16 === 15 && (at === 10 || at === 11)) add('stab', at === 10 ? 59 : 63, 0.07, 0.055);
  return events;
}

const SFX_GAPS = { kill: 0.14, shoot: 0.09, heart: 0.14, collect: 0.1, coin: 0.12, gas: 0.65, hit: 0.17, truth: 0.4, click: 0.05, chest: 0.3, level: 0.6, victory: 1.5, defeat: 1.5, split: 0.7, rooster: 0.9 };
const IMPORTANT_SFX = new Set(['chest', 'level', 'victory', 'defeat', 'split', 'rooster']);

export class AudioManager {
  constructor({ enabled = true, volume = 0.5 } = {}) {
    this.enabled = Boolean(enabled);
    this.volume = Math.min(1, Math.max(0, Number(volume) || 0));
    this.scene = 'menu';
    this.intensity = 0.35;
    this.ducked = false;
    this.context = null;
    this._master = null;
    this._musicBus = null;
    this._sfxBus = null;
    this._noiseBuffer = null;
    this._pulseWaves = new Map();
    this._voices = new Set();
    this._lastSfx = new Map();
    this._clock = null;
    this._step = 0;
    this._cursors = { menu: 0, battle: 0 };
    this._musicScene = 'menu';
    this._nextStep = 0;
    this._stateToken = 0;
    this._unlocked = false;
    this._destroyed = false;
    this._sfxTokens = 8;
    this._sfxTokenTime = 0;
  }

  unlock() {
    if (this._destroyed) return Promise.resolve(false);
    if (!this.context) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return Promise.resolve(false);
      try {
        this.context = new Context();
        this._master = this.context.createGain();
        this._musicBus = this.context.createGain();
        this._sfxBus = this.context.createGain();
        this._master.gain.value = this.volume * 0.7;
        this._musicBus.gain.value = this.ducked ? 0.39 : 0.76;
        this._sfxBus.gain.value = 0.44;
        this._musicBus.connect(this._master);
        this._sfxBus.connect(this._master);
        this._master.connect(this.context.destination);
        this._noiseBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        this._noiseBuffer.getChannelData(0).set(createChipNoise(this.context.sampleRate, this.context.sampleRate));
        for (const [name, duty] of [['pulse25', 0.25], ['pulse125', 0.125]]) {
          if (!this.context.createPeriodicWave) continue;
          const real = new Float32Array(33), imag = new Float32Array(33);
          for (let harmonic = 1; harmonic < 33; harmonic++) real[harmonic] = 4 * Math.sin(Math.PI * harmonic * duty) / (Math.PI * harmonic);
          this._pulseWaves.set(name, this.context.createPeriodicWave(real, imag));
        }
      } catch {
        this.context?.close().catch(() => {});
        this.context = null;
        return Promise.resolve(false);
      }
    }
    this._unlocked = true;
    if (this.context.state === 'running' && this._clock !== null && this.enabled && this.scene !== 'paused') {
      return Promise.resolve(true);
    }
    return this._syncPlayback();
  }

  setScene(scene) {
    if (!['menu', 'battle', 'paused'].includes(scene) || this._destroyed) return;
    if (scene === this.scene) return;
    this.scene = scene;
    if (scene !== 'paused') {
      this._musicScene = scene;
      this._step = this._cursors[scene];
    }
    this._syncPlayback();
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setEnabled(enabled) {
    const next = Boolean(enabled);
    if (next === this.enabled) return;
    this.enabled = next;
    this._syncPlayback();
  }

  setVolume(volume) {
    if (!Number.isFinite(Number(volume))) return;
    this.volume = Math.max(0, Math.min(1, Number(volume)));
    if (this._master && this.context) {
      const now = this.context.currentTime;
      this._master.gain.cancelScheduledValues(now);
      this._master.gain.setTargetAtTime(this.volume * 0.7, now, 0.015);
    }
  }

  setIntensity(value) {
    if (Number.isFinite(Number(value))) this.intensity = clamp01(Number(value));
  }

  setDucked(value) {
    this.ducked = Boolean(value);
    if (this.context && this._musicBus) {
      const now = this.context.currentTime;
      this._musicBus.gain.cancelScheduledValues(now);
      this._musicBus.gain.setTargetAtTime(this.ducked ? 0.39 : 0.76, now, 0.075);
    }
  }

  _syncPlayback() {
    const token = ++this._stateToken;
    this._clearClock();
    this._stopVoices();
    const ctx = this.context;
    if (!ctx || !this._unlocked || this._destroyed) return Promise.resolve(false);
    if (!this.enabled || this.scene === 'paused') {
      return ctx.suspend().then(() => false).catch(() => false);
    }
    return ctx.resume().then(() => {
      if (token !== this._stateToken || this._destroyed || !this.enabled || this.scene === 'paused') return false;
      this._step = this._cursors[this._musicScene];
      this._nextStep = ctx.currentTime + 0.045;
      this._schedule();
      this._clock = setInterval(() => this._schedule(), STEP_MS);
      return true;
    }).catch(() => false);
  }

  _clearClock() {
    if (this._clock !== null) clearInterval(this._clock);
    this._clock = null;
  }

  _retire(voice, stop = true) {
    if (!this._voices.delete(voice)) return;
    voice.source.onended = null;
    if (stop) {
      try { voice.source.stop(); } catch { /* It already ended. */ }
    }
    voice.source.disconnect();
    voice.gain.disconnect();
    voice.filter?.disconnect();
    voice.panner?.disconnect();
  }

  _stopVoices() {
    for (const voice of this._voices) this._retire(voice);
  }

  _admit(source, gain, filter, kind, options = {}, panner = null) {
    const priority = options.priority ?? (kind === 'music' ? 2 : this._sfxPriority || 0);
    const sfx = [...this._voices].filter(voice => voice.kind === 'sfx');
    const dispose = () => { source.disconnect(); gain.disconnect(); filter?.disconnect(); panner?.disconnect(); return false; };
    if (kind === 'sfx' && sfx.length >= (priority > 0 ? MAX_SFX_VOICES : 8)) {
      const victim = sfx.sort((a, b) => a.priority - b.priority)[0];
      if (victim.priority > priority) return dispose();
      this._retire(victim);
    }
    if (this._voices.size >= MAX_VOICES) {
      // Even a frantic burst of effects cannot steal the melody or bass channel.
      const victim = [...this._voices].filter(voice => voice.kind === 'sfx' || voice.priority < priority)
        .sort((a, b) => (a.kind === 'sfx' ? -1 : 0) - (b.kind === 'sfx' ? -1 : 0) || a.priority - b.priority)[0];
      if (!victim || kind === 'sfx' && victim.kind === 'music') return dispose();
      this._retire(victim);
    }
    const voice = { source, gain, filter, panner, kind, priority, instrument: options.instrument };
    this._voices.add(voice);
    source.onended = () => this._retire(voice, false);
    return true;
  }

  _connect(gain, kind, pan = 0) {
    const bus = kind === 'music' ? this._musicBus : this._sfxBus;
    if (!pan || !this.context.createStereoPanner) { gain.connect(bus); return null; }
    const panner = this.context.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner); panner.connect(bus);
    return panner;
  }

  _tone(note, time, duration, level = 0.1, type = 'square', kind = 'sfx', endNote = null, options = {}) {
    const ctx = this.context;
    if (!ctx || !this.enabled || this._destroyed) return;
    const start = Math.max(time, ctx.currentTime);
    const source = ctx.createOscillator();
    const gain = ctx.createGain();
    const wave = this._pulseWaves.get(type);
    if (wave) source.setPeriodicWave(wave);
    else source.type = type.startsWith('pulse') ? 'square' : type;
    source.frequency.setValueAtTime(MIDI(note), start);
    if (endNote !== null) source.frequency.exponentialRampToValueAtTime(MIDI(endNote), start + duration);
    const attack = Math.min(options.attack ?? 0.003, duration * 0.2);
    const decay = Math.min(options.decay ?? duration * 0.55, duration * 0.3);
    const release = Math.min(options.release ?? 0.03, duration * 0.3);
    const sustain = Math.max(0.0002, level * (options.sustain ?? 0.18));
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), start + attack);
    gain.gain.exponentialRampToValueAtTime(sustain, start + attack + decay);
    gain.gain.setValueAtTime(sustain, start + Math.max(attack + decay, duration - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    if (options.vibrato && source.detune && duration > 0.16) {
      for (let offset = 0.08; offset < duration - 0.025; offset += 0.035) source.detune.setValueAtTime(Math.sin(offset * 36) * options.vibrato, start + offset);
    }
    source.connect(gain);
    const panner = this._connect(gain, kind, options.pan);
    if (!this._admit(source, gain, null, kind, options, panner)) return;
    source.start(start);
    source.stop(start + duration + 0.012);
  }

  _noise(time, duration, level = 0.1, cutoff = 3000, kind = 'sfx', lowpass = false, options = {}) {
    const ctx = this.context;
    if (!ctx || !this._noiseBuffer || !this.enabled || this._destroyed) return;
    const start = Math.max(time, ctx.currentTime);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    source.buffer = this._noiseBuffer;
    filter.type = lowpass ? 'lowpass' : 'highpass';
    filter.frequency.setValueAtTime(cutoff, start);
    gain.gain.setValueAtTime(Math.max(0.0002, level), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    const panner = this._connect(gain, kind, options.pan);
    if (!this._admit(source, gain, filter, kind, options, panner)) return;
    source.start(start);
    source.stop(start + duration + 0.012);
  }

  _schedule() {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || !this.enabled || this.scene === 'paused' || this._destroyed) return;
    const stepLength = 60 / MUSIC_SCORE[this._musicScene].bpm / 4;
    // A throttled background tab skips missed bars instead of flooding the graph.
    if (this._nextStep < ctx.currentTime - 0.2) this._nextStep = ctx.currentTime + 0.03;
    let scheduled = 0;
    while (this._nextStep < ctx.currentTime + LOOK_AHEAD && scheduled++ < 8) {
      this._musicStep(this._step++, this._nextStep);
      this._cursors[this._musicScene] = this._step;
      this._nextStep += stepLength;
    }
  }

  _musicStep(step, time) {
    for (const event of getMusicStepEvents(this._musicScene, step, this.intensity)) {
      const preset = CHIP_VOICES[event.instrument];
      const options = { ...preset, ...event };
      if (preset.noise) this._noise(time, event.duration, event.level, preset.cutoff, 'music', false, options);
      else this._tone(event.note, time, event.duration, event.level, event.wave || preset.wave, 'music', event.endNote ?? null, options);
    }
  }

  _jingle(notes, time, spacing, duration = spacing * 1.5) {
    notes.forEach((note, index) => {
      if (note) this._tone(note, time + index * spacing, duration, 0.12, 'square');
    });
  }

  sfx(name) {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || !this.enabled || this.scene === 'paused' || this._destroyed) return;
    if (!Object.hasOwn(SFX_GAPS, name)) return;
    const now = ctx.currentTime;
    if (now - (this._lastSfx.get(name) ?? -Infinity) < SFX_GAPS[name]) return;
    this._sfxTokens = Math.min(8, this._sfxTokens + Math.max(0, now - this._sfxTokenTime) * 18);
    this._sfxTokenTime = now;
    if (!IMPORTANT_SFX.has(name)) {
      if (this._sfxTokens < 1) return;
      this._sfxTokens--;
    }
    this._sfxPriority = IMPORTANT_SFX.has(name) ? 3 : 0;
    this._lastSfx.set(name, now);
    switch (name) {
      case 'shoot':
        this._tone(84, now, 0.055, 0.04, 'pulse125', 'sfx', 52);
        this._noise(now, 0.025, 0.018, 2300);
        break;
      case 'kill':
        // A dry pixel crack, short low pop and restrained cyan-reward ping.
        // Routine priority and the shared voice/token caps preserve the melody.
        this._noise(now, 0.028, 0.035, 1700);
        this._tone(60, now, 0.065, 0.06, 'triangle', 'sfx', 43);
        this._tone(91, now + 0.045, 0.075, 0.035, 'sine', 'sfx', 96);
        break;
      case 'heart':
        this._tone(76, now, 0.12, 0.08, 'triangle', 'sfx', 88);
        this._tone(83, now + 0.035, 0.09, 0.04, 'sine');
        break;
      case 'collect':
        this._tone(88, now, 0.045, 0.04, 'triangle', 'sfx', 95);
        break;
      case 'coin':
        this._jingle([88, 95], now, 0.055, 0.11);
        break;
      case 'chest':
        this._jingle([64, 68, 71, 76, 83], now, 0.07, 0.18);
        this._tone(52, now, 0.35, 0.13, 'triangle');
        break;
      case 'gas':
        this._tone(43, now, 0.25, 0.1, 'sawtooth', 'sfx', 27);
        this._tone(35, now + 0.06, 0.19, 0.055, 'square', 'sfx', 30);
        this._noise(now, 0.23, 0.07, 420, 'sfx', true);
        break;
      case 'hit':
        this._noise(now, 0.12, 0.14, 650);
        this._tone(45, now, 0.13, 0.13, 'square', 'sfx', 29);
        break;
      case 'truth':
        this._jingle([71, 78, 83, 90], now, 0.045, 0.18);
        this._noise(now, 0.17, 0.06, 3500);
        break;
      case 'level':
        this._jingle([64, 67, 71, 76, 79, 83], now, 0.07, 0.16);
        this._tone(52, now, 0.5, 0.1, 'triangle');
        break;
      case 'victory':
        this._jingle([76, 76, 0, 76, 79, 83, 88, 83, 88], now, 0.115, 0.22);
        [52, 55, 59].forEach((note) => this._tone(note, now + 0.69, 0.65, 0.08, 'triangle'));
        break;
      case 'defeat':
        this._jingle([76, 74, 71, 67, 63, 59], now, 0.14, 0.25);
        this._tone(43, now + 0.72, 0.48, 0.13, 'sawtooth', 'sfx', 31);
        break;
      case 'click':
        this._tone(79, now, 0.035, 0.055, 'square', 'sfx', 83);
        break;
      case 'split':
        this._noise(now, 0.18, 0.09, 1800);
        this._tone(57, now, 0.12, 0.09, 'triangle', 'sfx', 81);
        this._jingle([83, 88, 90], now + 0.11, 0.065, 0.12);
        this._tone(47, now + 0.31, 0.16, 0.075, 'pulse25', 'sfx', 40);
        break;
      case 'rooster':
        // Co-co-RI-co: clipped clucks, an upward squeak, then a falling crow.
        for (const [offset, note, endNote, duration, level] of [
          [0, 67, 64, 0.07, 0.06], [0.1, 71, 68, 0.07, 0.062],
          [0.2, 83, 86, 0.1, 0.078], [0.33, 78, 72, 0.15, 0.066],
        ]) this._tone(note, now + offset, duration, level, 'pulse125', 'sfx', endNote,
          { attack: 0.003, decay: 0.018, sustain: 0.4, release: 0.015 });
        break;
    }
  }

  destroy() {
    this._destroyed = true;
    this._stateToken++;
    this._clearClock();
    this._stopVoices();
    if (this.context) this.context.close().catch(() => {});
    this._master?.disconnect();
    this._musicBus?.disconnect();
    this._sfxBus?.disconnect();
    this.context = null;
    this._noiseBuffer = null;
    this._pulseWaves.clear();
    this._lastSfx.clear();
  }
}
