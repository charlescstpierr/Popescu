import test from 'node:test';import assert from 'node:assert/strict';import{HERO_FRAMES}from'../dist/hero-frames.js';
test('new complete intermediate paintings reduce all angular gaps below forty degrees',()=>{
 for(const id of ['MSE','SSE','NNE']){const v=HERO_FRAMES.views[id];assert.ok(v,id);assert.equal(v.run.length,8);assert.equal(v.split.length,5);assert.ok(v.mirrorId);for(const f of [...v.run,...v.split])assert.deepEqual([f.w,f.h],[144,128]);}
 const angles=Object.entries(HERO_FRAMES.views).flatMap(([id,v])=>['N','S'].includes(id)?[v.angle]:[v.angle,Math.PI-v.angle]).map(a=>(a+Math.PI*4)%(Math.PI*2)).sort((a,b)=>a-b);assert.equal(angles.length,14);const gaps=angles.map((a,i)=>(angles[(i+1)%angles.length]-a+Math.PI*2)%(Math.PI*2));assert.ok(Math.max(...gaps)<40*Math.PI/180);
});
