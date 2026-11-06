import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {ActorArt} from '../dist/actor-art.js';
import {HERO_FRAMES} from '../dist/hero-frames.js';
import {HeroArt} from '../dist/hero-art.js';
import {computeHeroPose,solveHeroAim} from '../dist/hero-pose.js';
import {Renderer} from '../dist/renderer.js';
import {Game} from '../dist/engine.js';
const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{}
const options={skip:native?false:'Optional @napi-rs/canvas is not installed'};
const s={x:0,y:0,elapsed:3,faceX:1,faceY:0,aimX:1,aimY:0,walkDistance:20,walkMoving:true,moveX:1,moveY:0,mode:'playing'};
test('visibility outline follows the current whole painting, its anchor and mirror',options,async()=>{
 const old=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const hero=new HeroArt({loadImage:src=>native.loadImage(fileURLToPath(src))});await hero.ready;assert.ok(hero.image);
  for(const facing of [1,-1]){
   const state={...s,faceX:facing,aimX:facing,moveX:facing},before=JSON.stringify(state),pose=computeHeroPose(state),frame=hero.visibilityFrame(pose);
   assert.equal(hero.visibilityFrame(pose),frame,'same frame and mirror reuse cached pixels');
   const expected=native.createCanvas(144,128),c=expected.getContext('2d'),f=pose.art.frame;
   if(pose.art.mirror){c.translate(144,0);c.scale(-1,1);}c.drawImage(hero.image,f.x,f.y,f.w,f.h,0,0,144,128);
   const source=c.getImageData(0,0,144,128).data,rim=frame.rim.getContext('2d').getImageData(0,0,144,128).data;
   let edgePixels=0;
   for(let y=0;y<128;y++)for(let x=0;x<144;x++){
    const original=source[(y*144+x)*4+3],alpha=rim[(y*144+x)*4+3];
    if(original>0)assert.equal(alpha,0,'the outline leaves every painted pixel untouched');
    if(alpha>32){edgePixels++;assert.ok([[0,0],[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>{const sx=x+dx,sy=y+dy;return sx>=0&&sx<144&&sy>=0&&sy<128&&source[(sy*144+sx)*4+3]>0;}),'outline stays on the painted silhouette');}
   }
   assert.ok(edgePixels>80);
   const calls=[],ctx=new Proxy({globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
   hero.drawVisibility(ctx,state);const images=calls.filter(c=>c[0]==='drawImage'),anchor=pose.art.anchor;
   const translation=calls.find(c=>c[0]==='translate');assert.equal(images.length,1);assert.equal(translation[1]+(pose.art.mirror?-images[0][6]-images[0][8]:images[0][6]),Math.round(pose.art.ground.x+(pose.art.mirror?anchor[0]-144:-anchor[0])));assert.equal(images[0][7]+translation[2],Math.round(pose.art.ground.y-anchor[1]));
   assert.equal(calls.some(c=>['rotate','ellipse'].includes(c[0])),false);assert.equal(JSON.stringify(state),before);
  }
  assert.equal(hero.visibility.size,2);
 }finally{globalThis.OffscreenCanvas=old;}
});
test('companion yields overlap depth to Toma without triggering an overlay',()=>{
 const calls=[],ctx=new Proxy({globalAlpha:1,createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)}),renderer=new Renderer({getContext:()=>ctx});
 const g=new Game({seed:42});g.world.getVisible=()=>[];g.s.companion=true;Object.assign(g.s.girl,{x:g.s.x,y:g.s.y+12});
 renderer._drawGround=()=>{};renderer._actor=(_,kind)=>calls.push(kind);renderer.hero.visibilityBounds=()=>({left:-30,right:30,top:-85,foot:15});renderer.hero.drawVisibility=()=>calls.push('outline');
 renderer._dangerWarnings=(_,__,pass)=>calls.push(pass);const before=JSON.stringify(g.s);renderer.render(g,0);
 assert.ok(calls.indexOf('girl')<calls.indexOf('hero'));assert.equal(calls.includes('outline'),false,'the companion already draws behind Toma');assert.equal(JSON.stringify(g.s),before);
 calls.length=0;g.s.girl.x=100;renderer.render(g,0);assert.equal(calls.includes('outline'),false,'a clear hero needs no silhouette overlay');
});

test('visibility eases on simulation time, freezes in pause and resets for a new run',()=>{
 const r=Object.create(Renderer.prototype),state={elapsed:0};
 assert.equal(r._heroVisibility(state,true),0);
 state.elapsed=.03;assert.equal(r._heroVisibility(state,true),.25);
 assert.equal(r._heroVisibility(state,true),.25,'repeated renders cannot animate a paused game');
 for(let i=0;i<3;i++){state.elapsed+=.03;r._heroVisibility(state,true);}assert.equal(r.heroVisibility.opacity,1);
 state.elapsed+=.04;assert.ok(Math.abs(r._heroVisibility(state,false)-.8)<1e-9);
 for(let i=0;i<5;i++){state.elapsed+=.04;r._heroVisibility(state,false);}assert.equal(r.heroVisibility.opacity,0);
 assert.equal(r._heroVisibility({elapsed:40},true),0,'another state starts clean');
});
test('only a foreground body covering the upper silhouette triggers the overlay',options,async()=>{
 const old=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const hero=new HeroArt({loadImage:src=>native.loadImage(fileURLToPath(src))}),actors=new ActorArt({loadImage:src=>native.loadImage(fileURLToPath(new URL('../dist/'+src,import.meta.url)))});await Promise.all([hero.ready,actors.ready]);
  const renderer=new Renderer(native.createCanvas(390,844));renderer.hero=hero;renderer.actors=actors;renderer._drawGround=()=>{};
  const g=new Game({seed:42});g.world.getVisible=()=>[];g.s.shotClock=0;g.s.elapsed=10;
  const check=(message,expected)=>{
   renderer.heroVisibility=null;renderer.render(g,g.s.elapsed);g.s.elapsed+=.05;const before=JSON.stringify(g.s);renderer.render(g,g.s.elapsed);
   assert.equal(renderer.heroVisibility.opacity>0,expected,message);assert.equal(JSON.stringify(g.s),before);
  };
  check('empty road',false);
  g.s.vehicles=[{kind:'car',x:g.s.x,y:g.s.y+12,carRank:1,life:2}];check('own Lamborghini touching the boots',false);g.s.vehicles=[];
  const e=g.spawnEnemy('moose',0,90);Object.assign(e,{x:g.s.x,y:g.s.y+90});check('animal touching the feet',false);
  Object.assign(e,{x:g.s.x+52,y:g.s.y+5});check('transparent animal cell margin',false);
  Object.assign(e,{type:'normal',x:g.s.x,y:g.s.y-10});check('enemy behind Toma',false);
  e.y=g.s.y+8;check('enemy actually covering the torso',true);
 }finally{globalThis.OffscreenCanvas=old;}
});
test('overlay scales with hit blink and its LRU retains a complete directional gait cycle',options,async()=>{
 const old=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const hero=new HeroArt({loadImage:src=>native.loadImage(fileURLToPath(src))});await hero.ready;
  const state={...s,invulnerable:1},alphas=[],ctx=new Proxy({globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),save(){},restore(){},drawImage(){alphas.push(this.globalAlpha);}}, {get:(o,k)=>k in o?o[k]:()=>{}});
  hero.drawVisibility(ctx,state,1/16,.5);assert.equal(alphas[0],.29);
  const poses=[];
  for(const view of Object.values(HERO_FRAMES.views))for(const frame of [...view.run,...view.split])for(const mirror of (view.mirrorId?[false,true]:[false]))poses.push({art:{frame,mirror}});
  const first=hero.visibilityFrame(poses[0]);for(const pose of poses)hero.visibilityFrame(pose);
  assert.equal(hero.visibilityFrame(poses[0]),first,'one complete atlas cycle fits without eviction');
  assert.ok(hero.visibility.size<=192);
  const oldest=hero.visibility.keys().next().value,retained=hero.visibility.get(oldest);
  const [x,y,mirror]=oldest.split(':');hero.visibilityFrame({art:{frame:{x:+x,y:+y,w:144,h:128},mirror:mirror==='true'}});
  // Artificial distinct keys exercise the bound beyond the finite atlas.
  for(let i=0;i<220;i++){hero.visibilityFrame({art:{frame:{x:i,y:0,w:144,h:128},mirror:false}});hero.visibilityFrame({art:{frame:{x:+x,y:+y,w:144,h:128},mirror:mirror==='true'}});}
  assert.ok(hero.visibility.size<=192);assert.equal(hero.visibility.get(oldest),retained);
 }finally{globalThis.OffscreenCanvas=old;}
});
test('reduced overlap checks reuse alpha masks without per-frame pixel reads',options,async()=>{
 const old=globalThis.OffscreenCanvas;let reads=0;
 globalThis.OffscreenCanvas=class{constructor(w,h){const canvas=native.createCanvas(w,h),c=canvas.getContext('2d'),get=c.getImageData;c.getImageData=function(...args){reads++;return get.apply(this,args);};return canvas;}};
 try{
  const hero=new HeroArt({loadImage:src=>native.loadImage(fileURLToPath(src))}),actors=new ActorArt({loadImage:src=>native.loadImage(fileURLToPath(new URL('../dist/'+src,import.meta.url)))});await Promise.all([hero.ready,actors.ready]);
  const body=hero.visibilityBounds(s).body,types=['normal','gas','orangutan','rival_goat','rival_rooster','moose','ostrich','paparazzi','disco_chicken','pelican','travestia','ego_peacock','ego_toad','ego_rat','ego_chameleon'];
  const check=()=>{hero.visibilityBounds(s);for(const type of types)actors.occludes({type,x:0,y:8,faceX:1,faceY:0},body,0,s,3);};
  check();assert.ok(reads>0);const warmed=reads;check();assert.equal(reads,warmed,'cached checks perform no Canvas readback');
  assert.ok(actors.occlusionMasks.size<=96);
 }finally{globalThis.OffscreenCanvas=old;}
});
test('both hero outlines preserve every painted byte under fractional cameras and DPR',options,async()=>{
 const old=globalThis.OffscreenCanvas;globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 try{
  const hero=new HeroArt({loadImage:src=>native.loadImage(fileURLToPath(src))});await hero.ready;
  const angles=Object.values(HERO_FRAMES.views).flatMap(view=>view.mirrorId?[view.angle,Math.PI-view.angle]:[view.angle]);
  for(const dpr of [1,1.5,2])for(const angle of angles)for(const distance of [0,20,50,70]){
   const state={...s,x:90.23,y:120.61,walkDistance:distance};Object.assign(state,solveHeroAim(state,{x:state.x+Math.cos(angle)*200,y:state.y-40+Math.sin(angle)*200}));
   const raw=native.createCanvas(500,400),lit=native.createCanvas(500,400),a=raw.getContext('2d'),b=lit.getContext('2d');
   a.setTransform(dpr,0,0,dpr,13.37,7.13);b.setTransform(dpr,0,0,dpr,13.37,7.13);
   hero.draw(a,state,0,true);hero.draw(b,state,0,false);hero.drawVisibility(b,state,0,1);
   const expected=a.getImageData(0,0,500,400).data,actual=b.getImageData(0,0,500,400).data;let changed=0;
   for(let i=0;i<expected.length;i+=4)if(expected[i+3])for(let j=0;j<4;j++)if(expected[i+j]!==actual[i+j])changed++;
   assert.equal(changed,0,`DPR ${dpr}, angle ${angle}, gait ${distance}`);
  }
 }finally{globalThis.OffscreenCanvas=old;}
});

