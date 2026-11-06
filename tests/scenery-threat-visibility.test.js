import test from 'node:test';
import assert from 'node:assert/strict';
import {CityArt} from '../dist/city-art.js';
import {World} from '../dist/world.js';
import {presentSceneryProp} from '../dist/scenery-presentation.js';
import {buildingGeometry,propForegroundBounds} from '../dist/prop-geometry.js';
function recordingCanvas(width=390,height=844){const calls=[];const ctx=new Proxy({},{get:(_,key)=>(...args)=>{calls.push([key,...args]);if(key==='createRadialGradient')return{addColorStop:(...stop)=>calls.push(['colorStop',...stop])};},set:(_,key,value)=>(calls.push([key,value]),true)});return{width,height,calls,getContext:()=>ctx};}
test('new tall facade fades for a living threat behind it even when hero is outside cover',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return recordingCanvas(w,h);}};
 try{
  const p=presentSceneryProp(new World(12345).chunk(0,0).find(p=>p.type==='building'&&p.w>=100));
  const e={x:p.x,y:p.y+buildingGeometry(p).top+55,hp:10,dead:false};
  const focus={x:p.x-250,y:p.y+240,enemies:[e]},before=JSON.stringify({p,focus});
  const city=new CityArt(),item=city._propImage(p,12345),c=recordingCanvas();city.drawProp(c.getContext(),p,12345,0,false,focus);
  assert.ok(item.cutaway,'foreground must reveal the living threat with a cached facade cutaway');
  assert.equal(c.calls.find(v=>v[0]==='drawImage')[1],item.cutaway);
  assert.notEqual(item.cutaway,item.image);
  assert.equal(JSON.stringify({p,focus}),before);
  const clear=recordingCanvas();city.drawProp(clear.getContext(),p,12345,0,false,{...focus,enemies:[{...e,dead:true}]});
  assert.equal(clear.calls.find(v=>v[0]==='drawImage')[1],item.image,'dead actors do not fade scenery');
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('every depth of short and tall cover reveals the hero or any living enemy in either effects mode',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return recordingCanvas(w,h);}};
 try{
  for(const reduced of [false,true])for(const h of [76,180])for(const buildingKind of ['apartment','garage','warehouse','shop','ruin']){
   const p={type:'building',buildingKind,x:0,y:0,w:72,h,variant:2},cover=propForegroundBounds(p),city=new CityArt();
   for(let y=cover.top+1;y<cover.foot-10;y+=10)for(const who of ['hero','enemy']){
    const actor={x:0,y,hp:10,dead:false},focus=who==='hero'?actor:{x:500,y:500,enemies:[actor]},before=JSON.stringify(focus),c=recordingCanvas();
    city.drawProp(c.getContext(),p,42,0,reduced,focus);
    const item=city._propImage(p,42,reduced);
    assert.ok(item.cutaway,`${buildingKind} ${h} ${who} at ${y} needs cutaway`);
    assert.equal(c.calls.find(v=>v[0]==='drawImage')[1],item.cutaway);assert.equal(JSON.stringify(focus),before);
   }
  }
 }finally{globalThis.OffscreenCanvas=previous;}
});
