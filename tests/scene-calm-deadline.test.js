import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {EVENTS,ROOSTER_REACTION} from '../dist/content.js';
import {beginSpeechScene,SCENE_CALM_WAIT} from '../dist/speech.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function waitingScene(){
 const g=new Game({seed:42,survivalDuration:1200});g.s.elapsed=30;
 g.world.getVisible=()=>[{type:'bench',x:g.s.x,y:g.s.y,w:24}];g.story(.01);
 const ape=g.spawnEnemy('orangutan',g.s.x+400,g.s.y);ape.windup=1;
 g.s.elapsed=g.speech.active.until+.001;g.flushSpeech();
 assert.equal(g.speech.scene.id,'street:bench');
 assert.equal(g.speech.active,null);
 return g;
}
function clearDanger(g){for(const e of g.s.enemies){e.windup=0;e.dead=true;}}
function roundTrip(g){const saved=captureRun(g),copy=restoreRun(saved);assert.deepEqual(captureRun(copy),saved);return copy;}
function expired(g){
 assert.equal(g.speech.scene,null,'the scene must expire at eight seconds');
 assert.equal(g.speech.queue.some(line=>line.sceneId),false,'no orphan scene cursor');
 assert.ok(g.eventSeen.has('skip:street:bench'));
 assert.equal(g.eventSeen.has('scene:street:bench'),false);
 roundTrip(g);
}

for(const restored of [false,true])for(const offset of [8,8.1]){
 test(`waiting scene expires behind real warnings at ${offset}s, restored=${restored}`,()=>{
  let g=waitingScene();const start=g.speech.scene.waitSince;
  g.announceEncounter('Une horde arrive.');g.s.elapsed=start+4;g.reactToCrow();
  assert.equal(g.speech.active.text,ROOSTER_REACTION.text);
  if(restored)g=roundTrip(g);
  const reaction=structuredClone(g.speech.active);g.s.elapsed=start+offset;g.flushSpeech();
  expired(g);assert.deepEqual(g.speech.active,reaction,'the urgent reaction keeps its reading budget');
  clearDanger(g);g.s.elapsed=reaction.until+.001;g.flushSpeech();assert.equal(g.speech.active,null);
 });
}
for(const offset of [SCENE_CALM_WAIT,SCENE_CALM_WAIT+.1]){
 test(`calm returning at ${offset}s cannot revive the waiting scene`,()=>{
  const g=waitingScene();g.s.elapsed=g.speech.scene.waitSince+offset;clearDanger(g);g.flushSpeech();
  expired(g);assert.equal(g.speech.active,null);
 });
}
test('calm before the deadline resumes the next authored line across save',()=>{
 const g=roundTrip(waitingScene());g.s.elapsed=g.speech.scene.waitSince+SCENE_CALM_WAIT-.001;
 clearDanger(g);g.flushSpeech();assert.equal(g.speech.active.text,EVENTS.bench[1].text);
 assert.equal(g.speech.scene.waitSince,undefined);assert.equal(g.eventSeen.has('skip:street:bench'),false);roundTrip(g);
});
test('pause freezes the deadline, but disabled banter still expires behind a warning',()=>{
 const g=waitingScene(),start=g.speech.scene.waitSince;g.announceEncounter('Une horde arrive.');
 g.setBanterEnabled(false);g.pause();const before=captureRun(g);g.update(30);assert.deepEqual(captureRun(g),before);
 g.resume();g.s.elapsed=start+SCENE_CALM_WAIT;g.flushSpeech();expired(g);
 g.setBanterEnabled(true);clearDanger(g);g.flushSpeech();assert.equal(g.speech.active,null);
});
test('a v15 waiting save at the deadline expires on its first speech update',()=>{
 const g=waitingScene();g.s.elapsed=g.speech.scene.waitSince+SCENE_CALM_WAIT;
 const saved=captureRun(g);saved.version=15;const copy=restoreRun(saved);
 assert.ok(copy);clearDanger(copy);copy.flushSpeech();expired(copy);
});
test('a scene without a calm gate resumes after a long interruption',()=>{
 const g=new Game({seed:42});g.s.elapsed=30;
 beginSpeechScene(g,'test-scene',EVENTS.bench,{remember:true});
 const first=g.speech.active.text;g.s.elapsed+=1;g.announceEncounter('Une horde arrive. '.repeat(30));
 assert.ok(g.speech.active.remaining>SCENE_CALM_WAIT);g.s.elapsed=g.speech.active.until+.001;g.flushSpeech();
 assert.equal(g.speech.active.text,first);assert.equal(g.speech.scene.id,'test-scene');roundTrip(g);
});
