import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,RunStore,Autosave,LockedRunStore} from '../dist/run-save.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data};};
const run=()=>new Game({seed:987});
test('snapshot restores independent state, RNG, timers, sets and deterministic continuation',()=>{
 const a=run();a.s.upg.car=1;a.s.upg.money=1;a.recalculate();for(let i=0;i<90;i++)a.update(1/30,{x:1,y:0});a.eventSeen.add('phone');
 const snap=captureRun(a);const b=restoreRun(snap);assert.deepEqual(captureRun(b),snap);assert.notEqual(a.s,b.s);assert.ok(b.eventSeen instanceof Set);for(const shot of b.s.shots)assert.ok(shot.hitIds instanceof Set);
 for(let i=0;i<100;i++){a.update(1/30,{x:0,y:1});b.update(1/30,{x:0,y:1});}assert.deepEqual(captureRun(a),captureRun(b));
});
test('pending upgrades retain exact choices and dialogue retains progress',()=>{
 const g=run();g.gainXP(20);let b=restoreRun(captureRun(g));assert.equal(b.s.mode,'upgrade');assert.deepEqual(b.s.options,g.s.options);assert.equal(b.chooseUpgrade(b.s.options[0].id),true);
 g.finishDialogue();g.s.mode='dialogue';const ui={lines:[{who:'TOMA',text:'Salut'}],index:0};const snap=captureRun(g,ui);assert.deepEqual(snap.dialogue,ui);assert.equal(restoreRun(snap).s.mode,'dialogue');assert.throws(()=>captureRun(g));
});
test('rejects corrupt schemas, hostile keys, unknown versions and unbounded data',()=>{
 for(const change of [s=>s.version=99,s=>s.game.s.hp=null,s=>s.game.s.level=-1,s=>s.game.s.difficulty='bad',s=>s.game.s.girl={},s=>s.game.s.enemies=[{}],s=>s.game.s.shots=[{hitIds:{}}],s=>s.game.s.upg={fake:1},s=>s.game.s.enemies=Array(301).fill({}),s=>s.game.rng='oops']){const snap=captureRun(run());change(snap);assert.throws(()=>restoreRun(snap));}
 assert.throws(()=>restoreRun(JSON.parse('{"__proto__":{}}')));
});
test('storage restores exact checkpoint and safely reports denied or corrupt storage',()=>{
 const storage=memory(),store=new RunStore(storage);assert.equal(store.read().status,'empty');const g=run();const begun=store.begin('run-a',g);assert.equal(begun.ok,true);assert.equal(store.read().status,'ready');assert.deepEqual(store.read().value.run.snapshot,captureRun(g));
 storage.setItem(store.key,'{broken');assert.equal(store.read().status,'corrupt');assert.equal(store.begin('b',g).ok,false);
 const denied=new RunStore({getItem(){throw Error('denied')}});assert.equal(denied.read().status,'unavailable');assert.equal(denied.begin('c',g).ok,false);
});
test('atomic result credits survive reload, victory/endless and retries without duplication',()=>{
 const storage=memory();let store=new RunStore(storage);const g=run();assert.ok(store.begin('a',g,{best:20,lifetime:4,coins:2}).ok);g.s.elapsed=1200;g.s.kills=50;g.s.coins=30;g.s.mode='victory';assert.ok(store.checkpoint('a',g,{credit:true}).ok);
 store=new RunStore(storage);assert.ok(store.checkpoint('a',g,{credit:true}).ok);assert.deepEqual(store.read().value.totals,{best:1200,lifetime:54,coins:32});g.continueEndless();g.s.kills=55;g.s.coins=31;g.s.elapsed=1201;assert.ok(store.checkpoint('a',g,{credit:true}).ok);assert.equal(store.read().value.totals.lifetime,59);
 assert.ok(store.begin('b',run()).ok);assert.equal(store.checkpoint('a',g,{credit:true}).reason,'conflict');assert.equal(store.read().value.totals.lifetime,59);
});
test('failed atomic write retains old checkpoint and credits and can be retried',()=>{
 const storage=memory(),store=new RunStore(storage),g=run();store.begin('a',g);const write=storage.setItem;storage.setItem=()=>{throw Error('quota')};g.s.kills=9;assert.equal(store.checkpoint('a',g,{credit:true}).ok,false);assert.equal(store.read().value.totals.lifetime,0);storage.setItem=write;assert.ok(store.checkpoint('a',g,{credit:true}).ok);assert.equal(store.read().value.totals.lifetime,9);
});
test('stale tab revision cannot overwrite a newer run checkpoint',()=>{
 const storage=memory(),a=new RunStore(storage),b=new RunStore(storage),g=run();a.begin('a',g);b.read();a.checkpoint('a',g);assert.equal(b.checkpoint('a',g).reason,'conflict');
});
test('autosave throttles periodic writes and flushes lifecycle events without swallowing failure',()=>{
 let time=0,calls=0,ok=true;const autosave=new Autosave(()=>{calls++;return {ok}},()=>time);autosave.tick();assert.equal(calls,1);time=4000;autosave.tick();assert.equal(calls,1);time=5000;autosave.tick();assert.equal(calls,2);ok=false;assert.equal(autosave.flush().ok,false);ok=true;time=10000;assert.equal(autosave.tick().ok,true);assert.equal(calls,4);
});
test('conflict remains latched until the caller explicitly reloads the record',()=>{
 const storage=memory(),a=new RunStore(storage),b=new RunStore(storage),g=run();a.begin('a',g);b.read();a.checkpoint('a',g);assert.equal(b.checkpoint('a',g).reason,'conflict');assert.equal(b.checkpoint('a',g).reason,'conflict');b.read();assert.ok(b.checkpoint('a',g).ok);
});
test('capture refuses nonfinite optional values instead of silently changing them',()=>{
 const g=run();g.lastCrowReaction=Infinity;assert.throws(()=>captureRun(g));
});
test('real long run snapshots remain valid across all effects and modes',()=>{
 const g=run();for(const u of ['car','money','airplane','girlfriend','chopper','truth','followers'])g.s.upg[u]=3;g.recalculate();
 for(let i=0;i<5000;i++){g.s.hp=g.s.maxhp;if(g.s.mode==='upgrade')g.chooseUpgrade(g.s.options[0].id);if(g.s.mode==='dialogue')g.finishDialogue();g.update(.1,{x:Math.cos(i/100),y:Math.sin(i/100)});if(i%70===0&&g.s.mode!=='dialogue'){const snap=captureRun(g);assert.deepEqual(captureRun(restoreRun(snap)),snap);}}
});

