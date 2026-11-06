import test from 'node:test';
import assert from 'node:assert/strict';
import {ActorArt} from '../dist/actor-art.js';
import {readPixels} from './helpers/read-rgba-png.js';
import {createHash} from 'node:crypto';
import {Renderer} from '../dist/renderer.js';
const originalCanvas=globalThis.OffscreenCanvas;
const calls=[];
const context=(stage=true)=>new Proxy({drawImage(image,...args){if(stage)calls.push(['image',image.path||'crop',...args]);},save(){},restore(){},translate(...args){if(stage)calls.push(['translate',...args]);},scale(...args){if(stage)calls.push(['scale',...args]);},transform(...args){if(stage)calls.push(['transform',...args]);}}, {get(target,key){return target[key]??(()=>{});}});
globalThis.OffscreenCanvas=class {constructor(w,h){this.width=w;this.height=h;}getContext(){return context(false);}};
const art=new ActorArt({loadImage:async path=>({path,width:640,height:256})});await art.ready;
function draw(type,fields,time=0){calls.length=0;const actor=Object.freeze({type,x:100,y:100,faceX:1,faceY:0,...fields});const state=Object.freeze({mode:'playing'});art.draw(context(),actor,'enemy',3,state,time);return structuredClone(calls);}
test('three enemies use separate whole attack paintings without shearing, shaking or inflation',()=>{
 for(const [type,fields,path] of [['orangutan',{windup:.6},'orangutan-slap-v1'],['orangutan',{swipe:.28},'orangutan-slap-v1'],['rival_goat',{windup:.8},'rival_goat-attack-v1'],['rival_goat',{charge:.55},'rival_goat-attack-v1'],['rival_rooster',{windup:.85},'rival_rooster-attack-v1'],['rival_rooster',{crow:.7},'rival_rooster-attack-v1']]){
  const commands=draw(type,fields);assert.ok(commands.some(c=>c[0]==='image'&&c[1].includes(path)),`${type} attack must use dedicated complete painting`);
  assert.equal(commands.some(c=>c[0]==='transform'||c[0]==='scale'&&Math.abs(c[1])!==c[2]),false);
  assert.deepEqual(commands.filter(c=>c[0]==='translate'),[['translate',100,111]]);
  assert.deepEqual(commands,draw(type,fields,999),'render must not advance with wall time');
 }
});
test('every attack phase uses the existing timer and locked direction',()=>{
 const sequences=[['orangutan',[{windup:.6},{swipe:.28},{swipe:.15},{swipe:.05}],160,64,83],['rival_goat',[{windup:.8},{windup:.3},{charge:.55},{charge:.42}],128,60,88],['rival_rooster',[{windup:.85},{windup:.5},{windup:.2},{crow:.7},{crow:.05}],128,68,78]];
 for(const [type,fields,cellWidth,anchor,size] of sequences)for(let i=0;i<fields.length;i++){
  const commands=draw(type,{...fields[i],swipeDirX:-1,swipeDirY:-1,chargeDirX:-1,chargeDirY:-1});const image=commands.find(c=>c[0]==='image'&&c[1].includes(type==='orangutan'?'slap':'attack'));
  assert.ok(image);assert.equal(image[2],i*cellWidth);assert.equal(image[3],128);assert.deepEqual(image.slice(4),[cellWidth,128,Math.round(-anchor*size/128),Math.round(-121*size/128),cellWidth*size/128,size]);
  assert.deepEqual(commands.find(c=>c[0]==='scale'),['scale',-1,1]);
 }
});
test('the ground swipe draws no procedural skin-colored third arm',()=>{
 const paints=[];const ctx=new Proxy({save(){},restore(){}},{set(target,key,value){if(key==='fillStyle'||key==='strokeStyle')paints.push(value);target[key]=value;return true;},get(target,key){return target[key]??(()=>{});}});
 Renderer.prototype._orangutanAttack.call({ctx,reducedEffects:false},{type:'orangutan',x:0,y:0,swipe:.2,swipeDirX:1,swipeDirY:0});
 for(const color of ['#b85429','#ee9a46','#b88157'])assert.equal(paints.includes(color),false);
});
test.after(()=>{globalThis.OffscreenCanvas=originalCanvas;});

test('every new whole painting is unique, transparent, foot-registered and padded inside its cell',()=>{
 for(const [file,cw,columns] of [['orangutan-slap-v1',160,4],['rival_goat-attack-v1',128,5],['rival_rooster-attack-v1',128,5]]){
  const {width,height,data}=readPixels(new URL('../dist/assets/'+file+'.png',import.meta.url));assert.deepEqual([width,height],[640,256]);const hashes=new Set();
  for(let i=0;i<columns*2;i++){let pixels=0,transparent=0,bottom=-1,edge=0;const bytes=[];
   for(let y=0;y<128;y++)for(let x=0;x<cw;x++){const p=((Math.floor(i/columns)*128+y)*width+i%columns*cw+x)*4;bytes.push(...data.subarray(p,p+4));const alpha=data[p+3];if(alpha===0)transparent++;if(alpha>32){pixels++;bottom=Math.max(bottom,y);if(x===0||x===cw-1||y===0||y===127)edge++;}}
   assert.ok(pixels>2000,`${file} ${i} complete body`);assert.ok(transparent>cw*128*.4);assert.equal(edge,0,`${file} ${i} has an unclipped border`);assert.ok(bottom>=119&&bottom<=121,`${file} ${i} foot baseline`);hashes.add(createHash('sha256').update(Buffer.from(bytes)).digest('hex'));
  }assert.equal(hashes.size,columns*2,'every pose is a distinct complete painting');
 }
});
test('a missing attack atlas falls back to the unwarped approved body and a hit flashes the full new pose',()=>{
 for(const type of ['orangutan','rival_goat','rival_rooster']){const key=type==='orangutan'?'orangutan_attack':type+'_attack',image=art.images[key];art.images[key]=null;
  const commands=draw(type,{windup:.5});assert.equal(commands.some(c=>c[0]==='transform'||c[0]==='scale'&&Math.abs(c[1])!==c[2]),false);assert.equal(commands.some(c=>c[0]==='image'),true);art.images[key]=image;
  const flashed=draw(type,{windup:.5,hitFlash:.2});assert.equal(flashed.filter(c=>c[0]==='image'&&c[1].includes(type==='orangutan'?'slap':'attack')).length,1,'the original whole painting is drawn once to stage');assert.equal(flashed.filter(c=>c[0]==='image').length,3,'one rim, one whole painting and one registered flash');
 }
});
