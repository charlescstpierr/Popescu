import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {Renderer} from '../dist/renderer.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

const types=['normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan','rival_goat','rival_rooster','ostrich','paparazzi','moose','disco_chicken'];
function scene(type){
 const g=new Game({seed:42});g.s.elapsed=20;g.world.getVisible=()=>[];g.world.collides=()=>false;
 const e=g.spawnEnemy(type,-130,0);e.cooldown=100;e.summon=100;
 const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:()=>true});
 const r=new Renderer({getContext:()=>ctx});r._drawGround=()=>{};let phase;
 r._actor=(actor,kind,value)=>{if(actor===e&&kind==='enemy')phase=value;};
 return {g,e,r,phase:()=>{r.render(g,g.s.elapsed);return phase;}};
}

test('blocked ordinary enemies keep their contact pose instead of marching on the render clock',()=>{
 for(const type of types){const a=scene(type);a.g.world.collides=()=>true;
  const start={x:a.e.x,y:a.e.y},frames=[];
  for(let i=0;i<5;i++){a.g.s.elapsed+=.1;a.g.updateEnemies(.1);frames.push(a.phase());}
  assert.deepEqual({x:a.e.x,y:a.e.y},start);assert.deepEqual(frames,[0,0,0,0,0],type);
 }
});

test('equal actual travel selects equal gait despite different elapsed times or slowed speed',()=>{
 const a=scene('normal'),b=scene('normal');a.e.speed=40;b.e.speed=20;
 for(let i=0;i<10;i++){a.g.s.elapsed+=.05;a.g.updateEnemies(.05);}
 for(let i=0;i<20;i++){b.g.s.elapsed+=.05;b.g.updateEnemies(.05);}
 assert.equal(a.e.x,b.e.x);assert.equal(a.phase(),b.phase());assert.notEqual(a.phase(),0,'20px advances beyond the contact pose');
});

test('stopping resets contact while repeated paused renders freeze the last moving pose',()=>{
 const a=scene('normal');a.e.speed=40;a.g.s.elapsed+=.5;a.g.updateEnemies(.5);const moving=a.phase();assert.notEqual(moving,0);
 a.g.pause();const before=JSON.stringify(a.g.s);a.r.render(a.g,1000);assert.equal(a.phase(),moving);assert.equal(JSON.stringify(a.g.s),before);
 a.g.s.mode='playing';a.g.world.collides=()=>true;a.g.s.elapsed+=.1;a.g.updateEnemies(.1);assert.equal(a.phase(),0);
});

test('animal recovery and armed enemy attacks keep planted feet',()=>{
 for(const type of ['ostrich','paparazzi','moose','disco_chicken']){const a=scene(type);a.e.phase='animal_recover';a.e.animalTime=.5;a.g.updateEnemies(.05);assert.equal(a.phase(),0,type);}
});

test('walking remains visual-only and checkpoints round-trip without new schema fields',()=>{
 const a=scene('normal');a.g.s.elapsed+=.3;a.g.updateEnemies(.3);const saved=captureRun(a.g),restored=restoreRun(saved);
 assert.deepEqual(captureRun(restored),saved);assert.equal(saved.game.enemyGait,undefined);
 assert.equal(saved.game.s.enemies[0].walkDistance,undefined);
 const before=JSON.stringify(a.g.s);a.phase();a.r.render(a.g,100);assert.equal(JSON.stringify(a.g.s),before);
});

test('enemies owned by other animation systems retain their legacy gait input',()=>{
 for(const type of ['ego_peacock','ego_toad','ego_rat','ego_chameleon']){const a=scene(type);const frames=[];
  for(const elapsed of [20.01,20.11,20.21]){a.g.s.elapsed=elapsed;frames.push(a.phase());assert.equal(frames.at(-1),Math.floor(elapsed*10+a.e.id)%8,type);}
  assert.equal(new Set(frames).size,3);
 }
});
