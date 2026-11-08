import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {propCollisionBounds} from '../dist/prop-geometry.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function quiet(g=new Game({seed:42})){
 g.s.shotClock=1e6;
 for(const k of Object.keys(g.timers))if(!k.endsWith('Index'))g.timers[k]=1e6;
 g.bossDirector.remaining=180;
 return g;
}
function building(){
 const g=quiet(),b=propCollisionBounds(g.world.chunk(0,0).find(p=>p.type==='building'));
 g.s.x=b.x;g.s.y=b.y+b.h/2+60;
 const boss=g.spawnEnemy('matriarch',b.x,b.y-b.h/2-35);
 assert.equal(g.world.collides(g.s.x,g.s.y,14),false);
 assert.equal(g.world.collides(boss.x,boss.y,boss.r*.64),false);
 return {g,boss};
}
function firstSummon(g){for(let i=0;i<361;i++)g.update(1/60);}

test('seed42 natural Matriarch summons are born outside the real building and can move',()=>{
 const {g,boss}=building();firstSummon(g);
 const summons=g.s.enemies.filter(e=>e!==boss);
 assert.equal(summons.length,4);
 assert.deepEqual(summons.map(e=>e.type),['gas','orangutan','orangutan','orangutan']);
 for(const e of summons)assert.equal(g.world.collides(e.x,e.y,e.r*.64),false,`${e.type} born inside a solid`);
 const positions=summons.map(e=>[e.x,e.y]);
 for(let i=0;i<180;i++)g.update(1/60);
 for(const [i,e] of summons.entries())assert.ok(Math.hypot(e.x-positions[i][0],e.y-positions[i][1])>1,`${e.type} must be able to move`);
 assert.equal(g.s.hp,100);assert.ok(boss.hp>0);
});

test('clear ground preserves RNG and the six/nine second cadence',()=>{
 const g=quiet();g.s.y=300;g.world.collides=()=>false;
 const boss=g.spawnEnemy('matriarch',0,0);boss.speed=0;
 const expected=new Game({seed:42});expected.rng=g.rng;
 firstSummon(g);
 assert.equal(g.s.enemies.length,5);expected.random();assert.equal(g.rng,expected.rng);
 assert.ok(boss.summon>8.98&&boss.summon<=9);
 g.updateEnemies(8.9);assert.equal(g.s.enemies.length,5);
 g.updateEnemies(.11);assert.equal(g.s.enemies.length,9);
});

test('summons preserve the exact free offsets and health before their first movement',()=>{
 const g=quiet();g.world.collides=()=>false;
 const boss=g.spawnEnemy('matriarch',0,0);boss.speed=0;boss.summon=0;
 g.updateEnemies(0);
 assert.deepEqual(g.s.enemies.slice(1).map(e=>[e.type,e.x,e.y,e.hp]),[
  ['gas',-58.5,35,42],['orangutan',-19.5,35,40],['orangutan',19.5,35,40],['orangutan',58.5,35,40]
 ]);
});

test('building summons resume deterministically from v15 and v16 saves',()=>{
 for(const version of [15,16]){
  const {g}=building();g.s.survivalDuration=1200;
  for(let i=0;i<300;i++)g.update(1/60);
  const saved=captureRun(g);saved.version=version;
  if(version===15)delete saved.game.s.survivalDuration;
  const copy=restoreRun(saved);
  for(let i=0;i<241;i++){g.update(1/60);copy.update(1/60);}
  assert.deepEqual(captureRun(copy),captureRun(g));
 }
});

test('a sealed world skips summons with bounded collision work and no RNG or id consumption',()=>{
 const g=quiet(),boss=g.spawnEnemy('matriarch',0,0);boss.summon=0;g.s.y=300;
 let calls=0;g.world.collides=()=>{calls++;return true;};
 const id=g.id,rng=g.rng;g.updateEnemies(0);
 assert.equal(g.s.enemies.length,1);assert.equal(g.id,id);assert.equal(g.rng,rng);
 assert.ok(calls<=150,`${calls} collision checks`);assert.equal(boss.summon,9);
});

test('summons respect the 300-enemy cap',()=>{
 const g=quiet();g.world.collides=()=>false;
 const boss=g.spawnEnemy('matriarch',0,0);boss.summon=0;
 for(let i=0;i<298;i++)g.spawnEnemy('normal',1000,1000);
 g.updateEnemies(0);assert.equal(g.s.enemies.length,300);
 assert.equal(g.s.enemies.at(-1).type,'gas');
});

test('summons can fall back to the free boss center with their actual movement radius',()=>{
 const g=quiet(),boss=g.spawnEnemy('matriarch',0,0);boss.summon=0;boss.speed=0;
 g.world.collides=(x,y,r)=>Math.hypot(x,y)>1e-9||r>19*.64;
 g.updateEnemies(0);
 assert.equal(g.s.enemies.length,5);
 for(const e of g.s.enemies.slice(1)){assert.equal(e.x,0);assert.equal(e.y,0);assert.equal(g.world.collides(e.x,e.y,e.r*.64),false);}
});
