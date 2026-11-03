import test from 'node:test';
import assert from 'node:assert/strict';
import * as audioModule from '../dist/audio.js';
import { renderMusic, encodeWav } from '../scripts/render-music-preview.mjs';

class Param {
  constructor(value = 0) { this.value = value; this.events = []; }
  setValueAtTime(value, time) { this.value = value; this.events.push([value, time]); }
  exponentialRampToValueAtTime(value, time) { this.value = value; this.events.push([value, time]); }
  setTargetAtTime(value, time) { this.value = value; this.events.push([value, time]); }
  cancelScheduledValues() {}
}
class FakeNode {
  constructor(context) {
    this.context = context;
    this.gain = new Param(); this.frequency = new Param(); this.detune = new Param(); this.pan = new Param();
    this.disconnected = false;
  }
  connect() {}
  disconnect() { this.disconnected = true; }
  setPeriodicWave(wave) { this.wave = wave; }
  start(time = 0) { this.startTime = time; }
  stop(time = this.context.currentTime) { this.stopTime = time; }
}
class FakeAudioContext {
  static created = 0;
  constructor() {
    FakeAudioContext.created++;
    this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 22050;
    this.destination = new FakeNode(this); this.sources = []; this.periodicWaves = [];
  }
  createGain() { return new FakeNode(this); }
  createStereoPanner() { return new FakeNode(this); }
  createBiquadFilter() { return new FakeNode(this); }
  createOscillator() { const source = new FakeNode(this); this.sources.push(source); return source; }
  createBufferSource() { return this.createOscillator(); }
  createPeriodicWave(real, imag) { const wave = { real, imag }; this.periodicWaves.push(wave); return wave; }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
  advance(seconds) {
    this.currentTime += seconds;
    for (const source of this.sources) if (source.onended && source.stopTime <= this.currentTime) source.onended();
  }
}
async function createAudio(t) {
  const original = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext;
  const audio = new audioModule.AudioManager();
  t.after(() => { audio.destroy(); globalThis.AudioContext = original; });
  await audio.unlock();
  return audio;
}
const leadBar = (scene, bar) => Array.from({ length: 16 }, (_, at) =>
  (audioModule.getMusicStepEvents?.(scene, bar * 16 + at, 0.5) || [])
    .filter(event => event.instrument === 'lead').map(event => [at, event.note])).flat();

test('battle has a repeated seven-note hook, answers, and a distinct slower menu arrangement', () => {
  assert.equal(typeof audioModule.getMusicStepEvents, 'function', 'composition events must be shared by playback and preview');
  assert.equal(audioModule.MUSIC_SCORE.battle.bpm, 150);
  assert.equal(audioModule.MUSIC_SCORE.battle.bars, 32);
  assert.ok(audioModule.MUSIC_SCORE.menu.bpm < 120);
  assert.equal(leadBar('battle', 0).length, 7);
  assert.deepEqual(leadBar('battle', 0), leadBar('battle', 2), 'the hook returns unchanged');
  assert.notDeepEqual(leadBar('battle', 0), leadBar('battle', 1), 'the next bar answers the hook');
  assert.deepEqual(leadBar('menu', 0).map(([at, note]) => [at, note + 12]), leadBar('battle', 0), 'menu retains the brand hook');
});

test('32-bar score adds a bridge and later harmony; intensity changes layers without rewriting the tune', () => {
  assert.equal(typeof audioModule.getMusicStepEvents, 'function');
  const events = (bar, intensity) => Array.from({ length: 16 }, (_, at) => audioModule.getMusicStepEvents('battle', bar * 16 + at, intensity)).flat();
  assert.notDeepEqual(leadBar('battle', 0), leadBar('battle', 8), 'eight-bar bridge has another phrase');
  assert.ok(!events(0, 0.5).some(event => event.instrument === 'harmony'));
  assert.ok(events(16, 0.5).some(event => event.instrument === 'harmony'));
  assert.ok(events(0, 1).length > events(0, 0).length, 'higher intensity layers percussion and arpeggios');
  assert.deepEqual(events(0, 0).filter(event => event.instrument === 'lead'), events(0, 1).filter(event => event.instrument === 'lead'));
  for (let step = 0; step < 512; step++) for (const event of audioModule.getMusicStepEvents('battle', step, 1)) {
    assert.ok(Number.isFinite(event.duration) && event.duration > 0);
    assert.ok(Number.isFinite(event.level) && event.level > 0 && event.level < 0.3);
    if (event.note !== undefined) assert.ok(event.note >= 24 && event.note <= 100);
  }
});

