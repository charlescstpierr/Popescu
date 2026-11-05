import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as audioModule from '../dist/audio.js';
import { Game } from '../dist/engine.js';
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

const jsonHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('battle plays the selected Égo de guerre composition exactly', () => {
  assert.deepEqual(audioModule.MUSIC_SCORE.battle, { title: 'Égo de guerre', bpm: 148, bars: 32 });
  // Fingerprints captured from the actual choice 1 audition before integration.
  for (const [intensity, expected] of [
    [0, '8f94b1314140ce797bc988e8c61276dbaf1a66c412d23e7dc1269f0013f1f056'],
    [0.8, '59f54a85fa740353b4b34a0265f9a99497db7de21cd7ded3a8c708b72bbed27e'],
    [1, '59f54a85fa740353b4b34a0265f9a99497db7de21cd7ded3a8c708b72bbed27e'],
  ]) assert.equal(jsonHash(Array.from({ length: 512 }, (_, step) => audioModule.getMusicStepEvents('battle', step, intensity))), expected);
  assert.equal(typeof audioModule.getMusicVoice, 'function');
  const instruments = ['lead', 'harmony', 'bass', 'riff', 'stab', 'arp', 'kick', 'snare', 'snareBody', 'hat', 'tom'];
  const voices = Object.fromEntries(instruments.map(name => [name, audioModule.getMusicVoice('battle', name)]));
  assert.equal(jsonHash(voices), '144fbb21e8711e41c01c2a909adee5e91c869fe0ff775f0561a946dddda7083a');
});

test('selected battle score includes instrumental breathing space and bounded accents', () => {
  const events = (bar, intensity) => Array.from({ length: 16 }, (_, at) => audioModule.getMusicStepEvents('battle', bar * 16 + at, intensity)).flat();
  assert.notDeepEqual(leadBar('battle', 0), leadBar('battle', 8));
  assert.ok(events(0, 1).length > events(0, 0).length);
  assert.deepEqual(events(0, 0).filter(event => event.instrument === 'lead'), events(0, 1).filter(event => event.instrument === 'lead'));
  assert.equal(Array.from({ length: 32 }, (_, bar) => leadBar('battle', bar)).filter(notes => !notes.length).length, 4);
  let pending = [], maximum = 0;
  const dt = 60 / 148 / 4;
  for (let step = 0; step < 1024; step++) {
    const now = step * dt;
    pending = pending.filter(end => end > now);
    for (const event of audioModule.getMusicStepEvents('battle', step, 1)) {
      assert.ok(Number.isFinite(event.duration) && event.duration > 0);
      assert.ok(Number.isFinite(event.level) && event.level > 0 && event.level <= 0.2);
      if (event.note !== undefined) assert.ok(event.note >= 24 && event.note <= 76);
      pending.push(now + event.duration + 0.012);
    }
    maximum = Math.max(maximum, pending.length);
  }
  assert.ok(maximum <= 8, 'music leaves substantial voice capacity for combat cues');
});

test('menu score and instrument definitions remain unchanged', () => {
  assert.deepEqual(audioModule.MUSIC_SCORE.menu, { title: 'Miroir, mon beau miroir', bpm: 104, bars: 8 });
  assert.equal(jsonHash(Array.from({ length: 128 }, (_, step) => audioModule.getMusicStepEvents('menu', step, 0.8))), '068fd4b0b5b03b1b3aa6911b9d9c70060bd59afa7a1703b6090228b0b6b0d70c');
  assert.equal(jsonHash(audioModule.CHIP_VOICES), 'ea7857ce95eb082780d5451666d3965006b9d216052f381a661a8f07ff3e7124');
});

