import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../dist/world.js';

test('the same infinite world contains connected forest districts and five building silhouettes',()=>{
 const w=new World(42),kinds=new Set();let forests=0,cities=0;
 for(let x=-6;x<=6;x++)for(let y=-6;y<=6;y++){
  const props=w.chunk(x,y);
  if(props.some(p=>p.type==='pine')){forests++;assert.ok(props.filter(p=>p.type==='pine').length>=10);assert.ok(props.some(p=>p.type==='rock'));assert.ok(!props.some(p=>p.type==='building'));}
  else{cities++;for(const p of props.filter(p=>p.type==='building')){assert.ok(p.buildingKind);kinds.add(p.buildingKind);}}
 }
 assert.ok(forests>20&&cities>20);assert.equal(kinds.size,5);
 assert.ok(w.chunk(2,0).some(p=>p.type==='pine'));assert.ok(w.chunk(3,0).some(p=>p.type==='pine'));
});
test('forest paths, roadside discoveries and cross-sector routes stay reachable',()=>{
 const w=new World(42);
 for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++){
  const props=w.chunk(x,y);
  for(let n=0;n<512;n+=16){assert.equal(w.collides(x*512+n,y*512,13),false);assert.equal(w.collides(x*512,y*512+n,13),false);}
  for(const p of props.filter(p=>p.type==='discovery'))assert.equal(w.collides(p.x,p.y,13),false);
  if(props.some(p=>p.type==='pine'))for(let n=84;n<=428;n+=16){assert.equal(w.collides(x*512+256,y*512+n,13),false);assert.equal(w.collides(x*512+n,y*512+256,13),false);}
 }
});
test('forest generation is deterministic after eviction with bounded props and chunks',()=>{
 const w=new World(42),before=w.chunk(2,0);assert.ok(before.some(p=>p.type==='pine'));
 for(let i=0;i<300;i++)w.getVisible(i*1400,-i*900,390,844);
 assert.ok(w.chunks.size<=81);assert.deepEqual(w.chunk(2,0),before);assert.ok(before.length<=36);
});

test('forest variety is not starved by dense pine placement across seeds',()=>{
 let ruins=0,forests=0;
 for(const seed of [0,1,42,831]){
  const w=new World(seed);
  for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){
   const props=w.chunk(x,y);if(!props.some(p=>p.type==='pine'))continue;
   forests++;assert.ok(props.some(p=>p.type==='rock'),`rock: ${seed} ${x},${y}`);
   assert.ok(props.some(p=>p.type==='log'),`log: ${seed} ${x},${y}`);
   assert.ok(props.some(p=>p.type==='stump'),`stump: ${seed} ${x},${y}`);
   assert.ok(props.filter(p=>p.type==='pine').length>=10);
   ruins+=Number(props.some(p=>p.type==='forestRuin'));
  }
 }
 assert.ok(ruins>forests*.25,'large forest ruins reserve room before tree fill');
});
