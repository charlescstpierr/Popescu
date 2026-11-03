import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,LockedRunStore} from '../dist/run-save.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};};
const crowd=()=>{const game=new Game({seed:42});for(let i=0;i<300;i++)game.spawnEnemy(['normal','sprinter','gas','tank','jealous','orangutan'][i%6],300+i%20*35,Math.floor(i/20)*35);return game;};

// Restoring and recapturing a Game inside LockedRunStore.write makes this fail:
// it repeats two complete 300-actor validation passes for no state change.
test('crowded locked checkpoints validate capture, stored record and final record only',async()=>{
 const storage=memory(),store=new LockedRunStore(storage,{request:(_key,fn)=>Promise.resolve(fn())}),game=crowd();
 assert.ok((await store.begin('crowd',game)).ok);
 const spawn=Game.prototype.spawnEnemy;let templates=0;
 Game.prototype.spawnEnemy=function(...args){templates++;return spawn.apply(this,args);};
 let result;
 try{result=await store.checkpoint('crowd',game);}finally{Game.prototype.spawnEnemy=spawn;}
 assert.ok(result.ok);
 assert.equal(templates,900,'one actor pass each for the captured snapshot, prior record and final record');
 assert.deepEqual(result.value.run.snapshot,captureRun(game));
});

test('queued crowded checkpoints preserve request-time progress, sets and credit options',async()=>{
 const storage=memory();let release=null;
 const locks={request:async(_key,fn)=>{if(release!==null)await release.gate;return fn();}};
 const store=new LockedRunStore(storage,locks),game=crowd();
 assert.ok((await store.begin('crowd',game)).ok);
 game.s.kills=17;game.s.coins=8;game.s.elapsed=44;
 game.s.shots=[{x:0,y:0,vx:1,vy:0,life:1,damage:1,r:4,pierce:0,kind:'bullet',hitIds:new Set([1])}];
 const expected=captureRun(game),options={credit:true};let unlock;
 release={gate:new Promise(resolve=>unlock=resolve)};
 const pending=store.checkpoint('crowd',game,options);
 game.s.kills=99;game.s.coins=99;game.s.enemies[0].hp=1;game.s.shots[0].hitIds.add(2);options.credit=false;
 unlock();const result=await pending;
 assert.ok(result.ok);
 assert.deepEqual(result.value.run.snapshot,expected);
 assert.deepEqual(result.value.totals,{best:44,lifetime:17,coins:8});
 assert.deepEqual([...restoreRun(result.value.run.snapshot).s.shots[0].hitIds],[1]);
});

test('optimized locked path still rejects invalid live states and tampered stored records',async()=>{
 const storage=memory(),store=new LockedRunStore(storage,{request:(_key,fn)=>Promise.resolve(fn())}),game=crowd();
 assert.ok((await store.begin('crowd',game)).ok);const before=storage.getItem(store.store.key);
 delete game.s.enemies[0].chargeDirX;
 assert.equal((await store.checkpoint('crowd',game)).ok,false);
 assert.equal(storage.getItem(store.store.key),before);
 const valid=restoreRun(JSON.parse(before).run.snapshot),bad=JSON.parse(before);bad.run.snapshot.game.s.enemies[0].r=1000;
 storage.setItem(store.store.key,JSON.stringify(bad));const tampered=storage.getItem(store.store.key);
 assert.equal((await store.checkpoint('crowd',valid)).reason,'corrupt');
 assert.equal(storage.getItem(store.store.key),tampered);
});