test('locked store serializes competing writes and fails closed without lock support',async()=>{
 let tail=Promise.resolve();const locks={request(_name,fn){const next=tail.then(fn);tail=next.catch(()=>{});return next;}};
 const storage=memory(),a=new LockedRunStore(storage,locks),b=new LockedRunStore(storage,locks),g=run();await a.begin('a',g);a.read();b.read();const writes=await Promise.all([a.checkpoint('a',g),b.checkpoint('a',g)]);assert.equal(writes.filter(r=>r.ok).length,1);assert.equal(writes.filter(r=>r.reason==='conflict').length,1);
 assert.equal((await new LockedRunStore(storage,null).checkpoint('a',g)).reason,'locking-unavailable');
});
test('queued save captures request-time state, not later mutations',async()=>{
 let release;const gate=new Promise(r=>release=r);const locks={request:async(_key,fn)=>{await gate;return fn()}};const store=new LockedRunStore(memory(),locks),g=run();const result=store.begin('a',g);g.s.kills=10;release();assert.ok((await result).ok);assert.equal(store.read().value.run.snapshot.game.s.kills,0);
});
test('missing attack fields, duplicate actor IDs and invalid radii cannot enter simulation',()=>{
 for(const change of [s=>delete s.game.s.enemies[0].chargeDirX,s=>s.game.s.enemies[0].phase=null,s=>s.game.s.enemies[1].id=s.game.s.enemies[0].id,s=>s.game.s.enemies[0].r=0]){const g=run();g.spawnEnemy('rival_goat',80,80);g.spawnEnemy('normal',100,100);const snap=captureRun(g);change(snap);assert.throws(()=>restoreRun(snap));}
});
test('bounds spatial values before world collision or projectile loops',()=>{
 for(const [key,value] of [['r',1e12],['speed',1e12],['x',1e12]]){const g=run();g.spawnEnemy('gas',100,100);const snap=captureRun(g);snap.game.s.enemies[0][key]=value;assert.throws(()=>restoreRun(snap));}
 const g=run();g.spawnEnemy('gas',100,100);const snap=captureRun(g);delete snap.game.s.enemies[0].gasPose;assert.throws(()=>restoreRun(snap));
});
test('terminal effects overflow is trimmed exactly like the engine before persisting credits',()=>{
 const g=run();g.burst(0,0,'#fff',200);g.burst(0,0,'#fff',7);g.s.hp=0;g.s.mode='gameover';const snap=captureRun(g);assert.equal(snap.game.s.particles.length,200);assert.equal(g.s.particles.length,207);const store=new RunStore(memory());assert.ok(store.begin('a',g).ok);assert.ok(store.checkpoint('a',g,{credit:true}).ok);
});
test('all array indexes are integers, including speech and stunt counters',()=>{
 for(const key of ['barkIndex','rivalIndex','rivalBarkIndex']){const snap=captureRun(run());snap.game[key]=.5;assert.throws(()=>restoreRun(snap));}
 const snap=captureRun(run());snap.game.s.stunt.count=.5;assert.throws(()=>restoreRun(snap));
});
test('active gas attack requires finite locked direction components',()=>{
 for(const phase of ['windup','gasPose']){const g=run(),e=g.spawnEnemy('gas',0,100);e[phase]=.5;e.gasDirX=1;e.gasDirY=0;const snap=captureRun(g);delete snap.game.s.enemies[0].gasDirX;assert.throws(()=>restoreRun(snap));}
});
test('replacement credits the previous snapshot atomically and failed replacement preserves it',()=>{
 const storage=memory(),store=new RunStore(storage),g=run();store.begin('a',g);g.s.kills=12;g.s.coins=4;g.s.elapsed=30;store.checkpoint('a',g);g.s.kills=15;const previous={id:'a',snapshot:captureRun(g)};const write=storage.setItem;storage.setItem=()=>{throw Error('quota')};assert.equal(store.begin('b',run(),undefined,null,previous).ok,false);assert.equal(store.read().value.run.id,'a');assert.equal(store.read().value.totals.lifetime,0);storage.setItem=write;assert.ok(store.begin('b',run(),undefined,null,previous).ok);assert.deepEqual(store.read().value.totals,{best:30,lifetime:15,coins:4});
});
test('enemy collision radii must match their species, not merely be finite',()=>{
 const g=run();g.spawnEnemy('normal',100,100);const snapshot=captureRun(g);snapshot.game.s.enemies[0].r=5000;assert.throws(()=>restoreRun(snapshot));
});
test('real v3 RunStore envelope migrates and checkpoints without losing totals or progress',async()=>{
 const {readFileSync}=await import('node:fs');
 // Produced by the unchanged pre-animal v3 Game + RunStore, not a relabelled v4 snapshot.
 const raw=readFileSync(new URL('./fixtures/runstore-v3.json',import.meta.url),'utf8');const original=JSON.parse(raw);assert.equal(original.version,3);assert.equal(original.run.snapshot.version,3);assert.equal(original.run.snapshot.game.timers.animal,undefined);
 const storage=memory();storage.setItem('toma-popescu-run-v1',raw);const store=new RunStore(storage),read=store.read();assert.equal(read.status,'ready');assert.equal(read.value.version,11);assert.equal(read.value.run.snapshot.version,11);assert.deepEqual(read.value.totals,original.totals);assert.equal(storage.getItem(store.key),raw,'reading does not rewrite or destroy old save');
 const game=restoreRun(read.value.run.snapshot);assert.equal(game.s.elapsed,123);assert.equal(game.s.hp,67);assert.equal(game.s.kills,7);assert.equal(game.s.coins,11);assert.equal(game.s.enemies[0].type,'travestia');assert.equal(game.timers.animal,12);assert.equal(game.timers.animalIndex,0);
 assert.equal(store.checkpoint('real-v3-run',game,{credit:true}).ok,true);const saved=JSON.parse(storage.getItem(store.key));assert.equal(saved.version,11);assert.equal(saved.run.snapshot.version,11);assert.deepEqual(saved.totals,original.totals);assert.equal(saved.revision,original.revision+1);assert.equal(new RunStore(storage).read().status,'ready');
});