for(const tainted of [false,true])test(`scenery markers require painted torso coverage (${tainted?'tainted Canvas fallback':'readable Canvas'})`,options,async()=>{
 const old=globalThis.OffscreenCanvas;let reads=0;
 globalThis.OffscreenCanvas=class{constructor(w,h){const canvas=native.createCanvas(w,h);if(tainted)canvas.getContext('2d').getImageData=()=>{reads++;throw new DOMException('Canvas is tainted','SecurityError');};return canvas;}};
 try{
  const hero=new HeroArt({loadImage:src=>native.loadImage(fileURLToPath(src))}),actors=new ActorArt({loadImage:src=>native.loadImage(fileURLToPath(new URL('../dist/'+src,import.meta.url)))});await Promise.all([hero.ready,actors.ready]);
  const renderer=new Renderer(native.createCanvas(390,844));renderer.hero=hero;renderer.actors=actors;
  const g=new Game({seed:42});Object.assign(g.s,{x:55,y:2404,elapsed:40,shotClock:0,invulnerable:0,walkMoving:false});g.s.enemies=[];
  assert.equal(g.world.collides(55,2404,13),false,'the reported position is walkable');
  const check=(expected,message)=>{
   renderer.heroVisibility=null;
   for(let i=0;i<=12;i++){g.s.elapsed+=1/60;const before=JSON.stringify(g.s);assert.doesNotThrow(()=>renderer.render(g,g.s.elapsed));assert.equal(JSON.stringify(g.s),before);}
   assert.equal(renderer.heroVisibility.opacity>0,expected,message);
  };
  check(false,'seed 42, (55,2404): scenery beside Toma does not hide his body');
  const tree={id:'covering-tree',type:'tree',x:g.s.x,y:g.s.y+12,w:40,h:30,variant:0};
  g.world.getVisible=()=>[tree];check(true,'a canopy painted over the torso activates the marker');
  const warmed=reads;check(true,'cached cover stays stable');assert.equal(reads,warmed,'the same cache entries never retry forbidden reads');
  g.world.getVisible=()=>[{id:'cutaway',type:'building',x:g.s.x,y:g.s.y+15,w:160,h:140}];check(false,'a building cutaway reveals the hero');
  g.world.getVisible=()=>[];
  const enemy=g.spawnEnemy('normal',g.s.x,g.s.y+8);Object.assign(enemy,{x:g.s.x,y:g.s.y+8});check(true,'an enemy covering the torso still activates the marker');
  enemy.x+=100;check(false,'an enemy beside Toma does not hide him');
  Object.assign(enemy,{type:'moose',x:g.s.x,y:g.s.y+90});check(false,'feet-only animal overlap is not torso coverage');
  if(tainted){assert.equal(hero.visibilityReadable,false);assert.equal(actors.occlusionReadable,false);assert.ok(reads>0);}
 }finally{globalThis.OffscreenCanvas=old;}
});

test('composited outside outlines exclude even the faintest painted alpha without reading pixels',options,()=>{
 const old=globalThis.OffscreenCanvas;
 globalThis.OffscreenCanvas=class{constructor(w,h){const canvas=native.createCanvas(w,h);canvas.getContext('2d').getImageData=()=>{throw new DOMException('Canvas is tainted','SecurityError');};return canvas;}};
 try{
  const source=native.createCanvas(20,20),c=source.getContext('2d');
  for(const [i,alpha]of [1,2,16,128,255].entries()){c.fillStyle=`rgba(120,80,40,${alpha/255})`;c.fillRect(3+i*3,8,1,3);}
  const rim=ActorArt.outline(source,0,0,20,20,20,20,'#ffe6b0',false,true);
  const result=native.createCanvas(22,22);result.getContext('2d').drawImage(rim,0,0);
  const pixels=result.getContext('2d').getImageData(0,0,22,22).data;
  for(let i=0;i<5;i++)for(let y=9;y<12;y++)assert.equal(pixels[(y*22+4+i*3)*4+3],0);
  assert.ok(pixels.some((v,i)=>i%4===3&&v>0),'the surrounding rim is present');
 }finally{globalThis.OffscreenCanvas=old;}
});
