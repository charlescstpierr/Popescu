import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {PELICAN_BANTER} from '../dist/pelican.js';
import {TRAVESTIA_BANTER} from '../dist/travestia.js';

function fixture(type){
 const spoken=[],g=new Game({seed:43,onEvent:(kind,payload)=>{if(kind==='bark')spoken.push(payload);}});
 g.setPausedEncountersEnabled(true);g.encounters.outcomes[`boss:${type}`]='completed';
 const boss=g.spawnEnemy(type,100,0);boss.cooldown=0;g.updateEnemies(.01);
 return {g,boss,spoken,prefix:type==='pelican'?'peli':'tail',lines:(type==='pelican'?PELICAN_BANTER:TRAVESTIA_BANTER)[0]};
}
function advance(g,seconds){for(let t=0;t<seconds;t+=.05){g.s.elapsed+=.05;g.updateEnemies(.05);g.flushSpeech();}}
function combatState(boss){const state=structuredClone(boss);for(const key of ['peliReplyPending','peliReplyTime','tailReplyPending'])delete state[key];return state;}
for(const type of ['pelican','travestia']){
 test(`${type}: closing a compact setup cancels its delayed answer without changing the attack`,()=>{
  const {g,boss,spoken,prefix,lines}=fixture(type);assert.equal(spoken[0].text,lines[0]);assert.equal(boss[`${prefix}ReplyPending`],true);
  const before=combatState(boss);g.dismissSpeech();assert.deepEqual(combatState(boss),before);advance(g,6);
  assert.equal(spoken.some(line=>line.text===lines[1]),false);assert.equal(boss[`${prefix}ReplyPending`],false);
 });
 test(`${type}: closing a restored compact setup cannot resurrect its answer`,()=>{
  const {g,lines}=fixture(type),spoken=[];const r=restoreRun(captureRun(g),{onEvent:(kind,payload)=>{if(kind==='bark')spoken.push(payload);}});
  r.dismissSpeech();const saved=captureRun(r),resumed=restoreRun(saved,{onEvent:(kind,payload)=>{if(kind==='bark')spoken.push(payload);}});
  assert.deepEqual(captureRun(resumed),saved);advance(resumed,6);assert.equal(spoken.some(line=>line.text===lines[1]),false);
 });
 test(`${type}: closing a resumed setup also removes its already queued answer`,()=>{
  const {g,spoken,lines}=fixture(type);g.s.elapsed=.1;g.announceEncounter('Une horde arrive.');advance(g,4.6);
  assert.equal(g.speech.active.text,lines[0]);assert.ok(g.speech.queue.some(line=>line.text===lines[1]));
  g.dismissSpeech();advance(g,6);assert.equal(spoken.some(line=>line.text===lines[1]),false);
 });
 test(`${type}: closing an urgent interruption leaves the underlying conversation intact`,()=>{
  const {g,spoken,lines}=fixture(type);g.s.elapsed=.1;g.announceEncounter('Une horde arrive.');g.dismissSpeech();advance(g,9);
  assert.ok(spoken.some(line=>line.text===lines[1]));
 });
 test(`${type}: an undismissed setup still gets its exact authored reply`,()=>{
  const {g,spoken,lines}=fixture(type);advance(g,9);assert.deepEqual(spoken.map(line=>line.text),lines);
 });
}

for(const type of ['pelican','travestia']){
 test(`${type}: dismissal keeps unrelated queued dialogue and does not consume the next pair`,()=>{
  const {g,boss,prefix}=fixture(type),other=g.spawnEnemy('rival_goat',200,0);
  assert.equal(g.bark('BOUC RIVAL','Je reste dans la file.',true,{actorId:other.id}),true);
  g.dismissSpeech();assert.ok(g.speech.queue.some(line=>line.actorId===other.id));
  g.clearSpeech();g.s.elapsed=30;boss.phase='chase';boss.cooldown=0;boss[`${prefix}Time`]=0;boss[`${prefix}AttackCount`]=2;boss[`${prefix}TauntAt`]=0;
  g.updateEnemies(.01);const next=(type==='pelican'?PELICAN_BANTER:TRAVESTIA_BANTER)[1];
  assert.equal(g.speech.active.text,next[0]);assert.equal(boss[`${prefix}Reply`],next[1]);
 });
}