test('AudioContext stays lazy, unlock is idempotent, and pulse timbres are created', async t => {
  const original = globalThis.AudioContext;
  globalThis.AudioContext = FakeAudioContext;
  const created = FakeAudioContext.created;
  const audio = new audioModule.AudioManager();
  t.after(() => { audio.destroy(); globalThis.AudioContext = original; });
  assert.equal(FakeAudioContext.created, created);
  await audio.unlock();
  assert.equal(FakeAudioContext.created, created + 1);
  const sources = audio.context.sources.length;
  await audio.unlock();
  assert.equal(audio.context.sources.length, sources);
  assert.ok(audio.context.periodicWaves.length >= 2, 'lead uses custom pulse waves');
});

test('pause, mute and scene changes preserve independent score positions and stop all voices', async t => {
  const audio = await createAudio(t);
  audio.setScene('battle'); await Promise.resolve();
  for (let i = 0; i < 80; i++) { audio.context.advance(0.1); audio._schedule(); }
  const battleStep = audio._step;
  assert.ok(battleStep > 64);
  audio.setScene('paused'); await Promise.resolve();
  assert.equal(audio.context.state, 'suspended');
  assert.equal(audio._clock, null);
  assert.equal(audio._voices.size, 0);
  audio.setScene('battle'); await Promise.resolve();
  assert.ok(audio._step >= battleStep, 'unpause continues the song');
  audio.setScene('menu'); await Promise.resolve();
  audio.setScene('battle'); await Promise.resolve();
  assert.ok(audio._step >= battleStep, 'menu owns another cursor');
  const beforeMute = audio._step;
  audio.setEnabled(false); await Promise.resolve();
  assert.equal(audio._voices.size, 0);
  assert.equal(audio.context.state, 'suspended');
  audio.setEnabled(true); await Promise.resolve();
  assert.ok(audio._step >= beforeMute);
});

test('intensity and dialogue ducking preserve the score and saved volume', async t => {
  const audio = await createAudio(t);
  assert.equal(typeof audio.setIntensity, 'function');
  assert.equal(typeof audio.setDucked, 'function');
  const step = audio._step, sources = audio.context.sources.length, volume = audio.volume;
  audio.setIntensity(1); audio.setDucked(true);
  assert.equal(audio.intensity, 1);
  assert.equal(audio._step, step);
  assert.equal(audio.context.sources.length, sources);
  assert.equal(audio.volume, volume);
  const ducked = audio._musicBus.gain.value;
  audio.setDucked(false);
  assert.ok(audio._musicBus.gain.value > ducked);
  audio.setIntensity(5); assert.equal(audio.intensity, 1);
  audio.setIntensity(-1); assert.equal(audio.intensity, 0);
  audio.setIntensity(NaN); assert.equal(audio.intensity, 0);
});

test('dense combat SFX stay throttled and bounded while the lead survives; split makes a comic sound', async t => {
  const audio = await createAudio(t);
  audio.setScene('battle'); await Promise.resolve();
  const lead = [...audio._voices].find(voice => voice.instrument === 'lead');
  assert.ok(lead, 'battle begins with the hook');
  const sourceCount = audio.context.sources.length;
  for (let i = 0; i < 300; i++) for (const name of ['shoot', 'collect', 'coin', 'gas', 'hit', 'heart']) audio.sfx(name);
  assert.ok(audio.context.sources.length - sourceCount < 24, 'one frame cannot create hundreds of sounds');
  assert.ok(audio._voices.size <= 32);
  assert.ok(audio._voices.has(lead), 'routine effects cannot evict the melody');
  audio.context.advance(1);
  const beforeSplit = audio.context.sources.length;
  audio.sfx('split');
  assert.ok(audio.context.sources.length > beforeSplit);
  for (let i = 0; i < 200; i++) {
    audio.context.advance(0.02); audio._schedule();
    audio.sfx('shoot'); audio.sfx('collect'); audio.sfx('gas');
    assert.ok(audio._voices.size <= 32);
  }
});

