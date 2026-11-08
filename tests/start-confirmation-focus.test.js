import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/asset-controller.js';

const key='toma-popescu-run-v1';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const manual={manualStartConfirmation:true,onConfirm(){assert.fail('Replacing a saved run must not open a native confirmation');}};
async function saved(flow){
 const original=app(undefined,undefined,undefined,undefined,manual);
 await original.click('play');Object.assign(original.game.s,{elapsed:60,kills:7,coins:4});original.click('pause');await original.controller.persistRun();
 return flow==='restart'?original:app(new Map(original.values),undefined,undefined,undefined,manual);
}
function blurFocus(a){a.events.blur();a.events.focus();}

for(const flow of ['play','restart'])test(`${flow}: choosing a new run works after returning focus to its in-game confirmation`,async()=>{
 const a=await saved(flow),before=JSON.parse(a.values.get(key)),old=a.game;
 await a.click(flow);assert.equal(a.controller.screen,'new-run-confirm');
 await tick();blurFocus(a);await a.click('new-run-start');
 assert.equal(a.controller.screen,'hud');assert.notEqual(a.game,old);assert.equal(a.game.s.elapsed,0);
 const after=JSON.parse(a.values.get(key));assert.notEqual(after.run.id,before.run.id);assert.equal(after.revision,before.revision+1);
 assert.deepEqual(after.totals,{best:60,lifetime:7,coins:4});
});

for(const flow of ['play','restart'])test(`${flow}: cancel after a focus cycle preserves saved bytes`,async()=>{
 const a=await saved(flow),before=a.values.get(key),old=a.game,id=a.controller.runId;
 await a.click(flow);blurFocus(a);a.click('new-run-cancel');
 assert.equal(a.controller.screen,flow==='play'?'menu':'pause-screen');assert.equal(a.game,old);assert.equal(a.controller.runId,id);assert.equal(a.values.get(key),before);
});

for(const flow of ['play','restart'])for(const interruption of ['blur','hidden','pagehide',flow==='play'?'credits-back':'settings-back'])test(`${flow}: ${interruption} while acquiring the lock still cancels an accepted choice`,async()=>{
 const a=await saved(flow),before=a.values.get(key),old=a.game;
 await a.click(flow);const release=a.holdLock();let pending;
 try{
  pending=a.click('new-run-start');await tick();
  if(interruption==='blur')blurFocus(a);
  if(interruption==='hidden'){a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;a.documentEvents.visibilitychange();}
  if(interruption==='pagehide')a.events.pagehide();
  if(interruption==='credits-back'){a.click('credits-open');a.click('credits-back');}
  if(interruption==='settings-back'){a.click('settings-open');a.click('settings-back');}
 }finally{release();await pending;}
 assert.equal(a.controller.screen,flow==='play'?'menu':'pause-screen');assert.equal(a.game,old);
 const was=JSON.parse(before),now=JSON.parse(a.values.get(key));assert.deepEqual(now.run,was.run);assert.deepEqual(now.totals,was.totals);assert.deepEqual(now.replay,was.replay);
 if(flow==='play'||!['hidden','pagehide'].includes(interruption))assert.equal(a.values.get(key),before);
});

test('accepting unsaved play after a native confirmation focus cycle keeps the game explicitly nonpersistent',async()=>{
 let a;a=app(undefined,{},undefined,undefined,{onConfirm(){blurFocus(a);}});
 await a.click('play');assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.elapsed,0);assert.equal(a.values.has(key),false);
 assert.equal((await a.controller.persistRun()).reason,'inactive');
});
