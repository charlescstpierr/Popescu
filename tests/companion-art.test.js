import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CompanionArt,COMPANION_ART,companionRank,companionFrame} from '../dist/companion-art.js';
const context=()=>{const calls=[];const ctx=new Proxy({}, {get:(_,name)=>(...args)=>calls.push([name,...args]),set:()=>true});return {ctx,calls};};
test('companion art loads one full-body atlas and handles failed loading',async()=>{
 const paths=[];const art=new CompanionArt({loadImage:async path=>{paths.push(path);return {width:768,height:640};}});await art.ready;
 assert.deepEqual(paths,['assets/companion-levels-whole.png']);assert.ok(art.image);
 for(const loader of [async()=>null,async()=>{throw Error('offline');}]){const failed=new CompanionArt({loadImage:loader});await failed.ready;assert.equal(failed.draw(context().ctx,{}, {upg:{girlfriend:1}}),false);}
});
test('rank clamps saved values and unlocked rank0 never draws',async()=>{
 assert.equal(companionRank({}),0);assert.equal(companionRank({upg:{girlfriend:99}}),5);assert.equal(companionRank({upg:{girlfriend:NaN}}),0);assert.equal(companionRank({upg:{girlfriend:2.8}}),2);
 const art=new CompanionArt({loadImage:async()=>({})});await art.ready;const {ctx,calls}=context();assert.equal(art.draw(ctx,{},{}),false);assert.equal(calls.length,0);
});
test('whole figure gait depends only on distance actually moved, never wall time',()=>{
 assert.equal(companionFrame({walkMoving:false,walkDistance:26}),0);
 assert.equal(companionFrame({walkMoving:true,walkDistance:0}),1);
 assert.equal(companionFrame({walkMoving:true,walkDistance:13}),2);
 assert.equal(companionFrame({walkMoving:true,walkDistance:26}),1);
 assert.equal(companionFrame({walkMoving:true,walkDistance:13},true),0);
 assert.equal(companionFrame({walkMoving:true,walkDistance:13,down:1}),0);
 assert.equal(companionFrame({faceY:-1}),3);
 assert.equal(companionFrame({faceY:-1,walkMoving:true,walkDistance:0}),4);
 assert.equal(companionFrame({faceY:-1,walkMoving:true,walkDistance:13}),5);
 assert.equal(companionFrame({}),0);
});
test('five ranks select distinct full paintings and preserve world foot baseline without mutation',async()=>{
 const art=new CompanionArt({loadImage:async()=>({width:768,height:640})});await art.ready;
 for(let rank=1;rank<=5;rank++){
  const girl=Object.freeze({x:10,y:20,faceX:-1,walkMoving:true,walkDistance:13});const state=Object.freeze({upg:Object.freeze({girlfriend:rank})});const {ctx,calls}=context();
  assert.equal(art.draw(ctx,girl,state,15),true);
  const images=calls.filter(c=>c[0]==='drawImage');assert.equal(images.length,1);
  assert.equal(images[0][2],256);assert.equal(images[0][3],(rank-1)*128);
  assert.equal(images[0][7],-COMPANION_ART.footY*COMPANION_ART.size/128);
  assert.ok(calls.some(c=>c[0]==='translate'&&c[1]===10&&c[2]===31));
  assert.ok(!calls.some(c=>['rotate','transform','setTransform'].includes(c[0])));
  assert.deepEqual(calls.filter(c=>c[0]==='scale'),[['scale',-1,1]]);
 }
 assert.equal(art.cache,undefined);
});
test('atlas and identity portraits are valid, modest PNG files with registered dimensions',()=>{
 const png=readFileSync(new URL('../dist/assets/companion-levels-whole.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),768);assert.equal(png.readUInt32BE(20),640);assert.ok(png.length<700000);
 for(let rank=1;rank<=5;rank++){const portrait=readFileSync(new URL(`../dist/assets/companion-portrait-${rank}.png`,import.meta.url));assert.equal(portrait.readUInt32BE(16),80);assert.equal(portrait.readUInt32BE(20),80);}
});
test('protection is only visible for actual shield grant and drones match engine origins',async()=>{
 const art=new CompanionArt({loadImage:async()=>({})});await art.ready;
 for(const flash of [0,.6]){
  const {ctx,calls}=context();art.draw(ctx,{x:10,y:20,supportFlash:flash},{upg:{girlfriend:4}},4);
  assert.equal(calls.filter(c=>c[0]==='arc').length,flash>0?2:0);
 }
 const {ctx,calls}=context();art.draw(ctx,{x:10,y:20},{upg:{girlfriend:5}},77);
 assert.ok(calls.some(c=>c[0]==='translate'&&c[1]===-11&&c[2]===-5));
 assert.ok(calls.some(c=>c[0]==='translate'&&c[1]===31&&c[2]===-5));
});
