import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';
import {CombatArt} from '../dist/combat-art.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';
import {finishCharles} from '../dist/charles.js';

// Keep the real render traversal and combat reactions; only Canvas is inert.
function renderer(){
 const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
 const result=new Renderer({getContext:()=>ctx});result._drawGround=()=>{};
 return result;
}
function fixture(seed=42){
 const game=new Game({seed}),view=renderer();game.s.elapsed=10;
 const enemy=game.spawnEnemy('tank',100,-80);
 return {game,view,enemy};
}
function hit(f){f.view.render(f.game);f.game.hurt(f.enemy,5);f.view.render(f.game);assert.equal(f.view.combat.effects.length,1);}

for(const time of [9,10,11])test(`same-seed restoration at ${time}s discards reactions and comparison history`,()=>{
 const f=fixture();const saved=captureRun(f.game);hit(f);
 const resumed=restoreRun(saved);resumed.s.elapsed=time;resumed.s.enemies[0].hp-=9;
 const before=captureRun(resumed);f.view.render(resumed);
 assert.deepEqual(f.view.combat.effects,[],'neither discarded feedback nor a synthetic damage delta may survive restoration');
 assert.equal(f.view.combat.appeared.size,0,'restored actors must not replay their entrance');
 assert.deepEqual(captureRun(resumed),before,'rendering never changes the checkpoint');
 resumed.hurt(resumed.s.enemies[0],5);f.view.render(resumed);
 assert.deepEqual(f.view.combat.effects.map(e=>[e.kind,e.value]),[['hit',5]],'new damage starts from the restored baseline');
});

test('same-seed new Game clears hits and entrance fades even with equal kills',()=>{
 const f=fixture();hit(f);const extra=f.game.spawnEnemy('normal',120,-40);f.view.render(f.game);
 assert.ok(f.view.combat.alpha(extra.id,10)<1);
 const next=new Game({seed:42});next.s.elapsed=10;next.spawnEnemy('tank',100,-80);next.spawnEnemy('normal',120,-40);
 f.view.render(next);assert.deepEqual(f.view.combat.effects,[]);assert.equal(f.view.combat.appeared.size,0);
});

test('rewinding the same mutable state clears future reactions and entrance fades',()=>{
 const f=fixture();hit(f);f.game.spawnEnemy('normal',120,-40);f.view.render(f.game);
 f.game.s.elapsed=9;f.view.render(f.game);
 assert.deepEqual(f.view.combat.effects,[]);assert.equal(f.view.combat.appeared.size,0);
});

test('real two-client save conflict and earlier reload has no stale feedback',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const left=new RunStore(storage),right=new RunStore(storage),f=fixture(45);
 assert.equal(left.begin('shared',f.game).ok,true);const lagging=restoreRun(right.read().value.run.snapshot);
 lagging.s.elapsed=90;f.game.s.elapsed=100;hit(f);
 assert.equal(right.checkpoint('shared',lagging).ok,true);assert.equal(left.checkpoint('shared',f.game).reason,'conflict');
 const resumed=restoreRun(left.read().value.run.snapshot),before=captureRun(resumed);f.view.render(resumed);
 assert.equal(resumed.s.elapsed,90);assert.deepEqual(f.view.combat.effects,[]);assert.deepEqual(captureRun(resumed),before);
});

test('paused frames and effects settings preserve an existing reaction until simulation expiry',()=>{
 const f=fixture();hit(f);const cue=f.view.combat.effects[0];f.game.pause();
 for(let i=0;i<4;i++){f.game.update(.2);f.view.reducedEffects=Boolean(i%2);f.view.render(f.game,100+i);assert.equal(f.view.combat.effects[0],cue);}
 assert.equal(f.game.s.elapsed,10);f.game.s.elapsed=10.7;f.view.render(f.game);assert.deepEqual(f.view.combat.effects,[]);
});

function epilogue(){
 const game=new Game({seed:45}),view=renderer();game.s.elapsed=1200;game.s.mode='victory';
 assert.equal(game.startCharlesEpilogue(),true);game.s.charles.elapsed=20;view.render(game);return {game,view};
}
test('Charles temporary render states retain genuine damage feedback across frames',()=>{
 const f=epilogue();f.game.damage(5,'touch');f.view.render(f.game);const cue=f.view.combat.effects[0];
 assert.equal(cue.kind,'ouch');assert.equal(cue.value,5);assert.equal(cue.start,1220);
 f.game.s.charles.elapsed=20.2;f.view.render(f.game);assert.equal(f.view.combat.effects[0],cue);
 f.game.s.charles.elapsed=20.5;f.view.render(f.game);assert.deepEqual(f.view.combat.effects,[]);
});

test('finishing Charles drops future-dated reactions but preserves the new lethal cue',()=>{
 const f=epilogue();f.game.damage(5,'touch');f.view.render(f.game);
 finishCharles(f.game,'defeated');f.view.render(f.game);
 assert.deepEqual(f.view.combat.effects.map(e=>[e.kind,e.value,e.start]),[['ouch',95,1200]],'completion must not hide lethal damage or freeze the previous hit');
});

test('leaving Charles and continuing endless does not retain a future-dated hit',()=>{
 const f=epilogue();f.game.damage(5,'touch');f.view.render(f.game);f.game.leaveCharlesEpilogue();f.view.render(f.game);
 assert.deepEqual(f.view.combat.effects,[]);f.game.continueEndless();f.view.render(f.game);assert.deepEqual(f.view.combat.effects,[]);
});

test('a backwards render-only clock discards future entrance fades without resetting HP history',()=>{
 const game=new Game({seed:42}),art=new CombatArt(),raw=game.s;raw.elapsed=10;
 art.prepare({...raw,elapsed:30},42,[],raw);const e=game.spawnEnemy('tank',100,-80);
 art.prepare({...raw,elapsed:30},42,[],raw);assert.ok(art.alpha(e.id,30)<1);
 raw.hp-=5;art.prepare({...raw,elapsed:10},42,[],raw);
 assert.equal(art.alpha(e.id,10),1);assert.deepEqual(art.effects.map(e=>[e.kind,e.value]),[['ouch',5]]);
});

test('horde feedback remains bounded and neither damage nor rendering mutates saved RNG',()=>{
 const f=fixture();for(let i=0;i<299;i++)f.game.spawnEnemy('tank',100+i,-80);f.view.render(f.game);
 for(const enemy of f.game.s.enemies)f.game.hurt(enemy,5);
 const before=captureRun(f.game);f.view.render(f.game);assert.equal(f.view.combat.effects.length,48);assert.deepEqual(captureRun(f.game),before);
});
