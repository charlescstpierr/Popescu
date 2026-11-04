import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/asset-controller.js';
const visible=(a,id)=>!a.get(id).classList.contains('hidden');
const flush=async()=>{for(let n=0;n<8;n++)await Promise.resolve();};
function controlled(){
 let loaded=false,calls=0,pending=[];
 return {available:()=>loaded,ensureAnimalsReady(){calls++;return new Promise(resolve=>pending.push(resolve));},finish(ok,reason='failed'){loaded=ok;pending.splice(0).forEach(r=>r(ok?{ok:true}:{ok:false,reason}));},get calls(){return calls;}};
}
async function saved(){const a=app();await a.click('play');a.game.s.elapsed=60;await a.controller.persistRun();return new Map(a.values);}

test('new run cannot start, simulate or write a save while required animal art is pending',async()=>{
 const actors=controlled(),a=app(undefined,undefined,undefined,undefined,{actors}),before=[...a.values];
 const started=a.click('play');await flush();
 assert.equal(a.game,null);assert.equal(a.controller.screen,'menu');assert(visible(a,'loading'));assert.deepEqual([...a.values],before);
 a.controller.frame(performance.now()+500);assert.equal(a.game,null);assert.deepEqual([...a.values],before);
 actors.finish(true);await started;assert.equal(a.controller.screen,'hud');assert.equal(a.game.s.mode,'playing');assert(!visible(a,'loading'));
});

test('failed new run preserves an existing save byte for byte and allows explicit retry',async()=>{
 const values=await saved(),actors=controlled(),a=app(values,undefined,undefined,undefined,{actors}),before=[...values];
 const first=a.click('play');await flush();actors.finish(false);await first;
 assert.equal(a.game,null);assert.equal(a.controller.screen,'menu');assert.deepEqual([...values],before);assert(!visible(a,'loading'));assert(visible(a,'toast'));assert.match(a.get('toast').textContent,/chargement|images/i);
 const retry=a.click('play');await flush();assert.equal(actors.calls,2);actors.finish(true);await retry;
 assert.equal(a.controller.screen,'hud');assert.notDeepEqual([...values],before);assert(!visible(a,'toast'));
});

test('saved resume waits without restoring or rewriting the snapshot, then keeps recovery pause',async()=>{
 const values=await saved(),actors=controlled(),a=app(values,undefined,undefined,undefined,{actors}),before=[...values];
 const resumed=a.click('resume-saved');await flush();
 assert.equal(a.game,null);assert.equal(a.controller.screen,'menu');assert.deepEqual([...values],before);
 a.controller.frame(performance.now()+500);assert.deepEqual([...values],before);
 actors.finish(true);await resumed;assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'paused');assert.equal(a.game.s.elapsed,60);assert.deepEqual([...values],before);
 a.click('resume');assert.equal(a.game.s.mode,'playing');
});

test('saved resume failure and timeout stay read-only and report a retryable error',async()=>{
 for(const reason of ['failed','timeout']){
  const values=await saved(),actors=controlled(),a=app(values,undefined,undefined,undefined,{actors}),before=[...values];
  const resumed=a.click('resume-saved');await flush();actors.finish(false,reason);await resumed;
  assert.equal(a.game,null);assert.equal(a.controller.screen,'menu');assert.deepEqual([...values],before);assert(!visible(a,'loading'));assert(visible(a,'toast'));assert.match(a.get('toast').textContent,/réess|recomm|nouveau/i);
  if(reason==='timeout')assert.match(a.get('toast').textContent,/temps|long|délai/i);
 }
});

test('repeated play and saved resume clicks share one guarded transition',async()=>{
 const actors=controlled(),a=app(await saved(),undefined,undefined,undefined,{actors});
 const first=a.click('play');await flush();await a.click('play');await a.click('resume-saved');assert.equal(actors.calls,1);assert.equal(a.game,null);
 actors.finish(true);await first;const id=a.controller.runId;assert.equal(a.controller.screen,'hud');assert(id);
});

test('canceling an asset wait with Escape leaves the saved run intact and ignores late completion',async()=>{
 const values=await saved(),actors=controlled(),a=app(values,undefined,undefined,undefined,{actors}),before=[...values];
 const first=a.click('play');await flush();a.events.keydown({key:'Escape',repeat:false,target:{}});await first;
 assert.equal(a.controller.screen,'menu');assert.equal(a.game,null);assert.deepEqual([...values],before);assert(!visible(a,'loading'));
 actors.finish(true);await flush();assert.equal(a.game,null);assert.deepEqual([...values],before);
 await a.click('resume-saved');assert.equal(a.controller.screen,'pause-screen');
});

