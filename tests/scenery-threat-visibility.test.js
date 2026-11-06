import test from 'node:test';
import assert from 'node:assert/strict';
import {CityArt} from '../dist/city-art.js';
import {World} from '../dist/world.js';
import {presentSceneryProp} from '../dist/scenery-presentation.js';
import {buildingGeometry,propForegroundBounds} from '../dist/prop-geometry.js';
function recordingCanvas(width=390,height=844){const calls=[];const ctx=new Proxy({},{get:(_,key)=>(...args)=>{calls.push([key,...args]);if(key==='createRadialGradient')return{addColorStop:(...stop)=>calls.push(['colorStop',...stop])};},set:(_,key,value)=>(calls.push([key,value]),true)});return{width,height,calls,getContext:()=>ctx};}
test('new tall facade opens a local window for a living threat behind it even when hero is outside cover',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return recordingCanvas(w,h);}};
 try{
  const p=presentSceneryProp(new World(12345).chunk(0,0).find(p=>p.type==='building'&&p.w>=100));
  const e={x:p.x,y:p.y+buildingGeometry(p).top+55,hp:10,dead:false};
  const focus={x:p.x-250,y:p.y+240,enemies:[e]},before=JSON.stringify({p,focus});
  const city=new CityArt(),item=city._propImage(p,12345),c=recordingCanvas();city.drawProp(c.getContext(),p,12345,0,false,focus);
  assert.ok(item.cutaway,'foreground must reveal the living threat with a local facade window');
  assert.equal(c.calls.find(v=>v[0]==='drawImage')[1],item.cutaway);
  assert.notEqual(item.cutaway,item.image);
  assert.equal(JSON.stringify({p,focus}),before);
  const clear=recordingCanvas();city.drawProp(clear.getContext(),p,12345,0,false,{...focus,enemies:[{...e,dead:true}]});
  assert.equal(clear.calls.find(v=>v[0]==='drawImage')[1],item.image,'dead actors do not fade scenery');
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('every depth of short and tall cover reveals the hero or a lone living threat in either effects mode',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return recordingCanvas(w,h);}};
 try{
  for(const reduced of [false,true])for(const h of [76,180])for(const buildingKind of ['apartment','garage','warehouse','shop','ruin']){
   let now=0;const p={type:'building',buildingKind,x:0,y:0,w:72,h,variant:2},cover=propForegroundBounds(p),city=new CityArt({now:()=>now});
   for(let y=cover.top+1;y<cover.foot-10;y+=10)for(const who of ['hero','enemy']){
    const actor={x:0,y,hp:10,dead:false},focus=who==='hero'?actor:{x:500,y:500,enemies:[actor]},before=JSON.stringify(focus),c=recordingCanvas();
    city.drawProp(recordingCanvas().getContext(),p,42,0,reduced,focus);now+=120;city.drawProp(c.getContext(),p,42,0,reduced,focus);
    const item=city._propImage(p,42,reduced);
    assert.ok(item.cutaway,`${buildingKind} ${h} ${who} at ${y} needs cutaway`);
    assert.equal(c.calls.find(v=>v[0]==='drawImage')[1],item.cutaway);assert.equal(JSON.stringify(focus),before);
   }
  }
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('building windows ease over 120 render milliseconds and ignore simulation time',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return recordingCanvas(w,h);}};
 try{
  let now=0;const art=new CityArt({now:()=>now}),p={id:'0,0:0',type:'building',x:0,y:0,w:150,h:180},hero={x:0,y:-20},before=JSON.stringify(hero),seen=[];
  art._cutaway=(item,p,windows)=>{seen.push(windows.map(w=>({...w})));return item.image;};
  const draw=(focus,time=0,reduced=false)=>{seen.length=0;art.drawProp(recordingCanvas().getContext(),p,42,time,reduced,focus);return seen[0]||[];};
  assert.equal(draw(hero).length,0);
  now=60;assert.equal(draw(hero)[0].alpha,.5);assert.equal(draw(hero,10000)[0].alpha,.5,'simulation time cannot drive cutaways');
  now=120;assert.equal(draw(hero)[0].alpha,1);
  const outside={x:400,y:400};now=180;assert.equal(draw(outside)[0].alpha,.5);now=240;assert.equal(draw(outside).length,0);
  assert.equal(draw(hero,0,true)[0].alpha,1,'reduced effects reveals immediately without animation');
  assert.equal(draw(outside,0,true).length,0);assert.equal(JSON.stringify(hero),before);
  const companion={...outside,companion:true,girl:{x:12,y:-25}},saved=JSON.stringify(companion);
  assert.equal(draw(companion,0,true)[0].r,70);assert.equal(JSON.stringify(companion),saved);
  assert.equal(draw({...companion,companion:false},0,true).length,0,'locked companion cannot open architecture');
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('300 covered enemies open only three small nearest-first windows, with no hero-size fade',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return recordingCanvas(w,h);}};
 try{
  const art=new CityArt(),p={type:'building',x:0,y:0,w:150,h:180},enemies=Array.from({length:300},(_,i)=>({id:i,x:0,y:-180+i*.5,hp:10}));
  enemies[299].dead=true;enemies[298].hp=0;
  const focus={x:0,y:300,enemies},before=JSON.stringify(focus);let seen;
  art._cutaway=(item,p,windows)=>{seen=windows;return item.image;};
  art.drawProp(recordingCanvas().getContext(),p,42,0,false,focus);
  assert.equal(seen.length,3);assert.deepEqual(seen.map(a=>a.y),[297,296,295].map(i=>enemies[i].y-30));
  assert.ok(seen.every(a=>a.r===42));assert.equal(art.cutaways.size,0,'enemies cannot leave hero transition state');assert.equal(JSON.stringify(focus),before);
  for(let i=0;i<120;i++)art.drawProp(recordingCanvas().getContext(),{...p,id:`${i},0:0`},42,0,false,{x:0,y:-30});
  assert.ok(art.cutaways.size<=96,'render-only transitions are bounded during travel');
 }finally{globalThis.OffscreenCanvas=previous;}
});
