import test from 'node:test';
import assert from 'node:assert/strict';
import {riverSection} from '../dist/biomes.js';

// Reverting to the old 12px drift must fail: the approved river has visible bends.
test('river bends are visible while every rocky bank stays in the legacy corridor',()=>{
 let min=Infinity,max=-Infinity;
 for(let y=-8192;y<=8192;y+=2){
  const a=riverSection(0,y);min=Math.min(min,a.x-1024);max=Math.max(max,a.x-1024);
  assert.ok(Math.abs(a.x-1024)+a.halfWidth+12<=70);
  assert.ok(a.halfWidth>=24 && a.halfWidth<=32);
  const b=riverSection(0,y+.001);assert.ok(Math.abs(a.x-b.x)<.001);
  assert.equal(a.bridge,Math.abs(y-Math.round(y/512)*512)<=58);
 }
 assert.ok(max-min>46,'a mobile frame must show more than a nearly straight canal');
});

function recordingContext(){
 const calls=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));calls.push([key,...args]);},set:(_,key,value)=>(calls.push([key,value]),true)});
 return {ctx,calls};
}
// Removing the renderer, arch, state restoration or seeded detail must fail.
test('river renderer is deterministic, adds a bridge arch, and restores canvas state',async()=>{
 const module=await import('../dist/river-art.js').catch(()=>({}));
 assert.equal(typeof module.drawRiverTile,'function','independent river renderer exists');
 const a=recordingContext(),b=recordingContext(),different=recordingContext();
 module.drawRiverTile(a.ctx,3,-1,42);module.drawRiverTile(b.ctx,3,-1,42);module.drawRiverTile(different.ctx,3,-1,831);
 assert.deepEqual(a.calls,b.calls);assert.notDeepEqual(a.calls,different.calls);
 assert.ok(a.calls.some(c=>c[0]==='quadraticCurveTo'),'the bridge has a visible arched underside');
 assert.equal(a.calls[0][0],'save');assert.equal(a.calls.at(-1)[0],'restore');
 const empty=recordingContext();module.drawRiverTile(empty.ctx,0,0,42);assert.equal(empty.calls.length,0);
});

// Fractional stone vertices differed by a few anti-aliased channels between
// neighboring tile coordinate systems. Pixel-snapped vertices avoid that seam.
test('river stone and reed vertices are pixel snapped across tile coordinates',async()=>{
 const {drawRiverTile}=await import('../dist/river-art.js');const a=recordingContext();drawRiverTile(a.ctx,-13,-2,42);
 for(const call of a.calls.filter(c=>c[0]==='moveTo'||c[0]==='lineTo'))for(const n of call.slice(1))assert.ok(Number.isInteger(n),'world-anchored pixel vertex');
});
