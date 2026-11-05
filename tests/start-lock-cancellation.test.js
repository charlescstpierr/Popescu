import test from 'node:test';
import assert from 'node:assert/strict';
import {locks} from 'node:worker_threads';
import {app} from './helpers/asset-controller.js';

const native={skip:typeof locks?.request!=='function',timeout:5000};
const key='toma-popescu-run-v1';
const record=a=>JSON.parse(a.values.get(key));
const flush=async()=>{for(let n=0;n<20;n++)await Promise.resolve();};
async function holdLock(){
 let release,entered;const acquired=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 const held=locks.request(key,async()=>{entered();await gate;});await acquired;return {release,held};
}
async function savedApp(flow,manager=locks){
 const original=app(undefined,manager);await original.click('play');
 Object.assign(original.game.s,{elapsed:60,kills:7,coins:4});original.click('pause');await original.controller.persistRun();
 return flow==='restart'?original:app(new Map(original.values),manager);
}
function interrupt(a,kind){
 if(kind==='blur'||kind==='blur-focus'){a.events.blur();if(kind==='blur-focus')a.events.focus();}
 else if(kind==='hidden'||kind==='hidden-visible'){a.document.hidden=true;a.documentEvents.visibilitychange();if(kind==='hidden-visible'){a.document.hidden=false;a.documentEvents.visibilitychange();}}
 else if(kind==='pagehide')a.events.pagehide();
 else if(kind==='credits')a.click('credits-open');
 else if(kind==='credits-back'){a.click('credits-open');a.click('credits-back');}
 else if(kind==='settings')a.click('settings-open');
 else if(kind==='settings-back'){a.click('settings-open');a.click('settings-back');}
}
// Removing the attempt guard inside the Web Lock replaces the previous save,
// even if a later UI-only check suppresses the unwanted HUD transition.
for(const flow of ['play','restart'])for(const kind of ['blur','blur-focus','hidden','hidden-visible','pagehide',...(flow==='play'?['credits','credits-back']:['settings','settings-back'])]){
 test(`${flow}: ${kind} cancels a queued replacement without losing the saved run`,native,async()=>{
  const a=await savedApp(flow),before=record(a),old=a.game,oldId=a.controller.runId,lock=await holdLock();let pending,expectedScreen;
  try{
   pending=a.click(flow);await flush();interrupt(a,kind);expectedScreen=a.controller.screen;
   assert.equal(a.game,old);assert.equal(a.controller.runId,oldId);
  }finally{lock.release();}
  await Promise.all([pending,lock.held]);await flush();
  assert.equal(a.controller.screen,expectedScreen);assert.equal(a.game,old);assert.equal(a.controller.runId,oldId);
  const after=record(a);assert.equal(after.run.id,before.run.id);assert.deepEqual(after.run.snapshot,before.run.snapshot);assert.deepEqual(after.totals,before.totals);assert.deepEqual(after.replay,before.replay);
  // Visibility/pagehide can legitimately flush the unchanged old live session.
  if(flow==='play'||!['hidden','hidden-visible','pagehide'].includes(kind))assert.deepEqual(after,before);
  if(a.game){a.controller.frame(performance.now()+1000);assert.equal(a.game.s.elapsed,60);}
  a.document.hidden=false;a.documentEvents.visibilitychange();a.events.focus();
  if(flow==='play'&&a.controller.screen==='credits')a.click('credits-back');
  if(flow==='restart'&&a.controller.screen==='settings')a.click('settings-back');
  await a.click(flow);assert.equal(a.controller.screen,'hud');assert.notEqual(a.controller.runId,oldId);assert.equal(a.game.s.elapsed,0);
  assert.equal(record(a).totals.lifetime,7);assert.equal(record(a).totals.coins,4);
 });
}