test('rendered battle preview matches the user-selected WAV byte for byte', () => {
  const rendered = renderMusic('battle', 32, 0.8);
  const hash = createHash('sha256').update(encodeWav(rendered.samples, rendered.sampleRate)).digest('hex');
  assert.equal(hash, '6630679ac441760b6851f9987d318d8583ec021be73b1da86df6079176637a61');
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
  for (const name of ['shoot', 'heart', 'collect', 'coin', 'chest', 'gas', 'hit', 'level', 'victory', 'defeat', 'click', 'truth', 'split', 'rooster', 'snap']) {
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
  assert.equal(rendered.duration, 240 / audioModule.MUSIC_SCORE.battle.bpm);
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

function exhaustRoutineCredits(audio) {
  for (const name of ['shoot', 'collect', 'coin', 'heart', 'kill', 'truth', 'gas']) audio.sfx(name);
  audio.context.advance(0.15);
  for (const name of ['shoot', 'collect', 'coin']) audio.sfx(name);
  assert.ok(audio._sfxTokens < 1, 'the real routine limiter is exhausted');
}

test('accepted damage keeps its original two-part cue when routine credits are exhausted', async t => {
  const audio = await createAudio(t);
  audio.setScene('battle'); await Promise.resolve();
  exhaustRoutineCredits(audio);
  const credits = audio._sfxTokens, existing = new Set(audio._voices);
  audio.sfx('hit');
  const hit = [...audio._voices].filter(voice => !existing.has(voice));
  assert.equal(hit.length, 2, 'both damage components must reach the audio graph');
  assert.equal(audio._sfxTokens, credits, 'damage does not spend routine credits');
  assert.deepEqual(hit.map(voice => Math.max(...voice.gain.gain.events.map(([value]) => value))), [0.14, 0.13]);
  assert.equal(hit[0].filter.type, 'highpass');
  assert.equal(hit[0].filter.frequency.value, 650);
  assert.equal(hit[1].source.type, 'square');
  assert.equal(hit[1].source.frequency.events[0][0], 110);
  assert.ok(hit.every(voice => voice.source.stopTime - voice.source.startTime < 0.15));
  assert.ok(audio._voices.size <= 32);
});

test('ordinary effects cannot steal a live damage cue or the melody and bass', async t => {
  const audio = await createAudio(t);
  audio.setScene('battle'); await Promise.resolve();
  const music = [...audio._voices].filter(voice => ['lead', 'bass'].includes(voice.instrument));
  const before = new Set(audio._voices); audio.sfx('hit');
  const hit = [...audio._voices].filter(voice => !before.has(voice));
  assert.equal(hit.length, 2);
  for (let i = 0; i < 300; i++) for (const name of ['shoot', 'collect', 'coin', 'heart', 'kill', 'truth', 'gas']) audio.sfx(name);
  assert.ok(hit.every(voice => audio._voices.has(voice)), 'ordinary voice eviction must preserve the damage cue');
  assert.ok(music.length >= 2 && music.every(voice => audio._voices.has(voice)));
  assert.ok([...audio._voices].filter(voice => voice.kind === 'sfx').length <= 14);
  assert.ok(audio._voices.size <= 32);
});

test('damage uses free important capacity without stealing existing protected cues', async t => {
  const audio = await createAudio(t);
  audio.sfx('chest'); audio.sfx('split');
  const existing = [...audio._voices], before = audio.context.sources.length;
  assert.equal(existing.filter(voice => voice.kind === 'sfx').length, 12);
  audio.sfx('hit');
  assert.equal(audio.context.sources.slice(before).filter(source => source.startTime !== undefined).length, 2);
  assert.ok(existing.every(voice => audio._voices.has(voice)));
  assert.equal([...audio._voices].filter(voice => voice.kind === 'sfx').length, 14);
});

test('damage never displaces a full allocation of higher-priority cues', async t => {
  const audio = await createAudio(t);
  audio.sfx('chest'); audio.sfx('level'); audio.sfx('rooster');
  const protectedVoices = [...audio._voices].filter(voice => voice.kind === 'sfx');
  assert.equal(protectedVoices.length, 14);
  audio.sfx('hit');
  assert.ok(protectedVoices.every(voice => audio._voices.has(voice)));
  assert.equal([...audio._voices].filter(voice => voice.kind === 'sfx').length, 14);
  assert.ok(audio._voices.size <= 32);
});

for (const [musicCount, cues, effects] of [[20, ['chest', 'split'], 12], [28, ['rooster'], 4]])
test(`the global ceiling with ${musicCount} music voices preserves higher-priority cues`, async t => {
  const audio = await createAudio(t);
  audio._stopVoices();
  for (let i = 0; i < musicCount; i++) audio._tone(60, 0, 1, 0.1, 'triangle', 'music', null, { priority: 5 });
  for (const name of cues) audio.sfx(name);
  const existing = [...audio._voices];
  assert.equal(existing.length, 32);
  assert.equal(existing.filter(voice => voice.kind === 'sfx').length, effects);
  audio.sfx('hit'); audio.sfx('shoot');
  assert.ok(existing.every(voice => audio._voices.has(voice)), 'global admission must respect protected SFX priority');
  assert.equal(audio._voices.size, 32);
});

test('at the global ceiling damage replaces routine effects without losing either component', async t => {
  const audio = await createAudio(t);
  audio._stopVoices();
  for (let i = 0; i < 24; i++) audio._tone(60, 0, 1, 0.1, 'triangle', 'music', null, { priority: 5 });
  const music = [...audio._voices];
  audio.sfx('truth'); audio.sfx('gas');
  assert.equal(audio._voices.size, 32);
  const existing = new Set(audio._voices); audio.sfx('hit');
  assert.equal([...audio._voices].filter(voice => !existing.has(voice)).length, 2);
  assert.ok(music.every(voice => audio._voices.has(voice)));
  assert.equal(audio._voices.size, 32);
});

test('protected damage remains rate-limited, muted, paused and destroyed safely', async t => {
  const audio = await createAudio(t);
  audio.sfx('hit'); const first = audio.context.sources.length;
  for (let i = 0; i < 300; i++) audio.sfx('hit');
  audio.context.advance(0.169); audio.sfx('hit');
  assert.equal(audio.context.sources.length, first);
  audio.context.advance(0.002); audio.sfx('hit');
  assert.equal(audio.context.sources.length, first + 2);
  audio.setEnabled(false); await Promise.resolve();
  audio.context.advance(1); const muted = audio.context.sources.length; audio.sfx('hit');
  assert.equal(audio.context.sources.length, muted); assert.equal(audio._voices.size, 0);
  audio.setScene('paused'); audio.setEnabled(true); await Promise.resolve();
  audio.sfx('hit'); assert.equal(audio.context.sources.length, muted);
  const ctx = audio.context; audio.destroy(); audio.sfx('hit');
  assert.equal(audio._voices.size, 0); assert.ok(ctx.sources.every(source => source.disconnected));
});

for (const [source, shield, expectedHp, expectedShield, invulnerability] of [
  ['touch', 0, 95, 0, 0.72], ['touch', 10, 100, 5, 0.72], ['gas', 0, 95, 0, 0.55],
]) test(`real ${source} damage with shield ${shield} signals once despite busy audio`, async t => {
  const audio = await createAudio(t);
  exhaustRoutineCredits(audio);
  const game = new Game({ onEvent(type, name) { if (type === 'sound') audio.sfx(name); } });
  game.s.shield = shield;
  const before = audio.context.sources.length;
  game.damage(5, source);
  assert.equal(game.s.hp, expectedHp); assert.equal(game.s.shield, expectedShield);
  assert.equal(game.s.invulnerable, invulnerability);
  assert.equal(audio.context.sources.slice(before).filter(node => node.startTime !== undefined).length, 2);
  const after = audio.context.sources.length;
  for (let i = 0; i < 300; i++) game.damage(5, source);
  assert.equal(game.s.hp, expectedHp); assert.equal(game.s.shield, expectedShield);
  assert.equal(audio.context.sources.length, after, 'invulnerable contacts remain silent');
});


test('Charles snap is one compact cue, throttles repeats and honors mute and pause',async t=>{
 const audio=await createAudio(t);audio.setScene('battle');await Promise.resolve();
 const lead=[...audio._voices].find(voice=>voice.instrument==='lead'),before=audio.context.sources.length;
 for(let i=0;i<300;i++)audio.sfx('snap');const cue=audio.context.sources.slice(before);
 assert.equal(cue.length,3);assert.ok(Math.max(...cue.map(s=>s.stopTime))-Math.min(...cue.map(s=>s.startTime))<.2);assert.ok(audio._voices.has(lead));assert.ok(audio._voices.size<=32);
 const count=audio.context.sources.length;audio.context.advance(.5);audio.sfx('snap');assert.equal(audio.context.sources.length,count);
 audio.setEnabled(false);await Promise.resolve();const muted=audio.context.sources.length;audio.sfx('snap');assert.equal(audio.context.sources.length,muted);
 audio.setEnabled(true);audio.setScene('paused');await Promise.resolve();audio.sfx('snap');assert.equal(audio._voices.size,0);
});
