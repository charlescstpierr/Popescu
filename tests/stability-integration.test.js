import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/asset-controller.js';
import {ActorArt} from '../dist/actor-art.js';
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const progress=a=>a.get('dialogue-progress').textContent;
const interval=a=>Math.max(2500,a.get('dialogue-text').textContent.length*48);
const advanceAll=t=>{for(let n=0;n<7;n++)t.mock.timers.tick(20000);};
function loader(){
 const pending=[],timers=new Map();let id=0;
 const art=new ActorArt({loadImage(path){if(!path.includes('animals-approved'))return null;return new Promise((resolve,reject)=>pending.push({resolve,reject}));},timers:{setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout(key){timers.delete(key);}}});
 return {art,pending,success(index=pending.length-1){pending[index].resolve({width:1254,height:1254});},timeout(){for(const callback of [...timers.values()])callback();}};
}
async function savedCompanion(){
 const a=app();await a.click('play');a.game.rng=4;a.game.gainXP(8);const index=a.game.s.options.findIndex(o=>o.id==='girlfriend');assert(index>=0);a.get('upgrade-options').children[index].dispatch('click',{});a.click('next-dialogue');assert.equal(progress(a),'2 / 5');await a.controller.persistRun();return new Map(a.values);
}
for(const interrupt of ['blur','hidden'])test(`${interrupt} cancels image-gated dialogue recovery and later AUTO still respects focus`,async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const values=await savedCompanion(),before=[...values],l=loader(),a=app(values,undefined,undefined,undefined,{actors:l.art});
 const wait=a.click('resume-saved');await flush();assert.equal(a.game,null);
 if(interrupt==='blur')a.events.blur();else{a.document.hidden=true;a.documentEvents.visibilitychange();}
 await wait;l.success();await flush();advanceAll(t);assert.equal(a.game,null);assert.deepEqual([...values],before);
 a.document.hidden=false;a.documentEvents.visibilitychange();a.events.focus();await a.click('resume-saved');assert.equal(a.controller.screen,'pause-screen');assert.deepEqual([...values],before);a.click('resume');assert.equal(progress(a),'2 / 5');
 a.click('auto-dialogue');a.events.blur();advanceAll(t);assert.equal(progress(a),'2 / 5');assert.equal(a.game.s.elapsed,0);
 for(let i=0;i<5;i++)a.events.focus();t.mock.timers.tick(interval(a));assert.equal(progress(a),'3 / 5');
});

test('timeout retry restores the saved dialogue but focus never bypasses recovery pause',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const values=await savedCompanion(),before=[...values],l=loader(),a=app(values,undefined,undefined,undefined,{actors:l.art});
 const first=a.click('resume-saved');await flush();l.timeout();await first;assert.equal(a.game,null);assert.deepEqual([...values],before);
 const retry=a.click('resume-saved');await flush();l.success(0);await flush();a.events.focus();advanceAll(t);assert.equal(a.game,null);assert.deepEqual([...values],before);
 l.success(1);await retry;a.events.blur();a.events.focus();advanceAll(t);assert.equal(a.controller.screen,'pause-screen');assert.deepEqual([...values],before);
 a.click('resume');assert.equal(progress(a),'2 / 5');a.click('auto-dialogue');t.mock.timers.tick(interval(a));assert.equal(progress(a),'3 / 5');
});

test('visibility before focus after loading cannot rearm AUTO or resume simulation',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const l=loader(),a=app(await savedCompanion(),undefined,undefined,undefined,{actors:l.art});
 const wait=a.click('resume-saved');await flush();l.success();await wait;a.click('resume');a.click('auto-dialogue');a.events.blur();a.document.hidden=true;a.documentEvents.visibilitychange();a.document.hidden=false;a.documentEvents.visibilitychange();advanceAll(t);a.controller.frame(performance.now()+1000);
 assert.equal(progress(a),'2 / 5');assert.equal(a.game.s.mode,'dialogue');assert.equal(a.game.s.elapsed,0);
 a.events.focus();t.mock.timers.tick(interval(a));assert.equal(progress(a),'3 / 5');
});

test('focus before visibility after loading waits for visibility and schedules only one AUTO step',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const l=loader(),a=app(await savedCompanion(),undefined,undefined,undefined,{actors:l.art});
 const wait=a.click('resume-saved');await flush();l.success();await wait;a.click('resume');a.click('auto-dialogue');a.events.blur();a.document.hidden=true;a.documentEvents.visibilitychange();a.events.focus();advanceAll(t);assert.equal(progress(a),'2 / 5');
 a.document.hidden=false;a.documentEvents.visibilitychange();t.mock.timers.tick(interval(a));assert.equal(progress(a),'3 / 5');
});

test('a successful image retry does not lose initial unfocused AUTO state',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const l=loader(),a=app(await savedCompanion(),undefined,undefined,undefined,{actors:l.art,focused:false});
 const wait=a.click('resume-saved');await flush();l.pending[0].reject(Error('decode failed'));await wait;
 const retry=a.click('resume-saved');await flush();l.success();await retry;a.click('resume');a.click('auto-dialogue');advanceAll(t);assert.equal(progress(a),'2 / 5');
 a.events.focus();t.mock.timers.tick(interval(a));assert.equal(progress(a),'3 / 5');
});