test('navigation during a load cannot be overwritten by its stale start continuation',async()=>{
 const actors=controlled(),a=app(undefined,undefined,undefined,undefined,{actors});
 const first=a.click('play');await flush();a.click('credits-open');await first;
 actors.finish(true);await flush();assert.equal(a.controller.screen,'credits');assert.equal(a.game,null);assert(!visible(a,'loading'));
});

test('blur or backgrounding cancels pending entry rather than starting play without attention',async()=>{
 for(const event of ['blur','visibility']){
  const actors=controlled(),a=app(undefined,undefined,undefined,undefined,{actors});
  const first=a.click('play');await flush();if(event==='blur')a.events.blur();else{a.document.hidden=true;a.documentEvents.visibilitychange();}await first;
  actors.finish(true);await flush();assert.equal(a.game,null);assert.equal(a.controller.screen,'menu');assert(!visible(a,'loading'));
 }
});

test('retry from a paused existing run preserves its state and storage when assets fail',async()=>{
 const a=app();await a.click('play');a.click('pause');await a.controller.persistRun();const before=[...a.values],snapshot=JSON.stringify(a.game.s),actors=controlled();a.controller.renderer.actors=actors;
 const restart=a.click('restart');await flush();actors.finish(false);await restart;
 assert.equal(a.controller.screen,'pause-screen');assert.equal(JSON.stringify(a.game.s),snapshot);assert.deepEqual([...a.values],before);
});

for(const [width,height]of [[320,568],[390,844],[430,932]])test(`touch input stays inactive during asset wait and resets before play at ${width}x${height}`,async()=>{
 const actors=controlled(),rect={left:7,top:11,width,height},a=app(undefined,undefined,undefined,rect,{actors});
 const first=a.click('play');await flush();const el=a.get('app'),event={pointerId:12,clientX:rect.left+45,clientY:rect.top+height*.75,target:{closest:()=>null},preventDefault(){}};
 el.dispatch('pointerdown',event);el.dispatch('pointermove',{...event,clientX:event.clientX+35});assert.equal(a.controller.inputState.pointer,null);assert.equal(a.game,null);
 actors.finish(true);await first;assert.equal(a.controller.inputState.pointer,null);
 el.dispatch('pointerdown',event);el.dispatch('pointermove',{...event,clientX:event.clientX+35});assert.equal(a.controller.inputState.pointer,12);assert(a.controller.inputState.input.x>0);el.dispatch('pointercancel',event);assert.equal(a.controller.inputState.pointer,null);
});

test('a successful saved-resume retry clears only the previous asset error',async()=>{
 const actors=controlled(),a=app(await saved(),undefined,undefined,undefined,{actors});
 let resume=a.click('resume-saved');await flush();actors.finish(false);await resume;assert(visible(a,'toast'));
 resume=a.click('resume-saved');await flush();actors.finish(true);await resume;assert.equal(a.controller.screen,'pause-screen');assert(!visible(a,'toast'));
});

test('saved resume re-reads storage after waiting instead of restoring a stale snapshot',async()=>{
 const values=await saved(),actors=controlled(),a=app(values,undefined,undefined,undefined,{actors});
 const resumed=a.click('resume-saved');await flush();
 const other=app(values);await other.click('resume-saved');other.game.s.elapsed=123;await other.controller.persistRun();const latest=values.get('toma-popescu-run-v1');
 actors.finish(true);await resumed;assert.equal(a.game.s.elapsed,123);assert.equal(values.get('toma-popescu-run-v1'),latest);
});

test('a rejected loader surfaces failure without leaving loading or the transition locked',async()=>{
 const actors={available:()=>false,ensureAnimalsReady:async()=>{throw Error('image loader failed');}},a=app(undefined,undefined,undefined,undefined,{actors});
 await a.click('play');assert.equal(a.game,null);assert(!visible(a,'loading'));assert(visible(a,'toast'));
 a.controller.renderer.actors={available:()=>true};await a.click('play');assert.equal(a.controller.screen,'hud');
});

test('the initial play gesture unlocks audio before waiting for animal images',async()=>{
 let unlocks=0;const actors=controlled(),a=app(undefined,undefined,undefined,undefined,{actors,onAudioUnlock:()=>unlocks++});
 const play=a.click('play');assert.equal(unlocks,1);await flush();actors.finish(true);await play;assert.equal(unlocks,1);
});
