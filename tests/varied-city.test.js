import test from 'node:test';
import assert from 'node:assert/strict';
import * as biomes from '../dist/biomes.js';
import {CityArt} from '../dist/city-art.js';
import {World} from '../dist/world.js';

function fakeCanvas(){const calls=[];const ctx=new Proxy({},{get:(_,key)=>(...args)=>{calls.push([key,...args]);if(key==='createRadialGradient')return{addColorStop:(...stop)=>calls.push(['colorStop',...stop])};},set:(_,key,value)=>(calls.push([key,value]),true)});return{calls,getContext:()=>ctx};}
function withCanvas(fn){const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(){return fakeCanvas();}};try{return fn();}finally{globalThis.OffscreenCanvas=previous;}}

test('river follows clear corridors, joins continuously and bridges each crossroad',()=>{
 assert.equal(typeof biomes.riverSection,'function');
 for(const lane of [-3,-1,0,1,4])for(let y=-2200;y<=2200;y+=4){
  const a=biomes.riverSection(lane,y),b=biomes.riverSection(lane,y+.01);
  const center=1024+lane*4096;
  assert.ok(Math.abs(a.x-center)+a.halfWidth+12<=70,'banks stay inside existing clear street');
  assert.ok(Math.abs(a.x-b.x)<.01,'no seams at chunk boundaries');
  assert.equal(a.bridge,Math.abs(y-Math.round(y/512)*512)<=58);
  const world=new World(42);
  assert.equal(world.collides(a.x,y,13),false,'water remains fordable for old saves');
 }
});

test('condo keeps the apartment footprint but has distinct full-height balconies',()=>withCanvas(()=>{
 const city=new CityArt(),p={type:'building',x:320,y:280,w:150,h:180,variant:1,buildingKind:'apartment',damage:0};
 assert.equal(typeof city._condo,'function');
 const a=fakeCanvas(),b=fakeCanvas();city._condo(a.getContext('2d'),p,42);city._building(b.getContext('2d'),p,42);
 assert.notDeepEqual(a.calls,b.calls);assert.ok(a.calls.filter(c=>c[0]==='fillRect').length>60);
}));

test('forest combines broadleaf and evergreen silhouettes without changing pine identities',()=>withCanvas(()=>{
 const city=new CityArt(),p={type:'pine',x:100,y:100,w:20,h:18,variant:1};
 assert.equal(typeof city._broadleaf,'function');
 const a=fakeCanvas(),b=fakeCanvas();city._broadleaf(a.getContext('2d'),p,42);city._nature(b.getContext('2d'),{...p,variant:0},42);
 assert.notDeepEqual(a.calls,b.calls);
}));

test('scenery fades only when tall art covers the player and rendering stays read-only',()=>withCanvas(()=>{
 const art=new CityArt(),p={type:'pine',x:100,y:100,w:20,h:18,variant:0},focus={x:100,y:45};
 const snapshot=JSON.stringify({p,focus});const near=fakeCanvas(),far=fakeCanvas();
 art.drawProp(near.getContext('2d'),p,42,0,false,focus);art.drawProp(far.getContext('2d'),p,42,0,false,{x:300,y:300});
 assert.ok(near.calls.some(c=>c[0]==='globalAlpha'&&c[1]===.34));
 assert.ok(!far.calls.some(c=>c[0]==='globalAlpha'&&c[1]===.34));
 assert.equal(JSON.stringify({p,focus}),snapshot);
}));

test('scenery culling keeps visible rooftops while rejecting offscreen sprites before cache work',()=>{
 const art=new CityArt(),camera={x:0,y:0};assert.equal(typeof art.isPropVisible,'function');
 assert.equal(art.isPropVisible({type:'pine',x:500,y:0,w:20,h:18},camera,390,844),false);
 assert.equal(art.isPropVisible({type:'pine',x:0,y:500,w:20,h:18},camera,390,844),true,'upper canopy enters at bottom edge');
 assert.equal(art.isPropVisible({type:'building',x:0,y:600,w:150,h:200},camera,390,844),true,'a tall roof can be visible above offscreen feet');
 assert.equal(art.isPropVisible({type:'building',x:0,y:900,w:150,h:200},camera,390,844),false);
});

import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('405 generated chunks remain byte-identical to pre-change saved-world geometry and IDs',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/varied-city-legacy-world.json',import.meta.url),'utf8'));
 for(const {seed,sha256}of fixture.hashes){const world=new World(seed),chunks=[];
  for(let x=fixture.bounds[0];x<=fixture.bounds[1];x++)for(let y=fixture.bounds[0];y<=fixture.bounds[1];y++)chunks.push(world.chunk(x,y));
  assert.equal(createHash('sha256').update(JSON.stringify(chunks)).digest('hex'),sha256);
 }
});

test('dense mobile city stays warm without cycling the 96-sprite cache',()=>withCanvas(()=>{
 for(const width of [320,390]){
  const art=new CityArt(),world=new World(42),camera={x:460,y:220};
  const props=world.getVisible(camera.x,camera.y,width+210,844+240).filter(p=>p.type!=='discovery'&&art.isPropVisible(p,camera,width,844));
  for(const p of props)art._propImage(p,42);
  const images=props.map(p=>art._propImage(p,42));
  for(const [i,p]of props.entries())assert.equal(art._propImage(p,42),images[i],'warm scene reuses every cached image');
  assert.ok(art.props.size<=96);assert.ok(art.tiles.size<=48);
 }
}));

test('large street signs cannot hide the player on a clear sidewalk',()=>withCanvas(()=>{
 const art=new CityArt(),p={type:'billboard',x:100,y:100,w:86,h:52,variant:0},ctx=fakeCanvas();
 art.drawProp(ctx.getContext('2d'),p,42,0,false,{x:85,y:90});
 assert.ok(ctx.calls.some(c=>c[0]==='globalAlpha'&&c[1]===.34));
}));

test('legacy discovery plinths at the water edge receive a walkable wooden landing',()=>{
 const art=new CityArt(),ctx=fakeCanvas();assert.equal(typeof art.drawRiverLandings,'function');
 const dry={type:'discovery',x:460,y:260,w:72,h:70},bank={type:'discovery',x:978,y:260,w:72,h:70};
 art.drawRiverLandings(ctx.getContext('2d'),[dry]);assert.equal(ctx.calls.length,0);
 const before=JSON.stringify(bank);art.drawRiverLandings(ctx.getContext('2d'),[bank]);
 assert.ok(ctx.calls.some(c=>c[0]==='fillRect'));assert.equal(JSON.stringify(bank),before);
});
