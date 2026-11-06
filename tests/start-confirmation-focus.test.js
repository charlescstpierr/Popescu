import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/asset-controller.js';

const key='toma-popescu-run-v1';
const record=a=>JSON.parse(a.values.get(key));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function saved(flow,onConfirm){
 let a,armed=false;
 const original=app(undefined,undefined,undefined,undefined,{onConfirm(){if(armed)onConfirm(a);}});
 await original.click('play');Object.assign(original.game.s,{elapsed:60,kills:7,coins:4});original.click('pause');await original.controller.persistRun();
 a=flow==='restart'?original:app(new Map(original.values),undefined,undefined,undefined,{onConfirm(){onConfirm(a);}});armed=true;
 return a;
}
function blurFocus(a){a.events.blur();a.events.focus();}

for(const flow of ['play','restart'])test(`${flow}: accepting a confirmation that briefly takes focus starts once`,async()=>{
 const a=await saved(flow,blurFocus),before=record(a),old=a.game;
 await a.click(flow);
 assert.equal(a.controller.screen,'hud');assert.notEqual(a.game,old);assert.equal(a.game.s.elapsed,0);
 assert.notEqual(record(a).run.id,before.run.id);assert.equal(record(a).revision,before.revision+1);
 assert.deepEqual(record(a).totals,{best:60,lifetime:7,coins:4});
 a.click('pause');await a.click('restart');assert.deepEqual(record(a).totals,{best:60,lifetime:7,coins:4});
});

for(const flow of ['play','restart'])test(`${flow}: cancelling after the confirmation focus cycle preserves the save bytes`,async()=>{
 const a=await saved(flow,blurFocus),before=a.values.get(key),old=a.game,id=a.controller.runId;
 a.confirm(false);await a.click(flow);
 assert.equal(a.controller.screen,flow==='play'?'menu':'pause-screen');assert.equal(a.game,old);assert.equal(a.controller.runId,id);assert.equal(a.values.get(key),before);
});

for(const flow of ['play','restart'])for(const interruption of ['blur','hidden-visible','pagehide',flow==='play'?'credits-back':'settings-back'])test(`${flow}: ${interruption} during confirmation cannot replace the saved run`,async()=>{
 const a=await saved(flow,a=>{
  blurFocus(a);
  if(interruption==='blur')a.events.blur();
  if(interruption==='hidden-visible'){a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;a.documentEvents.visibilitychange();}
  if(interruption==='pagehide')a.events.pagehide();
  if(interruption==='credits-back'){a.click('credits-open');a.click('credits-back');}
  if(interruption==='settings-back'){a.click('settings-open');a.click('settings-back');}
 }),before=record(a),old=a.game;
 await a.click(flow);await tick();
 assert.equal(a.controller.screen,flow==='play'?'menu':'pause-screen');assert.equal(a.game,old);
 assert.equal(record(a).run.id,before.run.id);assert.deepEqual(record(a).run.snapshot,before.run.snapshot);assert.deepEqual(record(a).totals,before.totals);
});

for(const flow of ['play','restart'])test(`${flow}: a later blur-focus while waiting for the lock still cancels an accepted confirmation`,async()=>{
 const a=await saved(flow,blurFocus),before=a.values.get(key),old=a.game,release=a.holdLock();let pending;
 try{pending=a.click(flow);await tick();blurFocus(a);}finally{release();await pending;}
 assert.equal(a.controller.screen,flow==='play'?'menu':'pause-screen');assert.equal(a.game,old);assert.equal(a.values.get(key),before);
});

test('accepting unsaved play after a confirmation focus cycle keeps the game explicitly nonpersistent',async()=>{
 let a;a=app(undefined,{},undefined,undefined,{onConfirm(){blurFocus(a);}});
 await a.click('play');assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.elapsed,0);assert.equal(a.values.has(key),false);
 assert.equal((await a.controller.persistRun()).reason,'inactive');
});
