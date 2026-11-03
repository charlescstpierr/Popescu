import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../dist/world.js';
import {propCollisionBounds} from '../dist/prop-geometry.js';

test('repeated collisions reuse static chunk footprints instead of rescanning decorations',()=>{
 const w=new World(42),props=w.chunk(0,0);let reads=0;
 for(const p of props){const solid=p.solid;Object.defineProperty(p,'solid',{get(){reads++;return solid;}});}
 w.collides(180,210,13);reads=0;
 for(let i=0;i<100;i++)w.collides(180+i/10,210,13);
 assert.equal(reads,0,'warm queries must not scan the static prop list again');
});

function reference(w,x,y,r){
 for(let a=Math.floor((x-r-110)/512);a<=Math.floor((x+r+110)/512);a++)for(let b=Math.floor((y-r-110)/512);b<=Math.floor((y+r+110)/512);b++)for(const p of w.chunk(a,b)){
  if(!p.solid)continue;const q=propCollisionBounds(p),dx=Math.max(Math.abs(x-q.x)-q.w/2,0),dy=Math.max(Math.abs(y-q.y)-q.h/2,0);
  if(dx*dx+dy*dy<r*r||(dx===0&&dy===0))return true;
 }return false;
}
test('cached collisions match legacy math across biomes, chunk boundaries and regeneration',()=>{
 for(const seed of [1,42,831]){
  const w=new World(seed);
  for(let i=0;i<12000;i++){
   const x=(i*97%4096)-2048,y=(i*173%4096)-2048,r=[0,2,13,25,60][i%5];
   assert.equal(w.collides(x,y,r),reference(w,x,y,r));
  }
  const before=w.chunk(0,0);w.collides(300,280,13);w.update(50000,-50000);const after=w.chunk(0,0);
  assert.notEqual(after,before);assert.equal(w.collides(300,280,13),reference(w,300,280,13));
 }
});
