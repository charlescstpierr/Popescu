import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api=await import('../dist/charles-art.js').catch(()=>null);
const need=()=>assert.ok(api,'Charles whole-body art module must exist');
const state=(phase,remaining=1,duration=1)=>Object.freeze({x:100,y:230,phase,phaseTime:remaining,phaseDuration:duration,elapsed:4,powered:false,hits:0});
const recording=()=>{const calls=[];return {calls,ctx:new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)})};};

test('Charles selects complete paintings for five distinct transformation poses',()=>{
 need();const expected={hover:0,shock_warning:0,shockwave:0,descend:1,bend:2,scream:3,empowered:4,cape_warning:4,cape_spin:4};
 for(const [phase,frame]of Object.entries(expected))assert.equal(api.charlesPose(state(phase),4).frame,frame,phase);
 assert.equal(api.charlesPose({...state('hover'),powered:true}).frame,4);
});

test('Charles descends continuously from hover to grounded feet using remaining phaseTime',()=>{
 need();const heights=[1,.75,.5,.25,0].map(t=>api.charlesPose(state('descend',t),0,true).lift);
 assert.equal(heights[0],api.charlesPose(state('hover'),0,true).lift);
 assert.equal(heights.at(-1),0);for(let i=1;i<heights.length;i++)assert.ok(heights[i]<heights[i-1]);
 for(const phase of ['bend','scream'])assert.equal(api.charlesPose(state(phase),0,true).lift,0);
});

test('Charles burst lifts the whole empowered frame from ground and settles at hover height',()=>{
 need();assert.equal(api.charlesPose(state('burst',1),0,true).lift,0);
 assert.equal(api.charlesPose(state('burst',0),0,true).lift,api.charlesPose(state('empowered'),0,true).lift);
});

test('Charles reduced effects remove idle bob and do not alter phase timing',()=>{
 need();const c={...state('hover'),elapsed:undefined};
 assert.equal(api.charlesPose(c,0,true).lift,api.charlesPose(c,2,true).lift);
 assert.notEqual(api.charlesPose(c,0,false).lift,api.charlesPose(c,2,false).lift);
 assert.equal(api.charlesPose(state('descend',.5),0,true).progress,.5);
});

test('Charles art loads one atlas and paints one intact frame with translation only',async()=>{
 need();const urls=[],art=new api.CharlesArt({loadImage:async src=>{urls.push(src);return {width:880,height:176};}});assert.equal(await art.ready,true);
 assert.equal(urls.length,1);assert.match(urls[0],/assets\/charles-whole-v1\.png$/);
 for(const phase of ['intro','hover','shock_warning','shockwave','cape_warning','cape_spin','recover','descend','bend','scream','burst','empowered']){
  const c=state(phase),before=JSON.stringify(c),r=recording();assert.equal(art.draw(r.ctx,c,4,false),true);
  assert.equal(r.calls.filter(c=>c[0]==='drawImage').length,1,phase);
  assert.ok(!r.calls.some(c=>['rotate','transform','setTransform','scale'].includes(c[0])),phase);
  assert.equal(JSON.stringify(c),before);
 }
});

test('Charles failed image loading reports false without substituting vector anatomy',async()=>{
 need();const art=new api.CharlesArt({loadImage:async()=>{throw new Error('missing');}});
 assert.equal(await art.ready,false);const r=recording();assert.equal(art.draw(r.ctx,state('hover')),false);assert.equal(r.calls.length,0);assert.equal(art.error.message,'missing');
});

test('Charles drawing ignores missing actors and invalid coordinates',async()=>{
 need();const art=new api.CharlesArt({loadImage:async()=>({width:880,height:176})});await art.ready;
 for(const c of [null,undefined,{x:NaN,y:0},{x:0,y:Infinity}]){const r=recording();assert.equal(art.draw(r.ctx,c),false);assert.equal(r.calls.length,0);}
});

test('Charles atlas and metadata retain five full-body cells at a common native scale',()=>{
 const png=fs.readFileSync(new URL('../dist/assets/charles-whole-v1.png',import.meta.url));assert.equal(png.readUInt32BE(16),880);assert.equal(png.readUInt32BE(20),176);assert.equal(png[25],6);
 const m=JSON.parse(fs.readFileSync(new URL('../art/source/charles/atlas-metadata.json',import.meta.url),'utf8'));
 assert.deepEqual(m.anchor,[88,160]);assert.equal(m.frames.length,5);assert.deepEqual([...new Set(m.frames.map(f=>f.scale))],[.26]);
});
