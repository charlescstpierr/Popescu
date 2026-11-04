import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {RunStore,LockedRunStore,captureRun,restoreRun} from '../dist/run-save.js';

// Produced by the published v12 builds, not relabelled current snapshots.
// See fixtures/runstore-v12-provenance.md for source commits and generation.
const key='toma-popescu-run-v1';
const memory=raw=>{const data=new Map(raw===undefined?[]:[[key,raw]]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const fixture=name=>readFileSync(new URL(`./fixtures/runstore-v12-${name}.json`,import.meta.url),'utf8');

test('new writes use v13 for both envelope and snapshot to exclude incompatible v12 engines',()=>{
 const storage=memory(),store=new RunStore(storage),g=new Game({seed:42});
 g.s.upg.car=5;g.recalculate();g.timers.car=0;g.weapons(0);
 assert.equal(store.begin('convoy',g).ok,true);
 const value=JSON.parse(storage.getItem(key));
 assert.equal(value.version,13);assert.equal(value.run.snapshot.version,13);
 assert.equal(value.run.snapshot.game.s.vehicles[1].carDelay,.3);
});

for(const name of ['legacy','delay','turn','return','dialogue'])test(`real v12 ${name} record migrates without resetting state, credit or history`,()=>{
 const raw=fixture(name),original=JSON.parse(raw),storage=memory(raw),store=new RunStore(storage);
 assert.equal(original.version,12);assert.equal(original.run.snapshot.version,12);
 const read=store.read();assert.equal(read.status,'ready');
 const expected=structuredClone(original);expected.version=13;expected.run.snapshot.version=13;
 assert.deepEqual(read.value,expected);
 assert.equal(storage.getItem(key),raw,'read-only migration preserves original bytes');
 const game=restoreRun(read.value.run.snapshot);
 assert.deepEqual(captureRun(game,original.run.snapshot.dialogue),expected.run.snapshot);
 assert.equal(store.checkpoint(original.run.id,game,{dialogue:original.run.snapshot.dialogue}).ok,true);
 const saved=JSON.parse(storage.getItem(key));expected.revision++;
 assert.deepEqual(saved,expected,'first write changes only versions and revision');
 assert.equal(new RunStore(storage).read().status,'ready');
 assert.equal(store.checkpoint(original.run.id,game,{credit:true,dialogue:original.run.snapshot.dialogue}).ok,true);
 const credited=store.read().value;
 assert.equal(credited.totals.lifetime,original.totals.lifetime+2);
 assert.equal(credited.totals.coins,original.totals.coins+1);
 assert.deepEqual(credited.replay,original.replay);
 assert.equal(store.checkpoint(original.run.id,game,{credit:true,dialogue:original.run.snapshot.dialogue}).ok,true);
 assert.deepEqual(store.read().value.totals,credited.totals,'repeated credit is idempotent');
});

test('failed v12 migration write retains the complete original record for retry',()=>{
 const raw=fixture('delay'),storage=memory(raw),store=new RunStore(storage),read=store.read(),game=restoreRun(read.value.run.snapshot);
 const write=storage.setItem;storage.setItem=()=>{throw Error('quota');};
 assert.deepEqual(store.checkpoint(read.value.run.id,game),{ok:false,reason:'write-failed'});
 assert.equal(storage.getItem(key),raw);
 storage.setItem=write;assert.equal(store.checkpoint(read.value.run.id,game).ok,true);
 assert.equal(JSON.parse(storage.getItem(key)).version,13);
});

test('invalid v12 car state is rejected without rewriting or inventing recovery data',()=>{
 const value=JSON.parse(fixture('delay'));value.run.snapshot.game.s.vehicles[1].x+=29.75;
 const raw=JSON.stringify(value),storage=memory(raw),store=new RunStore(storage);
 assert.equal(store.read().status,'corrupt');assert.equal(store.begin('replacement',new Game()).ok,false);
 assert.equal(storage.getItem(key),raw);
});

test('new-format migration through the browser adapter preserves queued request-time state',async()=>{
 const raw=fixture('turn'),storage=memory(raw);let release;
 const gate=new Promise(resolve=>release=resolve),store=new LockedRunStore(storage,{request:async(_key,fn)=>{await gate;return fn();}});
 const read=store.read(),game=restoreRun(read.value.run.snapshot),expected=captureRun(game);
 const pending=store.checkpoint(read.value.run.id,game);game.s.kills+=100;
 assert.equal(storage.getItem(key),raw);release();assert.equal((await pending).ok,true);
 const saved=JSON.parse(storage.getItem(key));assert.equal(saved.version,13);assert.deepEqual(saved.run.snapshot,expected);
});
