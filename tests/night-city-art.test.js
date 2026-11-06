import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {CityArt} from '../dist/city-art.js';
import {buildingGeometry} from '../dist/prop-geometry.js';

function recordingCanvas(width=390,height=844){
 const calls=[],ctx=new Proxy({}, {
  get:(_,key)=>(...args)=>{calls.push([key,...args]);if(key==='createRadialGradient')return{addColorStop:(...stop)=>calls.push(['colorStop',...stop])};},
  set:(_,key,value)=>(calls.push([key,value]),true)
 });
 return{width,height,calls,getContext:()=>ctx};
}
function withCanvas(fn){
 const previous=globalThis.OffscreenCanvas,created=[];
 globalThis.OffscreenCanvas=class{constructor(w,h){const c=recordingCanvas(w,h);created.push(c);return c;}};
 try{return fn(created);}finally{globalThis.OffscreenCanvas=previous;}
}
const fixtures=['phone','foodcart','vending'].map((type,i)=>({type,x:110+i*100,y:160,w:40,h:50,variant:i}));
fixtures.push({type:'building',buildingKind:'shop',x:450,y:160,w:140,h:180,variant:4});

test('warm night storefronts reuse three glow sprites and only the current mode image',()=>withCanvas(created=>{
 const city=new CityArt(),c=recordingCanvas();
 for(const p of fixtures)city.drawProp(c.getContext(),p,42,0);
 assert.equal(city.glows.size,3);
 for(const p of fixtures){const item=city._propImage(p,42);assert.equal(item.reducedImage,undefined,'no unused reduced copy');assert.equal(item.cutaway,undefined,'no unused cutaway');assert.ok(item.image.calls.some(v=>v[0]==='drawImage'),'light is baked into the sprite');}
 const cold=created.length;
 for(let frame=0;frame<20;frame++)for(const p of fixtures)city.drawProp(c.getContext(),p,42,frame/60);
 assert.equal(created.length,cold,'warm props create neither canvases nor gradients');
 assert.equal(created.flatMap(c=>c.calls).filter(v=>v[0]==='createRadialGradient').length,3);
}));

test('shop light spills behind its art and reduced effects lazily replace the mode image',()=>withCanvas(()=>{
 const city=new CityArt(),p=fixtures.at(-1),snapshot=JSON.stringify(p),item=city._propImage(p,42);
 const light=item.image.calls.filter(v=>v[0]==='drawImage').at(-1)[1],spill=light.calls.filter(v=>v[0]==='drawImage').at(-1);
 assert.ok(spill[3]+spill[5]/2>buildingGeometry(p).foot,'pavement light is centered in front of the storefront');
 assert.ok(item.image.calls.some(v=>v[0]==='globalCompositeOperation'&&v[1]==='destination-over'),'glow stays behind the prop');
 const normal=recordingCanvas(),reduced=recordingCanvas(),later=recordingCanvas();
 city.drawProp(normal.getContext(),p,42,0,false);city.drawProp(reduced.getContext(),p,42,0,true);city.drawProp(later.getContext(),p,42,4,true);
 const dim=city._propImage(p,42,true);
 assert.equal(normal.calls.find(v=>v[0]==='drawImage')[1],item.image);
 assert.equal(reduced.calls.find(v=>v[0]==='drawImage')[1],dim.image);assert.notEqual(dim.image,item.image);
 assert.equal(city.props.size,1,'mode switch releases all old images');
 assert.ok(![...city.props.values()].includes(item));
 assert.ok(dim.image.calls.some(v=>v[0]==='globalAlpha'&&v[1]===.22));
 assert.deepEqual(reduced.calls,later.calls,'reduced storefronts stay static');assert.equal(JSON.stringify(p),snapshot);
}));

test('prop cache stays within 8 MiB including cutaways and regenerates evicted images',()=>withCanvas(()=>{
 const city=new CityArt(),base={type:'building',buildingKind:'apartment',x:0,y:0,w:150,h:180,variant:2};
 const first=city._propImage(base,42),before=JSON.stringify(first.image.calls);
 for(let i=1;i<100;i++){
  const p={...base,x:i*173},item=city._propImage(p,42);city._cutaway(item,p);
  const bytes=[...city.props.values()].reduce((sum,v)=>sum+(v.image.width*v.image.height+(v.cutaway?v.cutaway.width*v.cutaway.height:0))*4,0);
  assert.equal(city.propBytes,bytes);assert.ok(bytes<=8*1024*1024);assert.ok(city.props.size<=96);
 }
 assert.ok(![...city.props.values()].includes(first));
 assert.equal(JSON.stringify(city._propImage(base,42).image.calls),before);
 const c=recordingCanvas();city.drawGround(c.getContext(),{x:0,y:0},390,844,12345);
 assert.equal(city.props.size,0);assert.equal(city.propBytes,0,'seed switch resets memory accounting');

}));