// Delayed settlement is separate from delayed acquisition: the transaction has
// already committed, so cancelling must not roll it back or credit it twice.
function afterCommitLock(){
 let active=false,entered,release;
 const committed=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 return {manager:{request(name,fn){return locks.request(name,async()=>{const result=fn();if(active){active=false;entered();await gate;}return result;});}},arm(){active=true;},committed,release};
}
for(const flow of ['play','restart'])for(const kind of ['blur','hidden',flow==='play'?'credits':'settings']){
 test(`${flow}: ${kind} after commit never activates combat or rolls back the replacement`,native,async()=>{
  const held=afterCommitLock(),a=await savedApp(flow,held.manager),oldId=record(a).run.id;
  held.arm();const pending=a.click(flow);await held.committed;const committed=record(a);assert.notEqual(committed.run.id,oldId);
  interrupt(a,kind);const newerScreen=a.controller.screen;held.release();await pending;await flush();
  assert.notEqual(a.controller.screen,'hud');if(['credits','settings'].includes(kind))assert.equal(a.controller.screen,newerScreen);
  a.controller.frame(performance.now()+1000);assert.equal(a.game?.s.elapsed||0,0);
  assert.equal(record(a).run.id,committed.run.id);assert.deepEqual(record(a).totals,committed.totals);
  a.document.hidden=false;a.documentEvents.visibilitychange();a.events.focus();
  if(a.controller.screen==='credits')a.click('credits-back');if(a.controller.screen==='settings')a.click('settings-back');
  if(a.controller.screen==='menu')await a.click('resume-saved');
  assert.equal(a.controller.screen,'pause-screen');a.click('resume');assert.equal(a.controller.screen,'hud');
  assert.equal(a.controller.runId,committed.run.id);assert.equal(a.game.s.elapsed,0);
  await a.click('pause-menu');assert.equal(record(a).totals.lifetime,7);assert.equal(record(a).totals.coins,4);
 });
}

test('a newer story view survives a late committed start without being replaced',native,async()=>{
 const held=afterCommitLock(),a=await savedApp('play',held.manager);held.arm();const pending=a.click('play');await held.committed;
 a.click('story');const story=a.game;held.release();await pending;
 assert.equal(a.controller.screen,'dialogue');assert.equal(a.game,story);assert.equal(a.controller.runId,null);assert.equal(a.game.s.elapsed,0);
 a.click('skip-dialogue');assert.equal(a.controller.screen,'menu');assert.equal(record(a).totals.lifetime,7);
 await a.click('resume-saved');assert.equal(a.controller.screen,'pause-screen');
});

test('interruption before a save failure suppresses a stale unsaved-play confirmation',async()=>{
 let a,confirmations=0,interruptOnUnlock=false;
 a=app(undefined,{},undefined,undefined,{onAudioUnlock(){if(interruptOnUnlock)a.events.blur();},onConfirm(){confirmations++;}});
 a.confirm(true);a.document.hidden=false;interruptOnUnlock=true;
 // A true confirmation would let main's failed write enter unsaved HUD. The
 // repaired controller must instead keep the menu without asking the question.
 const original=a.get('play').onclick;await original();assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.equal(a.values.has(key),false);assert.equal(confirmations,0);
});

test('normal queued start still commits once and saves playable progress',native,async()=>{
 const a=await savedApp('play'),before=record(a),lock=await holdLock();let pending;
 try{pending=a.click('play');await flush();assert.deepEqual(record(a),before);}finally{lock.release();}
 await Promise.all([pending,lock.held]);assert.equal(a.controller.screen,'hud');assert.equal(record(a).revision,before.revision+1);assert.equal(record(a).totals.lifetime,7);
 a.game.s.elapsed=12;await a.controller.persistRun();a.click('pause');await a.click('pause-menu');await a.click('resume-saved');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.elapsed,12);a.click('resume');assert.equal(a.controller.screen,'hud');
});

test('losing focus during the unsaved-play confirmation does not activate the game',async()=>{
 let a,confirmations=0;
 a=app(undefined,{},undefined,undefined,{onConfirm(){confirmations++;a.events.blur();}});
 await a.click('play');assert.equal(confirmations,1);assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.equal(a.values.has(key),false);
 a.events.focus();a.confirm(false);await a.click('play');assert.equal(a.controller.screen,'menu');
});

test('interrupted first opening after commit resumes its exact dialogue only on request',native,async()=>{
 const held=afterCommitLock(),a=app(new Map(),held.manager);held.arm();const pending=a.click('play');await held.committed;
 const committed=record(a);a.events.blur();held.release();await pending;
 assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'dialogue');assert.equal(a.game.s.elapsed,0);assert.deepEqual(record(a),committed);
 a.events.focus();a.controller.frame(performance.now()+1000);assert.deepEqual(record(a),committed);assert.equal(a.controller.screen,'pause-screen');
 a.click('resume');assert.equal(a.controller.screen,'dialogue');assert.match(a.get('dialogue-progress').textContent,/^1 \/ /);a.click('skip-dialogue');assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.elapsed,0);
 await a.controller.persistRun();assert.equal(record(a).run.id,committed.run.id);assert.equal(record(a).run.snapshot.game.s.mode,'playing');
});
