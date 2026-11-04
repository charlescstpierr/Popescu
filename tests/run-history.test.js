import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {RunStore,LockedRunStore,captureRun,restoreRun} from '../dist/run-save.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
const game=(difficulty='normal')=>new Game({difficulty,seed:987});
function finish(g,{time=90,kills=10,coins=7,win=false}={}){Object.assign(g.s,{elapsed:time,kills,coins,hp:win?g.s.hp:0,mode:win?'victory':'gameover'});return g;}
const saved=store=>store.read().value;

test('records never mix difficulties or survival with endless',()=>{
 const store=new RunStore(memory()),easy=game('easy');assert.ok(store.begin('easy',easy).ok);finish(easy,{time:1200,win:true});assert.ok(store.checkpoint('easy',easy,{credit:true}).ok);
 easy.continueEndless();finish(easy,{time:1810,kills:18,coins:11});assert.ok(store.checkpoint('easy',easy,{credit:true}).ok);
 const hard=game('hard');assert.ok(store.begin('hard',hard).ok);finish(hard,{time:42,kills:3,coins:1});assert.ok(store.checkpoint('hard',hard,{credit:true}).ok);
 const r=saved(store).replay.records;assert.equal(r.easy.survival.bestTime,1200);assert.equal(r.easy.endless.bestTime,1810);assert.equal(r.hard.survival.bestTime,42);assert.equal(r.normal.survival.bestTime,0);assert.equal(r.hard.endless.bestTime,0);assert.equal(saved(store).totals.best,1810);
});
test('history captures a detached loadout, factual cause and original seed',()=>{
 const store=new RunStore(memory()),g=game();store.begin('build',g);g.s.elapsed=68;g.s.upg={car:3,money:3};g.s.evolutions.billionaire=true;g.s.trophies.chosen={pelican:'tarot'};g.recalculate();const enemy=g.spawnEnemy('tank',40,40);g.s.hp=4;g.damage(11,'touch',{kind:'ordinary-contact',actorType:'tank',actorId:enemy.id});finish(g,{time:68});assert.ok(store.checkpoint('build',g,{credit:true}).ok);
 const entry=saved(store).replay.history[0];assert.equal(entry.id,'build');assert.equal(entry.seed,987);assert.equal(entry.outcome,'defeat');assert.deepEqual(entry.build,{upgrades:{car:3,money:3},evolutions:['billionaire'],trophies:{pelican:'tarot'}});assert.deepEqual(entry.deathCause,{source:'touch',actorType:'tank',actorId:enemy.id,at:68,hpLoss:11});g.s.upg.car=4;assert.equal(entry.build.upgrades.car,3);
});
test('victory retries and epilogue completion replace one history result rather than duplicate it',()=>{
 const store=new RunStore(memory()),g=game();store.begin('win',g);finish(g,{time:1200,win:true});store.checkpoint('win',g,{credit:true});store.checkpoint('win',g,{credit:true});assert.equal(saved(store).replay.history.length,1);assert.equal(saved(store).replay.history[0].outcome,'victory');assert.equal(saved(store).replay.history[0].deathCause,null);
 g.continueEndless();finish(g,{time:1300});store.checkpoint('win',g,{credit:true});assert.deepEqual(saved(store).replay.history.map(r=>[r.id,r.mode,r.outcome]),[['win','endless','defeat'],['win','survival','victory']]);
});
test('ordinary credited pause checkpoints update records but never pretend the run ended',()=>{
 const store=new RunStore(memory()),g=game();store.begin('pause',g);g.s.elapsed=35;g.s.mode='paused';store.checkpoint('pause',g,{credit:true});store.checkpoint('pause',g,{credit:true});assert.equal(saved(store).replay.records.normal.survival.bestTime,35);assert.deepEqual(saved(store).replay.history,[]);
});
test('replacement records an unfinished run once with its latest passed snapshot',()=>{
 const store=new RunStore(memory()),g=game();store.begin('old',g);g.s.elapsed=27;g.s.kills=9;const previous={id:'old',snapshot:captureRun(g)};assert.ok(store.begin('new',game(),undefined,null,previous).ok);assert.equal(saved(store).replay.history.length,1);assert.equal(saved(store).replay.history[0].outcome,'abandoned');assert.equal(saved(store).replay.history[0].kills,9);assert.equal(saved(store).replay.history[0].time,27);
});
test('history keeps only the most recent 20 results without losing best records',()=>{
 const store=new RunStore(memory());for(let i=0;i<25;i++){const g=game();store.begin(`run-${i}`,g);finish(g,{time:i===0?1000:i+1});assert.ok(store.checkpoint(`run-${i}`,g,{credit:true}).ok);}
 const r=saved(store).replay;assert.equal(r.history.length,20);assert.equal(r.history[0].id,'run-24');assert.equal(r.history.at(-1).id,'run-5');assert.equal(r.records.normal.survival.bestTime,1000);
});
test('legacy totals stay untouched and unclassified until an attributable run is credited',()=>{
 const raw=readFileSync(new URL('./fixtures/runstore-v3.json',import.meta.url),'utf8'),original=JSON.parse(raw),storage=memory();storage.setItem('toma-popescu-run-v1',raw);const store=new RunStore(storage),record=saved(store);assert.deepEqual(record.totals,original.totals);assert.equal(record.replay.legacyBest,original.totals.best);assert.equal(record.replay.records.normal.survival.bestTime,0);assert.deepEqual(record.replay.history,[]);assert.equal(storage.getItem(store.key),raw);assert.ok(store.checkpoint(record.run.id,restoreRun(record.run.snapshot),{credit:true}).ok);assert.equal(saved(store).replay.legacyBest,original.totals.best);
});
test('failed writes preserve history and records together with totals, and retry does not duplicate them',()=>{
 const storage=memory(),store=new RunStore(storage),g=game();store.begin('a',g);const raw=storage.getItem(store.key),write=storage.setItem;finish(g);storage.setItem=()=>{throw Error('quota')};assert.equal(store.checkpoint('a',g,{credit:true}).ok,false);assert.equal(storage.getItem(store.key),raw);storage.setItem=write;assert.ok(store.checkpoint('a',g,{credit:true}).ok);assert.ok(store.checkpoint('a',g,{credit:true}).ok);assert.equal(saved(store).replay.history.length,1);assert.equal(saved(store).totals.lifetime,10);
});
test('history counts earned coins including rerolls and keeps mode-specific maxima independently',()=>{
 const store=new RunStore(memory()),g=game();store.begin('a',g);finish(g,{time:30,kills:50,coins:2});g.s.coinsSpent=15;g.s.upgradeRerolls=2;store.checkpoint('a',g,{credit:true});const b=game();store.begin('b',b);finish(b,{time:60,kills:4,coins:3});store.checkpoint('b',b,{credit:true});assert.equal(saved(store).replay.history[1].coins,17);assert.deepEqual(saved(store).replay.records.normal.survival,{bestTime:60,bestKills:50,bestCoins:17,bestLevel:1});
});
test('malformed replay metadata is rejected without overwriting the save',()=>{
 const corruptions=[r=>r.version=99,r=>r.history=Array(21).fill(r.history[0]),r=>r.records.easy.survival.bestTime=-1,r=>r.history[0].build.upgrades={fake:1},r=>r.history[0].difficulty='unknown',r=>r.history[0].deathCause={source:'imagined'}];
 for(const corrupt of corruptions){const storage=memory(),store=new RunStore(storage),g=game();store.begin('a',g);finish(g);store.checkpoint('a',g,{credit:true});const record=JSON.parse(storage.getItem(store.key));assert.ok(record.replay);corrupt(record.replay);const raw=JSON.stringify(record);storage.setItem(store.key,raw);assert.equal(new RunStore(storage).read().status,'corrupt');assert.equal(storage.getItem(store.key),raw);}
});
test('locked writes capture the requested build, not mutations made while waiting',async()=>{
 let release;const gate=new Promise(r=>release=r),locks={request:async(_key,fn)=>{await gate;return fn();}},store=new LockedRunStore(memory(),locks),g=game();release();await store.begin('queued',g);g.s.upg.muscle=2;finish(g);const result=store.checkpoint('queued',g,{credit:true});g.s.upg.muscle=5;assert.ok((await result).ok);assert.equal(saved(store).replay.history[0].build.upgrades.muscle,2);
});
test('changing to endless retains an uncredited saved victory before recording endless results',()=>{
 const store=new RunStore(memory()),g=game();store.begin('transition',g);finish(g,{time:1200,win:true});store.checkpoint('transition',g);g.continueEndless();finish(g,{time:1220});store.checkpoint('transition',g,{credit:true});assert.equal(saved(store).replay.records.normal.survival.bestTime,1200);assert.deepEqual(saved(store).replay.history.map(r=>r.mode),['endless','survival']);
});

