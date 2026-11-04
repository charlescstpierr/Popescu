import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {RunStore,captureRun,restoreRun} from '../dist/run-save.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const record=store=>{const result=store.read();assert.equal(result.status,'ready');return result.value;};

test('same-frame warning interruptions remain valid across floating-point reading times',()=>{
 for(const at of [0,10,35,1200,5000]){
  const g=new Game({seed:9});g.s.elapsed=at;g.bark('TOMA','Une ligne.',true);g.announceEncounter('Une horde arrive.');
  const snapshot=captureRun(g);assert.deepEqual(captureRun(restoreRun(snapshot)),snapshot);
 }
});

test('published v10 Charles saves acquire speech and replay metadata without changing storage on read',()=>{
 const storage=memory(),store=new RunStore(storage),g=new Game({seed:72});
 g.s.elapsed=1200;g.s.mode='victory';assert.ok(g.startCharlesEpilogue());
 assert.ok(store.begin('legacy-charles',g,{best:1400,lifetime:19,coins:7}).ok);
 const old=JSON.parse(storage.getItem(store.key));old.version=10;old.run.snapshot.version=10;delete old.run.snapshot.game.speech;delete old.replay;
 const raw=JSON.stringify(old);storage.setItem(store.key,raw);
 const migratedStore=new RunStore(storage),saved=record(migratedStore);
 assert.equal(storage.getItem(store.key),raw);assert.deepEqual(saved.totals,old.totals);
 assert.equal(saved.version,12);assert.equal(saved.replay.legacyBest,1400);assert.deepEqual(saved.replay.history,[]);
 const resumed=restoreRun(saved.run.snapshot);assert.deepEqual(resumed.s.charles,g.s.charles);assert.equal(resumed.speech.active,null);
 assert.ok(migratedStore.checkpoint('legacy-charles',resumed,{credit:true}).ok);
 assert.equal(record(migratedStore).replay.history[0].outcome,'victory');
});

test('interrupted speech and a factual defeat are preserved together through save and resume',()=>{
 const store=new RunStore(memory()),g=new Game({seed:987});assert.ok(store.begin('defeat',g).ok);
 g.s.elapsed=20;g.bark('TOMA','Cette phrase doit survivre à une interruption.',true);
 g.s.elapsed+=1;g.announceEncounter('Attention, une horde arrive.');
 const enemy=g.spawnEnemy('tank',80,0);g.s.hp=1;g.damage(7,'touch',{actorType:'tank',actorId:enemy.id});g.s.hp=0;g.s.mode='gameover';
 assert.ok(store.checkpoint('defeat',g,{credit:true}).ok);
 const saved=record(store),resumed=restoreRun(saved.run.snapshot);
 assert.deepEqual(resumed.speech,g.speech);assert.equal(resumed.speech.queue.length,1);
 assert.deepEqual(saved.replay.history[0].deathCause,resumed.s.deathCause);
 assert.ok(store.checkpoint('defeat',resumed,{credit:true}).ok);assert.equal(record(store).replay.history.length,1);
});

test('a rejected save cannot partially publish speech, history, or totals',()=>{
 const storage=memory(),store=new RunStore(storage),g=new Game({seed:15});assert.ok(store.begin('atomic',g).ok);
 const before=storage.getItem(store.key),write=storage.setItem;
 g.s.elapsed=40;g.s.kills=12;g.bark('TOMA','Une nouvelle réplique.',true);g.s.hp=0;g.s.mode='gameover';
 storage.setItem=()=>{throw Error('quota');};assert.equal(store.checkpoint('atomic',g,{credit:true}).ok,false);assert.equal(storage.getItem(store.key),before);
 storage.setItem=write;assert.ok(store.checkpoint('atomic',g,{credit:true}).ok);assert.ok(store.checkpoint('atomic',g,{credit:true}).ok);
 const saved=record(store);assert.equal(saved.totals.lifetime,12);assert.equal(saved.replay.history.length,1);assert.deepEqual(saved.run.snapshot.game.speech,captureRun(g).game.speech);
});

test('Charles dialogue resumes with one survival win before a separate endless result',()=>{
 const store=new RunStore(memory()),g=new Game({seed:72});assert.ok(store.begin('journey',g).ok);
 g.s.elapsed=1200;g.s.mode='victory';assert.ok(store.checkpoint('journey',g,{credit:true}).ok);assert.ok(g.startCharlesEpilogue());
 g.urgentSpeech('CHARLES','Une annonce importante.');assert.ok(store.checkpoint('journey',g,{credit:true}).ok);
 const resumed=restoreRun(record(store).run.snapshot);assert.deepEqual(resumed.speech,g.speech);assert.ok(resumed.leaveCharlesEpilogue());
 assert.ok(store.checkpoint('journey',resumed,{credit:true}).ok);resumed.continueEndless();resumed.s.elapsed=1220;resumed.s.hp=0;resumed.s.mode='gameover';
 assert.ok(store.checkpoint('journey',resumed,{credit:true}).ok);
 assert.deepEqual(record(store).replay.history.map(r=>[r.mode,r.outcome]),[['endless','defeat'],['survival','victory']]);
});
