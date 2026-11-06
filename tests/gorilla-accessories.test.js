import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ActorArt} from '../dist/actor-art.js';
const require=createRequire(import.meta.url);let native;
try{native=require('@napi-rs/canvas');}catch{}
const approved=JSON.parse(readFileSync(new URL('./fixtures/gorilla-approved-frames.json',import.meta.url)));
const original=globalThis.OffscreenCanvas;
let art;
const options={skip:native?false:'Optional @napi-rs/canvas is not installed'};
if(native){
 globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
 art=new ActorArt({loadImage:async path=>path.includes('gorilla-walk-v2')?native.loadImage(fileURLToPath(new URL('../dist/'+path,import.meta.url))):null});await art.ready;
}
test.after(()=>{globalThis.OffscreenCanvas=original;});
const bytes=frame=>frame.getContext('2d').getImageData(0,0,frame.width,frame.height).data;
const hash=frame=>createHash('sha256').update(bytes(frame)).digest('hex');
for(const type of ['jealous','gas','sprinter','tank'])test(`${type} front and rear accessories keep the approved placement through all four steps`,options,()=>{
 for(let frame=0;frame<4;frame++)for(const back of [false,true]){
  assert.equal(hash(art.frame('enemy',frame,back,type)),approved[`${type}:${frame}:${back}`],`${type} phase ${frame} ${back?'rear':'front'}`);
 }
});
test('rear jealous heart remains distinct without a speed trail or extra render effect',options,()=>{
 for(let frame=0;frame<4;frame++)assert.notEqual(hash(art.frame('enemy',frame,true,'jealous')),hash(art.frame('enemy',frame,true,'normal')));
});
test('accessories share the whole damage flash and reuse the bounded actor cache',options,()=>{
 for(const type of ['jealous','gas','sprinter','tank'])for(let frame=0;frame<4;frame++)for(const back of [false,true]){
  const sprite=art.frame('enemy',frame,back,type),flash=art.frame('enemy',frame,back,type,true);
  assert.equal(art.frame('enemy',frame,back,type),sprite);
  const base=bytes(sprite),f=bytes(flash);
  for(let i=0;i<base.length;i+=4){assert.equal(f[i+3],base[i+3]);if(f[i+3]===255)assert.deepEqual(Array.from(f.slice(i,i+3)),[255,244,215]);}
 }
 assert.ok(art.cache.size<=144);
});
test('mirror and reduced-effects draws preserve actor state and approved body sizing',options,()=>{
 const c=native.createCanvas(180,180),ctx=c.getContext('2d');
 for(const type of ['jealous','gas','sprinter','tank'])for(const faceX of [-1,1])for(const faceY of [-1,0]){
  const e=Object.freeze({type,x:90,y:140,faceX,faceY,hitFlash:0}),s=Object.freeze({});
  ctx.clearRect(0,0,180,180);assert.equal(art.draw(ctx,e,'enemy',2,s,20,true),true);const first=hash(c);
  ctx.clearRect(0,0,180,180);assert.equal(art.draw(ctx,e,'enemy',2,s,999,true),true);assert.equal(hash(c),first,'wall time does not move a cached step');
 }
});
