import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {HeroArt} from '../dist/hero-art.js';
import {computeHeroPose} from '../dist/hero-pose.js';
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
   const source=c.getImageData(0,0,144,128).data,rim=frame.rim.getContext('2d').getImageData(0,0,146,130).data;
   let edgePixels=0;
   for(let y=1;y<129;y++)for(let x=1;x<145;x++){
    const original=source[((y-1)*144+x-1)*4+3],alpha=rim[(y*146+x)*4+3];
    if(original===255)assert.equal(alpha,0,'the outline leaves opaque painting pixels untouched');
    if(alpha>32){edgePixels++;assert.ok([[0,0],[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>{const sx=x-1+dx,sy=y-1+dy;return sx>=0&&sx<144&&sy>=0&&sy<128&&source[(sy*144+sx)*4+3]>0;}),'outline stays on the painted silhouette');}
   }
   assert.ok(edgePixels>80);
   const calls=[],ctx=new Proxy({globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
   hero.drawVisibility(ctx,state);const images=calls.filter(c=>c[0]==='drawImage'),anchor=pose.art.anchor;
   assert.equal(images.length,1);assert.equal(images[0][2]+1,Math.round(pose.art.ground.x+(pose.art.mirror?anchor[0]-144:-anchor[0])));assert.equal(images[0][3]+1,Math.round(pose.art.ground.y-anchor[1]));
   assert.equal(calls.some(c=>['rotate','transform','scale'].includes(c[0])),false);assert.equal(JSON.stringify(state),before);
  }
  assert.equal(hero.visibility.size,2);
 }finally{globalThis.OffscreenCanvas=old;}
});
test('companion yields overlap depth to Toma and the visibility outline is the final world pass',()=>{
 const calls=[],ctx=new Proxy({globalAlpha:1,createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)}),renderer=new Renderer({getContext:()=>ctx});
 const g=new Game({seed:42});g.world.getVisible=()=>[];g.s.companion=true;Object.assign(g.s.girl,{x:g.s.x,y:g.s.y+12});
 renderer._drawGround=()=>{};renderer._actor=(_,kind)=>calls.push(kind);renderer.hero.visibilityBounds=()=>({left:-30,right:30,top:-85,foot:15});renderer.hero.drawVisibility=()=>calls.push('outline');
 renderer._dangerWarnings=(_,__,pass)=>calls.push(pass);const before=JSON.stringify(g.s);renderer.render(g,0);
 assert.ok(calls.indexOf('girl')<calls.indexOf('hero'));assert.equal(calls.at(-1),'outline');assert.equal(JSON.stringify(g.s),before);
 calls.length=0;g.s.girl.x=100;renderer.render(g,0);assert.equal(calls.includes('outline'),false,'a clear hero needs no silhouette overlay');
});
