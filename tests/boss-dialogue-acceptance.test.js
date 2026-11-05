import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {PELICAN_BANTER} from '../dist/pelican.js';
import {TRAVESTIA_BANTER} from '../dist/travestia.js';

for(const type of ['pelican','travestia']) {
 const prefix=type==='pelican'?'peli':'tail';
 const lines=type==='pelican'?PELICAN_BANTER:TRAVESTIA_BANTER;
 test(`${type}: muted setup cannot produce an orphan reply after save and re-enable`,()=>{
  const spoken=[],g=new Game({seed:43,onEvent:(kind,payload)=>{if(kind==='bark')spoken.push(payload.text);}});
  g.setPausedEncountersEnabled(true);g.setBanterEnabled(false);
  const boss=g.spawnEnemy(type,100,0);boss.cooldown=0;g.updateEnemies(.01);
  assert.deepEqual(spoken,[]);
  const saved=captureRun(g),r=restoreRun(saved,{onEvent:(kind,payload)=>{if(kind==='bark')spoken.push(payload.text);}});
  assert.deepEqual(captureRun(r),saved);r.setPausedEncountersEnabled(true);r.setBanterEnabled(true);
  for(let i=0;i<100;i++){r.s.elapsed+=.05;r.updateEnemies(.05);r.flushSpeech();}
  assert.deepEqual(spoken,[],'rejected setup must not schedule a later answer');
  assert.equal(r.s.enemies[0][`${prefix}BanterIndex`]||0,0,'unseen first pair is still eligible');
  assert.equal(r.encounters.outcomes[`boss:${type}`],undefined);
 });
 test(`${type}: first visible paused encounter still starts with pair zero after muted attacks`,()=>{
  const g=new Game({seed:43});g.setPausedEncountersEnabled(true);g.setBanterEnabled(false);
  const boss=g.spawnEnemy(type,100,0);boss.cooldown=0;g.updateEnemies(.01);
  const restored=restoreRun(captureRun(g));restored.setPausedEncountersEnabled(true);restored.setBanterEnabled(true);
  const actor=restored.s.enemies[0];restored.s.elapsed=30;restored.speechUntil=0;
  actor.phase='chase';actor.cooldown=0;actor[`${prefix}Time`]=0;actor[`${prefix}AttackCount`]=0;actor[`${prefix}TauntAt`]=0;
  restored.updateEnemies(.01);restored.openEncounterDialogue();
  assert.equal(restored.s.mode,'dialogue');
  assert.deepEqual(restored.encounters.active.lines.map(line=>line.text),lines[0]);
  assert.deepEqual(captureRun(restoreRun(captureRun(restored))),captureRun(restored));
 });
 test(`${type}: full compact speech queue cannot invent a reply when rejected setup later has room`,()=>{
  const spoken=[],g=new Game({seed:43,onEvent:(kind,payload)=>{if(kind==='bark')spoken.push(payload.text);}});
  for(let i=0;i<17;i++)assert.equal(g.bark('TOMA',`Already queued ${i}`,true),true);
  g.speechUntil=0;
  const boss=g.spawnEnemy(type,100,0);boss.cooldown=0;g.updateEnemies(.01);
  g.clearSpeech();spoken.length=0;
  for(let i=0;i<100;i++){g.s.elapsed+=.05;g.updateEnemies(.05);g.flushSpeech();}
  assert.deepEqual(spoken,[]);
  assert.equal(boss[`${prefix}BanterIndex`]||0,0);
  assert.doesNotThrow(()=>restoreRun(captureRun(g)));
 });
}
