import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const types=['matriarch','travestia','pelican'];
function quiet(type,seed=42){const game=new Game({seed});game.s.elapsed=300;game.nextEvent=1e6;for(const k in game.timers)game.timers[k]=1e6;game.bossDirector.remaining=100;const boss=game.spawnEnemy(type,-1700,0);game.s.moveX=1;game.s.moveY=0;return {game,boss};}
function visible(game,e){const s=game.s,v=game.viewport;return Math.abs(e.x-s.x)<=v.width/2+e.r+80&&e.y>=s.y-v.height*.48-e.r-100&&e.y<=s.y+v.height*.52+e.r+100;}
test('escaping far away does not erase a boss, its health, identity or encounter',()=>{
 for(const type of types){const {game,boss}=quiet(type);boss.hp-=53;const hp=boss.hp,id=boss.id,director=structuredClone(game.bossDirector),rng=game.rng,nextId=game.id;
  game.updateEnemies(1/30);
  assert.equal(game.s.enemies.includes(boss),true);assert.equal(boss.dead,false);assert.equal(boss.id,id);assert.equal(boss.hp,hp);assert.equal(game.id,nextId);assert.equal(game.rng,rng);assert.deepEqual(game.bossDirector,director);assert.equal(game.s.kills,0);assert.equal(game.s.drops.length,0);assert.equal(game.s.chests.length,0);
  assert.ok(Math.hypot(boss.x-game.s.x,boss.y-game.s.y)<1600);assert.equal(visible(game,boss),false);assert.equal(game.world.collides(boss.x,boss.y,boss.r*.64),false);assert.ok(boss.cooldown>=2);
 }
});
test('ordinary enemies still retire at the original distance and nearby bosses do not move suddenly',()=>{
 const g=new Game(),ordinary=g.spawnEnemy('normal',1700,0),boss=g.spawnEnemy('travestia',500,0);g.updateEnemies(1/30);assert.equal(g.s.enemies.includes(ordinary),false);assert.equal(g.s.enemies.includes(boss),true);assert.ok(Math.hypot(boss.x-500,boss.y)<4);
});
test('re-entry searches are bounded and never force a boss into blocked terrain',()=>{
 for(const type of types){const {game,boss}=quiet(type);let calls=0;game.world.collides=()=>{calls++;return true;};const before={x:boss.x,y:boss.y};
  game.updateEnemies(1/30);assert.equal(game.s.enemies.includes(boss),true);assert.deepEqual({x:boss.x,y:boss.y},before);assert.ok(calls<=100);assert.ok(boss.cooldown>0);const first=calls;
  game.updateEnemies(1/30);assert.equal(calls,first);
 }
});
test('re-entry cancels old attack origins and preserves normal telegraphs and valid saves',()=>{
 for(const type of types){const {game,boss}=quiet(type);if(type==='travestia'){boss.phase='tail_spin';boss.tailTime=.8;boss.tailReplyPending=true;boss.tailReply='FUCKK !';boss.tailWarning=4.2;}
  if(type==='pelican'){boss.phase='peli_tarot';boss.peliAttackCount=2;boss.peliTime=.8;boss.peliX=boss.x;boss.peliY=boss.y;}
  const hp=game.s.hp;game.updateEnemies(1/30);assert.equal(boss.phase,'chase');assert.equal(boss.tailTime,0);if(type==='pelican'){assert.equal(boss.peliTime,0);assert.equal(boss.peliReplyPending,false);}assert.equal(game.s.hp,hp);
  const snapshot=captureRun(game);assert.deepEqual(captureRun(restoreRun(snapshot)),snapshot);
 }
});
test('re-entry is offscreen and collision-safe at mobile, landscape and maximum viewport sizes',()=>{
 for(const seed of [1,42,71,2026])for(const [width,height] of [[390,844],[844,390],[1600,1600]])for(const type of types)for(let direction=0;direction<8;direction++){
  const {game,boss}=quiet(type,seed);game.viewport={width,height};game.s.x=512;game.s.y=0;game.s.moveX=Math.cos(direction*Math.PI/4);game.s.moveY=Math.sin(direction*Math.PI/4);boss.x=-2000;game.updateEnemies(1/30);
  assert.equal(visible(game,boss),false);assert.equal(game.world.collides(boss.x,boss.y,boss.r*.64),false);assert.ok(Math.hypot(boss.x-game.s.x,boss.y-game.s.y)<1600);
 }
});
test('returned special attacks keep their full warning before dealing damage',()=>{
 for(const type of ['travestia','pelican']){
  const {game,boss}=quiet(type);game.world.collides=()=>false;game.updateEnemies(1/30);
  game.s.x=boss.x-100;game.s.y=boss.y;const hp=game.s.hp;
  for(let i=0;i<60;i++)game.updateEnemies(1/30);
  assert.equal(boss.phase,'chase');assert.equal(game.s.hp,hp);
  for(let i=0;i<30&&!boss.phase.includes('windup')&&!boss.phase.endsWith('_warning');i++)game.updateEnemies(1/30);
  assert.equal(boss.phase,type==='travestia'?'tail_windup':'peli_hug_warning');
  assert.ok((type==='travestia'?boss.tailTime:boss.peliTime)>=1.2);assert.equal(game.s.hp,hp);
 }
});
test('pause and checkpoint keep the same boss and deterministic next re-entry',()=>{
 const {game,boss}=quiet('pelican');const saved=captureRun(game),restored=restoreRun(saved);game.pause();game.update(.2,{x:1,y:0});assert.equal(boss.x,-1700);game.resume();for(const run of [game,restored])run.update(1/30,{x:1,y:0});assert.deepEqual(captureRun(game),captureRun(restored));
});
test('a living boss never gates the 20-minute victory or optional endless continuation',()=>{
 const {game,boss}=quiet('travestia');game.s.elapsed=1199.99;game.update(.02,{x:1,y:0});assert.equal(game.s.mode,'victory');assert.ok(game.s.enemies.includes(boss));game.continueEndless();assert.equal(game.s.mode,'playing');assert.equal(game.s.endless,true);
});
test('old overlapping boss saves queue distant returns without losing either encounter',()=>{
 const original=JSON.parse(readFileSync(new URL('./fixtures/runstore-v5.json',import.meta.url),'utf8'));
 const game=restoreRun(original.run.snapshot);game.s.moveX=1;game.s.moveY=0;
 for(const boss of game.s.enemies){boss.x=game.s.x-2000;boss.y=game.s.y;boss.cooldown=0;}
 const progress=game.s.enemies.map(e=>({id:e.id,hp:e.hp})),rng=game.rng,id=game.id,director=structuredClone(game.bossDirector);
 game.updateEnemies(1/30);
 const nearby=game.s.enemies.filter(e=>Math.hypot(e.x-game.s.x,e.y-game.s.y)<=1600);
 assert.equal(nearby.length,1);assert.deepEqual(game.s.enemies.map(e=>({id:e.id,hp:e.hp})),progress);
 assert.equal(game.rng,rng);assert.equal(game.id,id);assert.deepEqual(game.bossDirector,director);
 const queued=game.s.enemies.find(e=>e!==nearby[0]);assert.ok(queued.cooldown>0);
 const snapshot=captureRun(game),restored=restoreRun(snapshot);assert.deepEqual(captureRun(restored),snapshot);
 for(const run of [game,restored]){run.hurt(run.s.enemies.find(e=>e.id===nearby[0].id),1e9);run.updateEnemies(.5);}
 assert.deepEqual(captureRun(game),captureRun(restored));
 assert.equal(game.s.enemies.length,1);assert.equal(game.s.enemies[0].id,queued.id);assert.equal(game.s.enemies[0].hp,queued.hp);assert.ok(Math.hypot(queued.x-game.s.x,queued.y-game.s.y)<1600);
});
