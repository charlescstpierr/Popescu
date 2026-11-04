import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {ANIMALS} from '../dist/animals.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {positionNewRun} from '../dist/opening.js';
function empty(g){g.world.chunks.clear();for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)g.world.chunks.set(`${a},${b}`,[]);g.world.collisionBounds=new WeakMap();g.world.collisionRegion=null;}
function due(index=0){const g=new Game({seed:42});empty(g);for(const key of ['pack','horde','rival','chest'])g.timers[key]=100000;g.bossDirector.remaining=100;g.s.elapsed=30;g.timers.spawn=0;g.timers.animal=0;g.timers.animalIndex=index;return g;}
// Without the introduction-only travel preference, the sampled edge ignores movement.
for(let index=0;index<4;index++)for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]])test(`introduction ${index} prefers actual travel ${x},${y}, not opposing aim`,()=>{
 const g=due(index);Object.assign(g.s,{walkMoving:true,travelX:x,travelY:y,moveX:x,moveY:y,aimX:-x,aimY:-y});g.spawnWave(.01);const e=g.s.enemies[0],d=Math.hypot(e.x,e.y);assert.ok(ANIMALS[e.type]);assert.ok((e.x*x+e.y*y)/d>.97);
});
// A pine canopy can hide an animal even though its trunk does not block the corridor.
test('first entry rejects a clear physical corridor behind foreground canopy',()=>{
 const g=due();Object.assign(g.s,{walkMoving:true,travelX:1,travelY:0,moveX:1,moveY:0});
 g.world.chunks.get('0,0').push({id:'canopy',type:'pine',solid:true,x:155,y:70,w:20,h:18,variant:0});
 g.spawnWave(.01);const e=g.s.enemies[0];assert.ok(e);assert.ok(Math.abs(e.y)>20,'the first animal uses an unobscured angle');
});
test('later animal arrivals preserve sampled direction despite changed movement',()=>{
 for(const index of [4,5,12]){const a=due(index),b=due(index);Object.assign(a.s,{walkMoving:true,travelX:1,travelY:0});Object.assign(b.s,{walkMoving:true,travelX:-1,travelY:0});a.spawnWave(.01);b.spawnWave(.01);assert.equal(a.s.enemies[0].x,b.s.enemies[0].x);assert.equal(a.s.enemies[0].y,b.s.enemies[0].y);assert.equal(a.rng,b.rng);}
});
test('idle or wall-blocked movement does not reuse a stale travel direction',()=>{
 const a=due(),b=due();Object.assign(a.s,{walkMoving:false,travelX:1,travelY:0,moveX:1,moveY:0});Object.assign(b.s,{walkMoving:false,travelX:-1,travelY:0,moveX:-1,moveY:0});a.spawnWave(.01);b.spawnWave(.01);assert.equal(a.s.enemies[0].x,b.s.enemies[0].x);assert.equal(a.s.enemies[0].y,b.s.enemies[0].y);
});
function frame(type){const n=type==='moose'?104:type==='ostrich'?98:80;return {n,top:10-n*.94,bottom:10+n*.06};}
for(const [width,height] of [[390,844],[844,390],[240,320],[1600,1600]])for(let index=0;index<4;index++)test(`initial ${index} is fully visible with24px clearance and120px separation at ${width}x${height}`,()=>{
 const g=due(index);g.setViewport(width,height);Object.assign(g.s,{walkMoving:true,travelX:1,travelY:0});g.spawnWave(.01);const e=g.s.enemies[0],f=frame(e.type);assert.ok(ANIMALS[e.type]);
 assert.ok(Math.abs(e.x)+f.n/2<=width/2-24+1e-8);assert.ok(e.y+f.top>=-height*.48+24-1e-8);assert.ok(e.y+f.bottom<=height*.52-24+1e-8);assert.ok(Math.hypot(e.x,e.y)>=120-1e-8);assert.ok(Math.hypot(e.x,e.y)>e.r+15);assert.equal(e.cooldown,0);assert.equal(g.s.pulses.length,0);
});
test('first entry avoids a live crowd body at its preferred visible point',()=>{
 const g=due();Object.assign(g.s,{walkMoving:true,travelX:1,travelY:0});const crowd=g.spawnEnemy('normal',122,0);g.spawnWave(.01);const e=g.s.enemies[1];assert.ok(e);assert.ok(Math.abs(e.x-crowd.x)>=97||Math.abs(e.y-crowd.y)>=100,'new full body must not overlap existing crowd');
});
test('later species still spawn beyond the original outside-screen margin without an arrival pulse',()=>{
 for(const index of [4,5,6,7]){const g=due(index);g.spawnWave(.01);const e=g.s.enemies[0];assert.ok(ANIMALS[e.type]);assert.ok(Math.abs(e.x)>=g.viewport.width/2+e.r+23.99||Math.abs(e.y)>=g.viewport.height*(e.y<0?.48:.52)+e.r+23.99);assert.equal(g.s.pulses.length,0);}
});
test('a crowded outer perimeter uses a clear inner ring without forcing an overlap',()=>{
 const g=due(),f=frame('ostrich'),w=g.viewport.width/2-f.n/2-24,top=g.viewport.height*.48+f.top-24,bottom=g.viewport.height*.52-f.bottom-24;
 for(let i=0;i<32;i++){const a=i*Math.PI/16,dx=Math.cos(a),dy=Math.sin(a),d=Math.min(w/Math.max(1e-9,Math.abs(dx)),(dy<0?top:bottom)/Math.max(1e-9,Math.abs(dy)));g.spawnEnemy('normal',dx*d,dy*d);}
 g.spawnWave(.01);assert.equal(g.s.enemies.length,33);const animal=g.s.enemies.find(e=>ANIMALS[e.type]);assert.ok(animal);assert.equal(g.timers.animalIndex,1);
 for(const e of g.s.enemies.filter(e=>e!==animal))assert.ok(Math.abs(e.x-animal.x)>=48+f.n/2||e.y+24<=animal.y+f.top||e.y-100>=animal.y+f.bottom);
 assert.ok(Math.hypot(animal.x,animal.y)>=120);
});
test('initial visible animal has no immunity and retains the complete existing warning',()=>{
 const g=due();Object.assign(g.s,{walkMoving:true,travelX:1,travelY:0});g.spawnWave(.01);const e=g.s.enemies[0],hp=e.hp,playerHp=g.s.hp;g.hurt(e,18);assert.equal(e.hp,hp-18);g.updateEnemies(.01);assert.equal(e.phase,'animal_warning');assert.equal(e.animalTime,ANIMALS.ostrich.warning);assert.equal(g.s.hp,playerHp);assert.equal(g.s.pulses.length,0);
});