test('wet patches follow seeded asphalt lanes, stay inside their tile, and vary across seeds',()=>{
 const city=new CityArt(),colors=new Set();
 for(let tx=-3;tx<=3;tx++)for(let ty=-3;ty<=3;ty++){
  const patches=city._wetPatches(tx,ty,42);assert.deepEqual(patches,city._wetPatches(tx,ty,42));
  for(const p of patches){
   colors.add(p.color);assert.ok(p.x-p.w/2-3>=0&&p.x+p.w/2+3<256);assert.ok(p.y-p.h/2-3>=0&&p.y+p.h/2+3<256);
   const wx=((tx*256+p.x)%512+512)%512,wy=((ty*256+p.y)%512+512)%512;
   assert.ok(Math.min(wx,512-wx,wy,512-wy)<70,'reflections stay on asphalt');
  }
 }
 assert.equal(colors.size,3);assert.notDeepEqual(city._wetPatches(0,0,42),city._wetPatches(0,0,12345));
});

test('puddle shimmer uses warm tiles and is completely static with reduced effects',()=>withCanvas(created=>{
 const city=new CityArt(),camera={x:0,y:0},render=(time,reduced)=>{const c=recordingCanvas();city.drawGround(c.getContext(),camera,390,844,42,time,reduced);return c.calls;};
 const a=render(0,false),count=created.length,b=render(2,false);
 assert.notDeepEqual(a,b);assert.equal(created.length,count,'shimmer never rebuilds terrain');
 assert.deepEqual(render(0,true),render(2,true));
 for(let x=0;x<65;x++)city._tile(x,0,42);assert.ok(city.tiles.size<=48);
 const first=JSON.stringify(city._tile(0,0,42).calls);for(let x=80;x<145;x++)city._tile(x,0,42);
 assert.equal(JSON.stringify(city._tile(0,0,42).calls),first,'evicted street detail regenerates identically');
}));

let native;try{native=createRequire(import.meta.url)('@napi-rs/canvas');}catch{}
test('real cutaway never hides more than the original uniform fade anywhere on short or tall buildings',{skip:!native&&'optional @napi-rs/canvas is not installed'},()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  for(const reduced of [false,true])for(const buildingKind of ['apartment','garage','warehouse','shop','ruin'])for(const h of [76,180]){
   const city=new CityArt(),p={type:'building',buildingKind,x:0,y:0,w:h===76?72:150,h,variant:2,damage:0},item=city._propImage(p,42,reduced),cutaway=city._cutaway(item,p);
   assert.equal(city._cutaway(item,p),cutaway,'masked image is cached');
   const {width,height}=item.image,original=item.image.getContext('2d').getImageData(0,0,width,height).data,cut=cutaway.getContext('2d').getImageData(0,0,width,height).data;
   let gain=0;
   for(let i=3;i<original.length;i+=4){assert.ok(cut[i]<=Math.ceil(original[i]*.34),`${buildingKind} ${h}: no opaque roof, fade or doorstep regression`);if(original[i]>240&&cut[i]<50)gain++;}
   if(h===180&&buildingKind==='apartment')assert.ok(gain>1000,'tall facade retains the clearer central band');
  }
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('native neon spill leaves opaque vending art and its contrast intact',{skip:!native&&'optional @napi-rs/canvas is not installed'},()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const p=fixtures[2],unlit=new CityArt();unlit._emission=()=>{};
  const base=unlit._propImage(p,42).image,{width,height}=base,plain=base.getContext('2d').getImageData(0,0,width,height).data;
  for(const reduced of [false,true]){
   const lit=new CityArt()._propImage(p,42,reduced).image.getContext('2d').getImageData(0,0,width,height).data;
   let opaque=0,spill=0;
   for(let i=0;i<plain.length;i+=4){if(plain[i+3]===255){opaque++;assert.deepEqual(lit.slice(i,i+4),plain.slice(i,i+4));}if(plain[i+3]===0&&lit[i+3]>0)spill++;}
   assert.ok(opaque>800,'test covers the machine face');assert.ok(spill>500,'neon still lights its surroundings');
  }
 }finally{globalThis.OffscreenCanvas=previous;}
});
