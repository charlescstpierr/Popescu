import test from 'node:test';
import assert from 'node:assert/strict';
import {CityArt} from '../dist/city-art.js';
function fakeCanvas(){const calls=[];const ctx=new Proxy({},{get:(_,key)=>(...args)=>{calls.push([key,...args]);if(key==='createRadialGradient')return{addColorStop:(...stop)=>calls.push(['colorStop',...stop])};},set:(_,key,v)=>(calls.push([key,v]),true)});return{calls,getContext:()=>ctx};}
test('five city silhouettes and forest props draw distinct cached artwork',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(){return fakeCanvas();}};
 try{const city=new CityArt(),base={type:'building',x:100,y:200,w:144,h:180,variant:1,damage:2};
 const buildings=['apartment','garage','warehouse','shop','ruin'].map(buildingKind=>city._propImage({...base,buildingKind},42));
 assert.equal(new Set(buildings.map(b=>JSON.stringify(b.image.calls))).size,5);
 const nature=['pine','rock','stump','log','forestRuin'].map(type=>city._propImage({...base,type,w:36,h:28},42));
 assert.equal(new Set(nature.map(b=>JSON.stringify(b.image.calls))).size,5);
 for(const p of nature)assert.ok(p.image.calls.some(c=>c[0]==='fillRect'));
 const snapshot=JSON.stringify(base);city._propImage(base,42);assert.equal(JSON.stringify(base),snapshot);
 for(let i=0;i<200;i++)city._propImage({...base,x:i,buildingKind:'ruin'},42);assert.ok(city.props.size<=96);
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('forest floor differs from city, regenerates deterministically and stays bounded',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(){return fakeCanvas();}};
 try{const city=new CityArt();
 const cityCalls=JSON.stringify(city._tile(0,0,42).calls),forest=JSON.stringify(city._tile(4,0,42).calls);
 assert.notEqual(forest,cityCalls);
 for(let x=0;x<130;x++)city._tile(x,7,42);
 assert.ok(city.tiles.size<=48);
 assert.equal(JSON.stringify(city._tile(4,0,42).calls),forest);
 }finally{globalThis.OffscreenCanvas=previous;}
});

test('forest paths use warm dirt and roots without city paint, and crowns have twenty variations',()=>{
 const previous=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(){return fakeCanvas();}};
 try{
  const art=new CityArt(),floor=fakeCanvas();art._forestTile(floor.getContext(),4,0,42);
  const colors=new Set(floor.calls.filter(c=>c[0]==='fillStyle').map(c=>c[1]));
  assert.ok(colors.has('#604b3b')&&colors.has('#9a7957'),'warm earth and exposed roots');
  assert.ok(!colors.has('#51434b')&&!colors.has('#b9a58f'),'no mauve paving or city crosswalk paint');
  const crowns=[];for(let v=0;v<20;v++){const c=fakeCanvas();art._nature(c.getContext(),{type:'pine',w:20,variant:v},42);crowns.push(JSON.stringify(c.calls));}
  assert.equal(new Set(crowns).size,20);
  const a=fakeCanvas(),b=fakeCanvas();art._crosswalk(a.getContext(),0,121,false,42);art._crosswalk(b.getContext(),0,121,false,42);assert.deepEqual(a.calls,b.calls);
  const styles=new Set();for(let x=-3;x<4;x++){const c=fakeCanvas();art._crosswalk(c.getContext(),x*512,121,false,42);styles.add(JSON.stringify(c.calls.filter(v=>v[0]==='fillRect').map(v=>v.slice(3))));}assert.ok(styles.size>=5,'crossing layouts and wear differ');
 }finally{globalThis.OffscreenCanvas=previous;}
});
