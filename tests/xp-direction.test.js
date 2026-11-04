import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';
const bank=(value=216,x=-2000,y=0)=>({x,y,kind:'xp',value,life:38,compact:true});
const total=g=>g.s.drops.filter(d=>d.kind==='xp').reduce((n,d)=>n+d.value,0);
function quiet(){const g=new Game({seed:42});g.world.collides=()=>false;for(const k in g.timers)g.timers[k]=100000;g.nextEvent=100000;return g;}
function backwardsShot(g){const e=g.spawnEnemy('tank',g.s.x-150,g.s.y);e.speed=0;g.s.shotClock=0;return e;}

test('shooting backwards cannot move 216 banked XP into the path of forward travel',()=>{
 const g=quiet();g.s.drops=[bank()];backwardsShot(g);g.update(1/30,{x:1,y:0});
 assert.ok(g.s.faceX<0,'the real weapon system has aimed behind the player');
 assert.ok(g.s.drops[0].x<g.s.x,'relocation follows travel, not weapon facing');
 assert.equal(total(g),216);assert.equal(g.s.xp,0);assert.equal(g.s.level,1);
 for(let i=0;i<60;i++)g.update(1/30,{x:1,y:0});
 assert.equal(total(g),216);assert.equal(g.s.xp,0);assert.equal(g.s.mode,'playing');
});
test('movement direction comes from displacement after collision, and persists while blocked or idle',()=>{
 const g=quiet();g.world.collides=(_x,y)=>y!==0;g.update(1/30,{x:1,y:1});
 assert.equal(g.s.travelX,1);assert.equal(g.s.travelY,0);
 g.world.collides=()=>true;g.update(1/30,{x:-1,y:0});g.update(1/30,{x:0,y:0});
 assert.equal(g.s.travelX,1);assert.equal(g.s.travelY,0);
 g.world.collides=()=>false;g.s.drops=[bank()];g.updateDrops(.01);assert.ok(g.s.drops[0].x<g.s.x);
});
test('bank placement trails actual travel in every direction despite opposing aim',()=>{
 for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
  const g=quiet();g.update(1/30,{x,y});g.s.faceX=-x;g.s.faceY=-y;g.s.drops=[bank(12,-x*2000,-y*2000)];g.updateDrops(.01);
  const d=g.s.drops[0];assert.ok((d.x-g.s.x)*x+(d.y-g.s.y)*y<0);assert.equal(total(g),12);assert.equal(g.s.xp,0);
 }
});
test('a trailing companion cannot reverse bank placement or collect it remotely',()=>{
 const g=quiet();g.update(1/30,{x:1,y:0});g.s.companion=true;g.s.girl.x=g.s.x-36;g.s.girl.y=g.s.y+16;g.recalculate();g.s.drops=[bank()];g.updateDrops(.01);
 const d=g.s.drops[0];assert.ok(d.x<=g.s.x);assert.ok(Math.hypot(d.x-g.s.girl.x,d.y-g.s.girl.y)>g.s.stats.magnet+24);assert.equal(total(g),216);assert.equal(g.s.xp,0);
});
test('blocked trailing routes retain the bank until a reachable non-forward route opens',()=>{
 const g=quiet();g.update(1/30,{x:1,y:0});const x=g.s.x;g.world.collides=(cx,cy)=>cx<x-1||Math.abs(cy)>1;g.s.drops=[bank()];g.updateDrops(.01);
 assert.equal(g.s.drops[0].x,-2000);assert.equal(total(g),216);assert.equal(g.s.xp,0);
 g.world.collides=()=>false;g.updateDrops(.01);assert.ok(g.s.drops[0].x<x);assert.equal(total(g),216);
});
test('unknown movement history keeps the original bank side rather than using aim',()=>{
 const g=quiet();g.s.faceX=-1;g.s.faceY=0;g.s.drops=[bank()];g.updateDrops(.01);assert.ok(g.s.drops[0].x<0);assert.equal(total(g),216);
});
test('pause, dialogue, and upgrade modes freeze travel and the physical bank',()=>{
 const g=quiet();g.update(1/30,{x:0,y:-1});g.s.drops=[bank(216,0,1600)];
 for(const mode of ['paused','dialogue','upgrade']){g.s.mode=mode;const before=structuredClone(g.s);g.update(.25,{x:1,y:0});assert.deepEqual(g.s,before);}
});
test('reload preserves travel and deterministic bank placement through backwards fire',()=>{
 const a=quiet();a.update(1/30,{x:1,y:0});backwardsShot(a);a.weapons(0);a.s.drops=[bank(216,a.s.x-1799,0)];a.pause();
 const saved=captureRun(a);assert.equal(saved.game.s.travelX,1);assert.equal(saved.game.s.travelY,0);const b=restoreRun(saved);b.world.collides=()=>false;assert.deepEqual(captureRun(b),saved);
 for(const g of [a,b]){g.resume();for(let i=0;i<90;i++)g.update(1/30,{x:1,y:0});}
 assert.deepEqual(captureRun(b),captureRun(a));assert.equal(total(a),216);assert.equal(a.s.xp,0);
});
test('real v7 saves retain banked XP, currency spending, rerolls, and evolutions when travel is unknown',()=>{
 const raw=readFileSync(new URL('./fixtures/runstore-v7-xp.json',import.meta.url),'utf8'),original=JSON.parse(raw),data=new Map([['toma-popescu-run-v1',raw]]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},store=new RunStore(storage);
 assert.equal(original.version,7);assert.equal(original.run.snapshot.game.s.travelX,undefined);
 const read=store.read();assert.equal(read.status,'ready');const g=restoreRun(read.value.run.snapshot);g.world.collides=()=>false;
 assert.deepEqual(read.value.totals,original.totals);assert.equal(storage.getItem(store.key),raw);
 assert.equal(g.s.travelX,0);assert.equal(g.s.travelY,0);assert.equal(g.s.coinsSpent,7);assert.equal(g.s.upgradeRerolls,1);assert.deepEqual(g.s.evolutions,{billionaire:true});assert.equal(g.s.xp,5);assert.equal(total(g),216);
 g.s.drops[0].x=-2000;g.updateDrops(.01);assert.ok(g.s.drops[0].x<g.s.x);assert.equal(total(g),216);assert.equal(g.s.xp,5);
 assert.equal(store.checkpoint('real-v7-xp-bank',g).ok,true);assert.equal(new RunStore(storage).read().status,'ready');
});
test('saved travel rejects missing, nonnumeric, nonfinite, and nonunit vectors',()=>{
 for(const change of [s=>delete s.travelX,s=>s.travelY='0',s=>s.travelX=NaN,s=>s.travelX=2,s=>{s.travelX=.2;s.travelY=.2;}]){const saved=captureRun(quiet());change(saved.game.s);assert.throws(()=>restoreRun(saved));}
});
test('terminal cap compaction uses saved travel without changing the live XP field',()=>{
 const g=quiet();g.update(1/30,{x:1,y:0});backwardsShot(g);g.weapons(0);g.s.drops=Array.from({length:300},(_,i)=>bank(i+1,-2000-i));g.s.mode='gameover';g.s.hp=0;const before=structuredClone(g.s.drops),snapshot=captureRun(g),resumed=restoreRun(snapshot);
 assert.deepEqual(g.s.drops,before);assert.equal(total(resumed),45150);assert.ok(resumed.s.drops.length<=260);assert.ok(resumed.s.drops[0].x<g.s.x);assert.equal(resumed.s.xp,0);
});
test('returning to the physical bank still awards every earned level without an XP nerf',()=>{
 const g=quiet();g.update(1/30,{x:1,y:0});Object.assign(g.s,{level:3,xp:23,xpNeed:24,drops:[bank()]});g.updateDrops(.01);
 for(let i=0;i<60&&g.s.mode==='playing';i++)g.update(1/30,{x:-1,y:0});
 assert.equal(g.s.mode,'upgrade');assert.equal(total(g),0);const elapsed=g.s.elapsed;let choices=0;
 while(g.s.mode==='upgrade'){g.chooseUpgrade(g.s.options[0].id);choices++;assert.ok(choices<=6);}
 assert.equal(choices,6);assert.equal(g.s.level,9);assert.equal(g.s.xp,5);assert.equal(g.s.elapsed,elapsed);
});
// The original natural190s replay is retained in scripts/measure-natural-xp-run.mjs.
// It is a separate balance measurement, not an XP pass when the player dies.
// xp-real-bank.test.js exercises the real relocation counterexample with an
// explicit historical-bug negative control and complete physical-return credit.