test('final-tick overshoot preserves factual lethal time without leaking beyond the survival record cap',()=>{
 const store=new RunStore(memory()),g=game();store.begin('edge',g);g.s.elapsed=1200.01;g.s.hp=1;g.damage(7,'gas');g.s.hp=0;g.s.mode='gameover';assert.ok(store.checkpoint('edge',g,{credit:true}).ok);assert.equal(saved(store).replay.history[0].time,1200.01);assert.equal(saved(store).replay.history[0].deathCause.at,1200.01);assert.equal(saved(store).replay.records.normal.survival.bestTime,1200);
});

test('entering and leaving Charles preserves the survival win rather than inventing a defeat',()=>{
 const store=new RunStore(memory()),g=game();store.begin('charles',g);finish(g,{time:1200,win:true});store.checkpoint('charles',g,{credit:true});assert.ok(g.startCharlesEpilogue());assert.ok(store.checkpoint('charles',g,{credit:true}).ok);assert.equal(saved(store).replay.history.length,1);assert.equal(saved(store).replay.history[0].outcome,'victory');assert.ok(g.leaveCharlesEpilogue());assert.ok(store.checkpoint('charles',g,{credit:true}).ok);assert.equal(saved(store).replay.history.length,1);assert.equal(saved(store).replay.history[0].deathCause,null);
});