for(const index of [0,1,2,3,4])test(`v14 checkpoint retains initial-cycle boundary ${index} exactly`,()=>{
 const a=new Game({seed:914});positionNewRun(a);a.setViewport(240,320);a.s.elapsed=30;
 for(const key of ['pack','horde','rival','chest'])a.timers[key]=100000;
 a.timers.spawn=0;a.timers.animal=0;a.timers.animalIndex=index;a.bossDirector.remaining=100;
 Object.assign(a.s,{walkMoving:true,travelX:0,travelY:1,moveX:0,moveY:1});
 const snapshot=captureRun(a);assert.equal(snapshot.version,15);const b=restoreRun(snapshot);
 for(const g of [a,b])g.spawnWave(.01);assert.deepEqual(captureRun(a),captureRun(b));assert.equal(a.timers.animalIndex,index+(a.s.enemies.some(e=>ANIMALS[e.type])?1:0));
 b.pause();const paused=captureRun(b);b.update(.25,{x:1,y:0});assert.deepEqual(captureRun(b),paused);b.resume();
 a.setViewport(844,390);b.setViewport(844,390);for(let i=0;i<15;i++){a.update(1/60,{x:0,y:1});b.update(1/60,{x:0,y:1});assert.deepEqual(captureRun(a),captureRun(b));}
});
