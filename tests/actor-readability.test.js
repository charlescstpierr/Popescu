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
test('all warning families have a visible warm fill, crisp edge and fixed footprint throughout windup',options,()=>{
 for(const [family,style]of Object.entries(TELEGRAPH_STYLES)){
  const render=(remaining,time,reduced)=>{const canvas=native.createCanvas(100,100),ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(50,50,30,0,Math.PI*2);drawTelegraph(ctx,family,remaining,time,reduced);return canvas;};
  const early=render(style.windup,1,false),late=render(.01,1,false);
  assert.ok(pixels(late)[(50*100+50)*4+3]>pixels(early)[(50*100+50)*4+3]);
  const a=pixels(early),b=pixels(late);for(let i=3;i<a.length;i+=4)assert.equal(a[i]>0,b[i]>0,'urgency never changes the warning footprint');
  for(const data of [a,b]){
   const [r,g,blue,alpha]=data.slice((50*100+50)*4,(50*100+50)*4+4);
   assert.ok(r>225&&g<110&&blue<90,'every zone uses saturated red-orange danger fill');
   assert.ok(alpha>=28&&alpha<=80,'the fill reads immediately while remaining translucent');
   assert.ok(data[(50*100+79)*4+3]>=190,'the solid edge stays readable even at the start');
  }
  assert.deepEqual(pixels(render(.1,1,true)),pixels(render(.1,99,true)),'reduced effects never pulses');
  for(const x of [20,80])assert.ok(b[(50*100+x)*4+3]>0);assert.equal(b[(50*100+83)*4+3],0);
 }
});
test('danger fill pulses more strongly near impact and reduced effects retains urgency without pulsing',options,()=>{
 for(const [family,style]of Object.entries(TELEGRAPH_STYLES)){
  const alpha=(remaining,time,reduced=false,active=false)=>{
   const canvas=native.createCanvas(40,40),ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(20,20,15,0,Math.PI*2);drawTelegraph(ctx,family,remaining,time,reduced,active);return pixels(canvas)[(20*40+20)*4+3];
  };
  const high=Math.PI/16,low=3*Math.PI/16;
  assert.equal(alpha(style.windup,high),alpha(style.windup,low));
  const middle=alpha(style.windup*.5,high)-alpha(style.windup*.5,low),late=alpha(.01,high)-alpha(.01,low);
  assert.ok(middle>=8&&late>middle,'the pulse strengthens as the attack approaches');
  assert.ok(alpha(.01,low)>alpha(style.windup,low),'the pulse trough never falls back to the initial warning');
  assert.ok(alpha(.01,high,true)>alpha(style.windup,high,true),'reduced effects still shows increasing danger');
  for(const reduced of [false,true])assert.ok(alpha(0,high,reduced,true)>alpha(.01,high,reduced),'active damage is stronger than the strongest warning');
 }
});
test('gas remains translucent over the entire damaging disk and reduced effects is still',options,()=>{
 const cloud={x:60,y:60,r:35,life:2,maxlife:3},render=(time,reducedEffects)=>{
  const canvas=native.createCanvas(120,120),renderer=Object.assign(Object.create(Renderer.prototype),{ctx:canvas.getContext('2d'),time,reducedEffects});const before=JSON.stringify(cloud);renderer._cloud(cloud);assert.equal(JSON.stringify(cloud),before);return pixels(canvas);
 };
 const a=render(1,false),b=render(8,false);assert.notDeepEqual(a,b,'puffs drift');
 for(const [x,y]of [[60,60],[28,60],[92,60],[60,28],[60,92]]){
  const [r,g,blue,alpha]=a.slice((y*120+x)*4,(y*120+x)*4+4);
  assert.ok(alpha>0&&alpha<200,'all damaging ground stays visible through the cloud');
  assert.ok(g>r+40&&g>blue+100,'the cloud has a saturated toxic green identity');
 }
 for(const reduced of [false,true]){
  const data=render(1,reduced);
  for(const [x,y]of [[94,60],[25,60],[60,94],[60,25]])assert.ok(data[(y*120+x)*4+3]>190,'a continuous edge marks the full damaging radius');
  assert.equal(data[(60*120+98)*4+3],0,'no extra damaging disk is implied beyond the radius');
 }
 assert.deepEqual(render(1,true),render(8,true));
});
test('active goat charge is stronger and its remaining lane ends at the originally announced endpoint',options,()=>{
 for(const reducedEffects of [false,true]){
  const actor={type:'rival_goat',x:40,y:100,r:23,chargeDirX:1,chargeDirY:0},render=e=>{
   const canvas=native.createCanvas(250,180),before=JSON.stringify(e);Renderer.prototype._rivalAttack.call({ctx:canvas.getContext('2d'),time:Math.PI/16,reducedEffects},e);assert.equal(JSON.stringify(e),before);return pixels(canvas);
  };
  const warning=render({...actor,windup:.01}),active=render({...actor,x:97,charge:.35}),alpha=(data,x,y=110)=>data[(y*250+x)*4+3];
  assert.ok(alpha(active,115)>alpha(warning,115));
  assert.ok(alpha(active,195)>0);assert.equal(alpha(active,199),0,'advancing 57px must not push the endpoint past 196.75px');
  assert.ok(alpha(active,115,124)>0);assert.equal(alpha(active,115,128),0,'the charge width does not grow');
  assert.ok(render({...actor,windup:0,charge:0}).every(v=>v===0),'the lane ends with the attack');
 }
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
 assert.ok(alpha(180,110)>100,'the active damaging band is stronger than the warning fill');
 assert.ok(Math.abs(alpha(180,110)-alpha(110,180))<3,'the band has no joining spoke on its right edge');
});
test('the real hero rim stays readable under overlapping active charge and shockwave fills',options,async()=>{
 const hero=new HeroArt({loadImage:path=>native.loadImage(path.replace('file://',''))});await hero.ready;
 const s={x:130,y:145,shots:[],shotClock:0,stunt:{active:false}};Object.assign(s,solveHeroAim(s,{x:330,y:105}));
 const bare=native.createCanvas(280,220),lit=native.createCanvas(280,220);hero.draw(bare.getContext('2d'),s,0,true);hero.draw(lit.getContext('2d'),s,0,false);
 const a=pixels(bare),b=pixels(lit),render=withHero=>{
  const canvas=native.createCanvas(280,220),ctx=canvas.getContext('2d');ctx.fillStyle='#252238';ctx.fillRect(0,0,280,220);
  if(withHero)hero.draw(ctx,s,0,false);
  const renderer=Object.assign(Object.create(Renderer.prototype),{ctx,time:1,reducedEffects:false});
  renderer._rivalAttack({type:'rival_goat',x:50,y:120,r:23,charge:.5,chargeDirX:1,chargeDirY:0});
  renderer._shockwave({x:65,y:120,r:70,width:12,life:.5});return pixels(canvas);
 };
 const withHero=render(true),ground=render(false);let rim=0,readable=0;
 for(let i=0;i<a.length;i+=4)if(a[i+3]===0&&b[i+3]>128){
  rim++;if(Math.abs(withHero[i]-ground[i])+Math.abs(withHero[i+1]-ground[i+1])+Math.abs(withHero[i+2]-ground[i+2])>90)readable++;
 }
 assert.ok(rim>60);assert.ok(readable/rim>.85,'translucent danger must preserve contrast along the hero silhouette');
});
