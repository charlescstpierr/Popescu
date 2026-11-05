import test from 'node:test';
import assert from 'node:assert/strict';
import {locks} from 'node:worker_threads';
import {app} from './helpers/focus-controller.js';
const storageKey='toma-popescu-run-v1';
const native={skip:typeof locks?.request!=='function',timeout:5000};
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
const inputs=['volume','sound-setting','reduced-fx','banter-setting'];
const key=(a,target,repeat=false)=>a.events.keydown({key:'Escape',target,repeat,preventDefault(){}});
const saved=a=>a.values.get(storageKey);
async function setup(manager=locks){
 const a=app(undefined,manager);await a.click('play');
 Object.assign(a.game.s,{elapsed:60,kills:7,coins:4});a.click('pause');await a.controller.persistRun();return a;
}
async function hold(){let release,entered;const gate=new Promise(r=>release=r),acquired=new Promise(r=>entered=r);const held=locks.request(storageKey,async()=>{entered();await gate;});await acquired;return {release,held};}
function afterCommit(){let armed=false,entered,release;const committed=new Promise(r=>entered=r),gate=new Promise(r=>release=r);return {manager:{request(name,fn){return locks.request(name,async()=>{const result=fn();if(armed){armed=false;entered();await gate;}return result;});}},arm(){armed=true},committed,release};}
function loseAndRegain(a,kind){if(kind==='focus'){a.events.blur();a.events.focus();}else if(kind==='visibility'){a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;a.documentEvents.visibilitychange();}}
for(const id of inputs)for(const change of ['none','focus','visibility'])test(`waiting lock + ${id} Escape + ${change}: old run preserved and retry allowed`,native,async()=>{
 const a=await setup(),before=saved(a),old=a.game,oldId=a.controller.runId,gate=await hold();let pending;
 try{
  pending=a.click('restart');await flush();a.click('settings-open');const input=a.get(id);input.focus();loseAndRegain(a,change);key(a,input);
  assert.equal(a.controller.screen,'pause-screen');key(a,input,true);assert.equal(a.controller.screen,'pause-screen');
 }finally{gate.release();}
 await Promise.all([gate.held,pending]);await flush();
 const now=JSON.parse(saved(a)),was=JSON.parse(before);
 assert.equal(a.game,old);assert.equal(a.controller.runId,oldId);assert.equal(a.controller.screen,'pause-screen');
 assert.deepEqual(now.run.snapshot,was.run.snapshot);assert.deepEqual(now.totals,was.totals);assert.deepEqual(now.replay,was.replay);
 if(change!=='visibility')assert.equal(saved(a),before);
 a.controller.frame(performance.now()+1000);assert.equal(a.game.s.elapsed,60);
 await a.click('restart');assert.equal(a.controller.screen,'hud');assert.notEqual(a.controller.runId,oldId);assert.equal(JSON.parse(saved(a)).totals.lifetime,7);
});
for(const id of inputs)test(`settled commit + ${id} Escape: new run remains paused without duplicate credits`,native,async()=>{
 const gate=afterCommit(),a=await setup(gate.manager),oldId=a.controller.runId;gate.arm();const pending=a.click('restart');await gate.committed;const committed=JSON.parse(saved(a));
 try{
  assert.notEqual(committed.run.id,oldId);a.click('settings-open');const input=a.get(id);input.focus();key(a,input);key(a,input,true);assert.equal(a.controller.screen,'pause-screen');
 }finally{gate.release();}
 await pending;assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'paused');assert.equal(a.controller.runId,committed.run.id);
 a.controller.frame(performance.now()+1000);assert.equal(a.game.s.elapsed,0);assert.deepEqual(JSON.parse(saved(a)),committed);
 a.click('resume');assert.equal(a.controller.screen,'hud');a.game.s.elapsed=12;await a.controller.persistRun();assert.equal(JSON.parse(saved(a)).totals.lifetime,7);assert.equal(JSON.parse(saved(a)).totals.coins,4);
});
for(const id of [...inputs,'foreign'])test(`asset wait has Escape precedence for ${id} input, and late completion cannot start`,async()=>{
 const a=await setup(undefined),before=saved(a),old=a.game,oldId=a.controller.runId;let finish,ready=false;
 const result=new Promise(resolve=>finish=()=>{ready=true;resolve({ok:true});});
 a.controller.renderer.actors={available:()=>ready,ensureAnimalsReady:()=>result};
 const pending=a.click('restart');await flush();const input=id==='foreign'?a.document.createElement('input'):a.get(id);input.focus();
 key(a,input,true);assert.equal(a.get('loading').classList.contains('hidden'),false);
 key(a,input);await pending;assert.equal(a.get('loading').classList.contains('hidden'),true);finish();await flush();
 assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game,old);assert.equal(a.controller.runId,oldId);assert.equal(saved(a),before);
 await a.click('restart');assert.equal(a.controller.screen,'hud');assert.notEqual(a.controller.runId,oldId);
});
