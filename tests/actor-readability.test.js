import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {HeroArt} from '../dist/hero-art.js';
import {ActorArt} from '../dist/actor-art.js';
import {Renderer} from '../dist/renderer.js';
import {drawTelegraph,TELEGRAPH_STYLES} from '../dist/combat-art.js';
import {solveHeroAim,computeHeroPose} from '../dist/hero-pose.js';
import {HERO_FRAMES} from '../dist/hero-frames.js';
const require=createRequire(import.meta.url);let native;try{native=require('@napi-rs/canvas');}catch{}
const options={skip:!native?'@napi-rs/canvas is not installed':false};
const previousCanvas=globalThis.OffscreenCanvas;
if(native)globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
test.after(()=>{if(previousCanvas)globalThis.OffscreenCanvas=previousCanvas;else delete globalThis.OffscreenCanvas;});
const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
function record(canvas){
 const ctx=canvas.getContext('2d'),images=[],draw=ctx.drawImage;
 ctx.drawImage=function(...args){images.push({args,t:this.getTransform(),smoothing:this.imageSmoothingEnabled});return draw.apply(this,args);};
 return {ctx,images};
}
function snapped({args,t,smoothing}){
 const x=args.length===9?args[5]:args[1],y=args.length===9?args[6]:args[2];
 for(const value of [t.a*x+t.c*y+t.e,t.b*x+t.d*y+t.f])assert.ok(Math.abs(value-Math.round(value))<1e-5,`destination ${value} must land on a device pixel`);
 assert.equal(smoothing,false);
}
test('Toma rim preserves opaque painted pixels in all fourteen views, with one cached extra blit',options,async()=>{
 const art=new HeroArt({loadImage:path=>native.loadImage(path.replace('file://',''))});await art.ready;
 const angles=Object.entries(HERO_FRAMES.views).flatMap(([id,v])=>['N','S'].includes(id)?[v.angle]:[v.angle,Math.PI-v.angle]),views=new Set();
 for(const angle of angles){
  const s={x:130,y:145,walkMoving:true,walkDistance:21,shots:[],shotClock:0,stunt:{active:false}};
  Object.assign(s,solveHeroAim(s,{x:s.x+Math.cos(angle)*200,y:s.y-40+Math.sin(angle)*200}));
  views.add(computeHeroPose(s).art.id);
  const bare=native.createCanvas(280,220),lit=native.createCanvas(280,220);art.draw(bare.getContext('2d'),s,0,true);art.draw(lit.getContext('2d'),s,0,false);
  const a=pixels(bare),b=pixels(lit);let added=0;
  for(let y=1;y<219;y++)for(let x=1;x<279;x++){
   const k=(y*280+x)*4;
   if(a[k+3]===255)assert.deepEqual(b.slice(k,k+4),a.slice(k,k+4),'the painting itself stays unchanged');
   if(a[k+3]===0&&b[k+3]>0){added++;assert.ok([k-4,k+4,k-1120,k+1120].some(p=>a[p+3]>0),'a rim never reaches farther than one pixel from the silhouette');}
  }
  assert.ok(added>60,'the silhouette has a readable edge');
  const cached=art.outlines.size,{ctx,images}=record(native.createCanvas(280,220));art.draw(ctx,s,0,false);
  assert.equal(art.outlines.size,cached);assert.equal(images.length,2,'one cached outline and one whole painting');
  const reduced=record(native.createCanvas(280,220));art.draw(reduced.ctx,s,0,true);assert.equal(reduced.images.length,1,'reduced effects skips the extra pass');
 }
 assert.equal(views.size,14);
});
test('hero and atlas actor destinations stay crisp under fractional cameras, DPR and mirroring',options,async()=>{
 const hero=new HeroArt({loadImage:path=>native.loadImage(path.replace('file://',''))}),actors=new ActorArt({loadImage:path=>native.loadImage(new URL('../dist/'+path,import.meta.url).pathname)});await Promise.all([hero.ready,actors.ready]);
 for(const dpr of [1,1.5,2])for(const direction of [-1,1]){
  const {ctx,images}=record(native.createCanvas(600,500));ctx.setTransform(dpr,0,0,dpr,13.37,7.13);ctx.imageSmoothingEnabled=true;
  const s={x:100.23,y:140.61,shots:[],shotClock:0,stunt:{active:false}};Object.assign(s,solveHeroAim(s,{x:s.x+direction*200,y:s.y-40}));hero.draw(ctx,s,0,false);
  for(const image of images)snapped(image);
  for(const type of ['normal','sprinter','gas','tank','jealous','explosive','matriarch','orangutan','rival_goat','rival_rooster']){
   images.length=0;actors.draw(ctx,{type,x:100.23,y:140.61,faceX:direction,faceY:0,windup:.4,chargeDirX:direction,swipeDirX:direction},'enemy',2,s,0,false);
   assert.equal(images.length,2);for(const image of images)snapped(image);
  }
 }
});
test('all warning families share a solid two-pixel edge and intensify only inside their fixed boundary',options,()=>{
 for(const [family,style]of Object.entries(TELEGRAPH_STYLES)){
  const render=(remaining,time,reduced)=>{const canvas=native.createCanvas(100,100),ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(50,50,30,0,Math.PI*2);drawTelegraph(ctx,family,remaining,time,reduced);return canvas;};
  const early=render(style.windup,1,false),late=render(.01,1,false);
  assert.ok(pixels(late)[(50*100+50)*4+3]>pixels(early)[(50*100+50)*4+3]);
  const a=pixels(early),b=pixels(late);for(let i=3;i<a.length;i+=4)assert.equal(a[i]>0,b[i]>0,'urgency never changes the warning footprint');
  assert.deepEqual(pixels(render(.1,1,true)),pixels(render(.1,99,true)),'reduced effects never pulses');
  for(const x of [20,80])assert.ok(b[(50*100+x)*4+3]>0);assert.equal(b[(50*100+83)*4+3],0);
 }
});
test('gas remains translucent over the entire damaging disk and reduced effects is still',options,()=>{
 const cloud={x:60,y:60,r:35,life:2,maxlife:3},render=(time,reducedEffects)=>{
  const canvas=native.createCanvas(120,120),renderer=Object.assign(Object.create(Renderer.prototype),{ctx:canvas.getContext('2d'),time,reducedEffects});const before=JSON.stringify(cloud);renderer._cloud(cloud);assert.equal(JSON.stringify(cloud),before);return pixels(canvas);
 };
 const a=render(1,false),b=render(8,false);assert.notDeepEqual(a,b,'puffs drift');
 for(const [x,y]of [[60,60],[28,60],[92,60],[60,28],[60,92]]){const alpha=a[(y*120+x)*4+3];assert.ok(alpha>0&&alpha<200,'all damaging ground stays visible through the cloud');}
 assert.deepEqual(render(1,true),render(8,true));
});
test('rooster preparation uses a curved gauge and crow uses sound arcs without a text box',options,()=>{
 for(const fields of [{windup:.8},{windup:.2},{crow:.6}]){
  const ctx=native.createCanvas(250,250).getContext('2d'),calls=[];
  for(const method of ['arc','fillRect','fillText','strokeText']){const original=ctx[method];ctx[method]=function(...args){calls.push(method);return original.apply(this,args);};}
  Renderer.prototype._rivalAttack.call({ctx,time:1,reducedEffects:false},{type:'rival_rooster',x:120,y:150,...fields},true);
  assert.ok(calls.includes('arc'));assert.ok(!calls.some(c=>['fillRect','fillText','strokeText'].includes(c)));
 }
});
test('rooster shockwave keeps a hollow centre and two closed boundaries without a radial seam',options,()=>{
 const canvas=native.createCanvas(220,220),ctx=canvas.getContext('2d');Renderer.prototype._shockwave.call({ctx},{x:110,y:110,r:70,width:12,life:.5});
 const data=pixels(canvas),alpha=(x,y)=>data[(y*220+x)*4+3];
 assert.equal(alpha(110,110),0);assert.equal(alpha(170,110),0);
 for(const [x,y]of [[180,110],[110,180],[40,110],[110,40]])assert.ok(alpha(x,y)>0);
 assert.ok(Math.abs(alpha(180,110)-alpha(110,180))<3,'the band has no joining spoke on its right edge');
});
