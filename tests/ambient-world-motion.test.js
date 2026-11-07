import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {CityArt} from '../dist/city-art.js';
import * as river from '../dist/river-art.js';
import {riverSection} from '../dist/biomes.js';
let native;try{native=createRequire(import.meta.url)('@napi-rs/canvas');}catch{}
function usingCanvas(fn){
 const previous=globalThis.OffscreenCanvas;let count=0;
 globalThis.OffscreenCanvas=class{constructor(w,h){count++;return native.createCanvas(w,h);}};
 try{fn(()=>count);}finally{globalThis.OffscreenCanvas=previous;}
}
function frame(draw){const c=native.createCanvas(390,420),ctx=c.getContext('2d');ctx.translate(195,220);draw(ctx);return c.toBuffer('image/png');}
for(const [label,p]of [
 ['residential windows',{type:'building',buildingKind:'apartment',variant:2,w:150,h:180,x:0,y:0}],
 ['shop neon',{type:'building',buildingKind:'shop',variant:2,w:140,h:180,x:0,y:0}],
 ['forest canopy',{type:'pine',artVariant:9,variant:1,w:36,h:28,x:0,y:0}]
])test(`${label} moves deterministically with render time and stays static in reduced effects`,{skip:!native&&'optional @napi-rs/canvas is not installed'},()=>usingCanvas(count=>{
 const city=new CityArt(),before=JSON.stringify(p),draw=(t,reduced=false)=>frame(c=>city.drawProp(c,p,42,t,reduced));
 const a=draw(0),cold=count(),later=draw(9);
 assert.notDeepEqual(later,a,`${label} must change over time`);
 assert.deepEqual(draw(0),a,'seeking back to a time reproduces identical art');
 assert.equal(count(),cold,'animation reuses the original sprites');
 assert.deepEqual(draw(0,true),draw(9,true),'reduced effects is static');
 assert.equal(JSON.stringify(p),before,'presentation never writes into scenery');
}));
test('forest floor has drifting night life without rebuilding cached tiles',{skip:!native&&'optional @napi-rs/canvas is not installed'},()=>usingCanvas(count=>{
 const city=new CityArt(),camera=Object.freeze({x:1400,y:300}),draw=(t,reduced=false)=>frame(c=>{c.translate(-1400,-300);city.drawGround(c,camera,390,420,42,t,reduced);});
 const a=draw(0),cold=count();assert.notDeepEqual(draw(3),a);assert.deepEqual(draw(0),a);assert.equal(count(),cold);
 assert.deepEqual(draw(0,true),draw(3,true));assert.ok(city.tiles.size<=48);
}));
test('river flow is world anchored, stays in water, and leaves bridge surfaces clear',()=>{
 assert.equal(typeof river.drawRiverCurrent,'function');
 const draw=(left,time,reduced=false)=>{
  const calls=[],c={save(){},restore(){},fillRect(...args){calls.push(args);},set fillStyle(v){},set globalAlpha(v){}};
  river.drawRiverCurrent(c,left,-200,400,700,42,time,reduced);return calls;
 };
 const a=draw(830,0);assert.ok(a.length>0);assert.notDeepEqual(draw(830,2),a);assert.deepEqual(draw(830,0),a);assert.deepEqual(draw(830,2,true),[]);
 for(const [x,y,w]of a){const section=riverSection(0,y),maximumPaintedWidth=section.halfWidth+14;assert.ok(x>=section.x-maximumPaintedWidth+3&&x+w<=section.x+maximumPaintedWidth-3);assert.ok(Math.abs(y-Math.round(y/512)*512)>82);}
 const overlap=draw(850,0);assert.deepEqual(overlap,a,'moving the viewport does not move or restart currents');
 const wrap=(32-42%31)/11,justBefore=draw(830,wrap-.01),justAfter=draw(830,wrap+.01);
 for(const [x,y,w]of justBefore.filter(([,y])=>Math.abs(y-Math.round(y/512)*512)>95&&y>-190&&y<490)){
  assert.ok(justAfter.some(([xx,yy,ww])=>ww===w&&Math.abs(xx-x)<=1&&Math.abs(yy-y)<=1),'each current mark continues downstream across a 32px travel boundary');
 }
 assert.deepEqual(draw(0,0),[]);
});
test('street steam reuses one small strip while every warm tile remains untouched',{skip:!native&&'optional @napi-rs/canvas is not installed'},()=>usingCanvas(count=>{
 const city=new CityArt(),camera={x:0,y:0},draw=t=>frame(c=>city.drawGround(c,camera,390,420,42,t));
 draw(0);assert.ok(city.steamStrip,'actual drains emit steam');
 assert.ok(city.steamStrip.width*city.steamStrip.height*4<=48*1024,'vapor uses at most 48 KiB');
 const cold=count(),tiles=[...city.tiles.values()].map(c=>[c,c.toBuffer('image/png')]);
 for(let i=1;i<20;i++)draw(i/10);
 assert.equal(count(),cold,'no animated canvas allocation');
 for(const [canvas,bytes]of tiles)assert.deepEqual(canvas.toBuffer('image/png'),bytes,'animation never redraws cached terrain');
}));
test('animated windows and neon never refill a facade cutaway over an actor',{skip:!native&&'optional @napi-rs/canvas is not installed'},()=>usingCanvas(()=>{
 let now=0;const city=new CityArt({now:()=>now}),p={type:'building',buildingKind:'shop',variant:2,w:140,h:180,x:0,y:0},focus={x:0,y:-10,enemies:[]};
 const draw=t=>frame(c=>city.drawProp(c,p,42,t,false,focus));
 draw(0);now=120;
 assert.deepEqual(draw(0),draw(9),'the existing actor reveal has priority over animated facade lighting');
}));