test('all supported effects synthesize and destroy disconnects every source', async t => {
  const audio = await createAudio(t);
  for (const name of ['shoot', 'heart', 'collect', 'coin', 'chest', 'gas', 'hit', 'level', 'victory', 'defeat', 'click', 'truth', 'split', 'rooster']) {
    audio.context.advance(2);
    const before = audio.context.sources.length;
    audio.sfx(name);
    assert.ok(audio.context.sources.length > before, name);
  }
  const ctx = audio.context;
  audio.destroy();
  assert.equal(ctx.state, 'closed');
  assert.equal(audio.context, null);
  assert.equal(audio._clock, null);
  assert.equal(audio._voices.size, 0);
  assert.ok(ctx.sources.every(source => source.disconnected));
});

test('rooster crow has four separated pitch syllables, stays under the lead and throttles rival overlap', async t => {
  const audio = await createAudio(t);
  audio.setScene('battle'); await Promise.resolve();
  const lead = [...audio._voices].find(voice => voice.instrument === 'lead');
  const before = audio.context.sources.length;
  audio.sfx('rooster');
  const crow = audio.context.sources.slice(before);
  assert.equal(crow.length, 4, 'co-co-ri-co is four original synthetic syllables');
  assert.equal(new Set(crow.map(source => source.frequency.events[0][0])).size, 4);
  assert.ok(crow.every((source, index) => index === 0 || source.startTime > crow[index - 1].stopTime));
  assert.ok(crow.at(-1).stopTime - crow[0].startTime < 0.6, 'the attack cue is brief');
  const crowVoices = [...audio._voices].filter(voice => crow.includes(voice.source));
  assert.ok(crowVoices.every(voice => Math.max(...voice.gain.gain.events.map(([value]) => value)) < 0.1));
  for (let i = 0; i < 300; i++) audio.sfx('rooster');
  assert.equal(audio.context.sources.length, before + 4, 'simultaneous rivals share a bounded cue');
  assert.ok(audio._voices.has(lead));
  assert.ok(audio._voices.size <= 32);
  audio.setScene('paused'); await Promise.resolve();
  audio.sfx('rooster');
  assert.equal(audio._voices.size, 0);
});

test('audition WAV renders the same hook events into finite, unclipped PCM', () => {
  const rendered = renderMusic('battle', 1, 0.6, 11025);
  assert.equal(rendered.duration, 1.6);
  assert.deepEqual(rendered.events.filter(event => event.instrument === 'lead').map(event => event.note), leadBar('battle', 0).map(([, note]) => note));
  assert.ok(rendered.samples.every(Number.isFinite));
  assert.ok(rendered.peak > 0.8 && rendered.peak <= 0.861);
  assert.ok(rendered.rms > 0.08);
  const wav = encodeWav(rendered.samples, rendered.sampleRate);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt32LE(40), rendered.samples.length * 2);
  assert.equal(wav.length, 44 + rendered.samples.length * 2);
});

test('kill cue is brief, throttled under crowds and honors mute and pause',async t=>{
 const audio=await createAudio(t);audio.setScene('battle');await Promise.resolve();
 const lead=[...audio._voices].find(voice=>voice.instrument==='lead'),before=audio.context.sources.length;
 for(let i=0;i<300;i++)audio.sfx('kill');
 const cue=audio.context.sources.slice(before);
 assert.ok(cue.length>=2&&cue.length<=3,'a kill has a compact impact and reward tone');
 assert.ok(Math.max(...cue.map(s=>s.stopTime))-Math.min(...cue.map(s=>s.startTime))<.2);
 assert.ok(audio._voices.has(lead));assert.ok(audio._voices.size<=32);
 const count=audio.context.sources.length;audio.context.advance(.1);audio.sfx('kill');assert.equal(audio.context.sources.length,count,'rapid defeats coalesce');
 audio.context.advance(.1);audio.sfx('kill');assert.ok(audio.context.sources.length>count);
 audio.setEnabled(false);await Promise.resolve();const muted=audio.context.sources.length;audio.sfx('kill');assert.equal(audio.context.sources.length,muted);
 audio.setEnabled(true);audio.setScene('paused');await Promise.resolve();audio.sfx('kill');assert.equal(audio._voices.size,0);
});
