// Run against unchanged published checkouts, not mock readers:
// node scripts/verify-save-compatibility.mjs /path/to/0d6e0f9 /path/to/da6a6ea8
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Game} from '../dist/engine.js';
import * as current from '../dist/run-save.js';

assert.equal(process.argv.length,4,'Pass the pre-Lamborghini and Lamborghini v12 checkout directories.');
assert.equal(typeof navigator.locks?.request,'function','Use Node with a native Web Locks implementation.');
const key='toma-popescu-run-v1';
const memory=raw=>{const data=new Map(raw===undefined?[]:[[key,raw]]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const builds=await Promise.all(process.argv.slice(2).map(async directory=>{
 const root=pathToFileURL(resolve(directory)+'/dist/');
 return {Game:(await import(new URL('engine.js',root))).Game,save:await import(new URL('run-save.js',root))};
}));
for(const build of builds)assert.equal(build.save.captureRun(new build.Game({seed:42})).version,12);

// Establish the original defect with both real, unchanged v12 implementations.
{
 const [old,latest]=builds,storage=memory(),g=new latest.Game({seed:42});
 g.s.upg.car=5;g.recalculate();g.timers.car=0;g.weapons(0);
 assert.equal(new latest.save.RunStore(storage).begin('convoy',g).ok,true);
 const reader=new old.save.RunStore(storage),read=reader.read();assert.equal(read.status,'ready');
 const game=old.save.restoreRun(read.value.run.snapshot);game.update(.05);
 assert.equal(reader.checkpoint('convoy',game).ok,true);
 assert.equal(new latest.save.RunStore(storage).read().status,'corrupt');
 console.log('Confirmed original v12 → old v12 → corrupt v12 sequence.');
}

assert.equal(current.captureRun(new Game({seed:42})).version,13);
const raw=readFileSync(new URL('../tests/fixtures/runstore-v12-legacy.json',import.meta.url),'utf8');
for(const [index,build] of builds.entries()){
 // A previously opened tab retains a real v12 Game and revision.
 const storage=memory(raw),stale=new build.save.RunStore(storage),read=stale.read();
 assert.equal(read.status,'ready');const staleGame=build.save.restoreRun(read.value.run.snapshot);
 const store=new current.RunStore(storage),fresh=store.read(),game=current.restoreRun(fresh.value.run.snapshot);
 assert.equal(store.checkpoint(fresh.value.run.id,game).ok,true);
 const protectedBytes=storage.getItem(key);assert.equal(JSON.parse(protectedBytes).version,13);
 assert.throws(()=>build.save.restoreRun(JSON.parse(protectedBytes).run.snapshot));
 for(const reader of [stale,new build.save.RunStore(storage)]){
  for(const attempt of [()=>reader.checkpoint(read.value.run.id,staleGame),()=>reader.begin('replacement',new build.Game({seed:7}))]){
   assert.deepEqual(attempt(),{ok:false,reason:'corrupt'});
   assert.equal(storage.getItem(key),protectedBytes);
  }
  assert.equal(reader.read().status,'corrupt');
 }
 const locked=new build.save.LockedRunStore(storage,navigator.locks);
 assert.equal((await locked.checkpoint(read.value.run.id,staleGame)).ok,false);
 assert.equal((await locked.begin('replacement',new build.Game({seed:7}))).ok,false);
 assert.equal(storage.getItem(key),protectedBytes);

 // Both browser adapters have already captured their v12 session while waiting.
 // Native Web Locks releases the v13 write first; old queued writes must re-read.
 for(const method of ['checkpoint','begin']){
  const data=memory(raw),a=new current.LockedRunStore(data,navigator.locks),b=new build.save.LockedRunStore(data,navigator.locks);
  const aRead=a.read(),bRead=b.read(),aGame=current.restoreRun(aRead.value.run.snapshot),bGame=build.save.restoreRun(bRead.value.run.snapshot);
  let entered,release;const started=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
  const held=navigator.locks.request(key,async()=>{entered();await gate;});await started;
  const newer=a.checkpoint(aRead.value.run.id,aGame);
  const older=method==='checkpoint'?b.checkpoint(bRead.value.run.id,bGame):b.begin('replacement',new build.Game({seed:7}));
  assert.equal(data.getItem(key),raw);release();await held;
  assert.equal((await newer).ok,true);const written=data.getItem(key);
  assert.deepEqual(await older,{ok:false,reason:'corrupt'});
  assert.equal(data.getItem(key),written);assert.equal(JSON.parse(written).version,13);
 }
 console.log(`Published v12 build ${index+1}: stale, fresh, browser and queued writers all preserve v13 bytes.`);
}

// Continuation equivalence uses the unchanged Lamborghini engine, including
// delayed escort, turn, return, interrupted speech and the legacy straight car.
for(const name of ['legacy','delay','turn','return']){
 const value=JSON.parse(readFileSync(new URL(`../tests/fixtures/runstore-v12-${name}.json`,import.meta.url),'utf8'));
 const expected=builds[1].save.restoreRun(value.run.snapshot),actual=current.restoreRun(value.run.snapshot);
 expected.resume();actual.resume();
 for(let i=0;i<90;i++){expected.update(.05,{x:1,y:0});actual.update(.05,{x:1,y:0});}
 const baseline=builds[1].save.captureRun(expected);baseline.version=13;
 assert.deepEqual(current.captureRun(actual),baseline);
}
console.log('Migration continuation matches the published Lamborghini engine for all four active vehicle states.');
