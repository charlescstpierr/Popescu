import test from 'node:test';
import assert from 'node:assert/strict';
import * as artAPI from '../dist/charles-art.js';
const {charlesPose,CharlesArt}=artAPI;
const charlesMotionPose=(...args)=>{assert.equal(typeof artAPI.charlesMotionPose,'function','new complete-pose motion sampler must exist');return artAPI.charlesMotionPose(...args);};
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

const intro=time=>({x:65,y:30,phase:'intro',phaseDuration:8,phaseTime:8-time,elapsed:time,powered:false});
const names=times=>times.map(t=>charlesMotionPose(intro(t)).motionFrame.name);

test('whole-body sequence visibly brakes, settles, raises a hand, snaps and follows through',()=>{
 assert.deepEqual(names([1.75,2.1,2.5,2.8,3.05,3.3,3.5,3.7,4.15]),['brake0','brake1','settle','hover0','raise','prepare','snap','recoil','raise']);
 assert.ok(new Set(names([.1,.24,.38,.51])).size>=3,'cape flutter changes real complete paintings');
});

test('arrival face travels continuously across all painting changes without rotation or body warping',()=>{
 const face=p=>[p.x+p.motionFrame.eyes.reduce((s,v)=>s+v[0],0)/p.motionFrame.eyes.length-88,p.y+p.motionFrame.eyes.reduce((s,v)=>s+v[1],0)/p.motionFrame.eyes.length-160];
 let previous=face(charlesMotionPose(intro(0)));
 for(let i=1;i<=480;i++){
  const p=charlesMotionPose(intro(i/60)),next=face(p);
  assert.ok(Math.hypot(next[0]-previous[0],next[1]-previous[1])<4,`continuous face at ${i/60}`);
  assert.ok(p.lift>=24&&p.lift<=48,'flight must stay in existing mobile-safe vertical envelope');
  previous=next;
 }
 assert.deepEqual(face(charlesMotionPose(intro(0))),[-193,-132]);
});

test('motion uses the saved phase clock, freezes during pause and reproduces after restore',()=>{
 const g=new Game({seed:71});g.s.elapsed=1200;g.s.mode='victory';g.startCharlesEpilogue();
 for(const time of [.2,1.8,2.4,3.25,3.5,3.9,4.3,7.9]){
  Object.assign(g.s.charles,intro(time));g.pause();const snapshot=captureRun(g),pose=charlesMotionPose(g.s.charles,90);
  g.update(.2);assert.deepEqual(captureRun(g),snapshot);
  assert.deepEqual(charlesMotionPose(g.s.charles,900),pose);
  assert.deepEqual(charlesMotionPose(restoreRun(snapshot).s.charles,0),pose);g.resume();
 }
});

test('reduced effects keep the essential arrival and disable the extra hover flutter',()=>{
 for(const time of [0,.2,1.75,2.1,2.5,3.05,3.3,3.5,3.7])assert.deepEqual(charlesMotionPose(intro(time),time,false),charlesMotionPose(intro(time),time,true));
 const c={...intro(9),phase:'hover',phaseDuration:2.4,phaseTime:1};
 assert.equal(charlesMotionPose(c,0,true).motionFrame.name,'hover0');
 assert.equal(charlesMotionPose({...c,elapsed:500},0,true).motionFrame.name,'hover0');
 assert.equal(charlesMotionPose({...c,phase:'bend'}),null,'existing transformation paintings stay intact');
});

test('motion atlas failure retains original whole-body animation and never blocks rendering',async()=>{
 const old={},art=new CharlesArt({loadImage:async src=>src.includes('charles-motion-v1')?null:old});await art.ready;
 assert.equal(art.motionImage,null);assert.deepEqual(art.pose(intro(1)),charlesPose(intro(1)));
});

test('new atlas paints exactly one intact cell, with no rotation, filters, crossfade or resampling',async()=>{
 const images=[],art=new CharlesArt({loadImage:async src=>{const image={src};images.push(image);return image;}});await art.ready;
 for(let t=0;t<8;t+=.05){const calls=[],ctx=new Proxy({save(){},restore(){}},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)}),c=intro(t),before=JSON.stringify(c);
  art.draw(ctx,c);const draw=calls.filter(x=>x[0]==='drawImage');assert.equal(draw.length,1);assert.ok(draw[0][1].src.endsWith('charles-motion-v1.png'));assert.deepEqual(draw[0].slice(-4),[-88,-160,176,176]);assert.equal(JSON.stringify(c),before);assert.ok(!calls.some(x=>['rotate','scale','transform','setTransform'].includes(x[0])));
 }
 assert.equal(images.length,3);
});

test('the extra atlas has twelve distinct bounded paintings, valid eyes and explicit hand origins',async()=>{
 const {CHARLES_MOTION_FRAMES:m}=await import('../dist/charles-motion-frames.js');
 const fs=await import('node:fs');const png=fs.readFileSync(new URL('../dist/assets/charles-motion-v1.png',import.meta.url));
 assert.equal(png.readUInt32BE(16),704);assert.equal(png.readUInt32BE(20),528);assert.equal(png[25],6);assert.ok(png.length<300000);
 assert.equal(m.frames.length,12);assert.equal(new Set(m.frames.map(f=>f.name)).size,12);
 for(const frame of m.frames){assert.deepEqual(frame.anchor,[88,160]);assert.equal(frame.w,176);assert.equal(frame.h,176);assert.ok(frame.x>=0&&frame.x+176<=704&&frame.y>=0&&frame.y+176<=528);for(const p of [...frame.eyes,...(frame.hand?[frame.hand]:[])])assert.ok(p.every(n=>Number.isFinite(n)&&n>0&&n<176));}
 for(const name of ['raise','prepare','snap','recoil'])assert.ok(m.frames.find(f=>f.name===name).hand);
});

test('hand pulse follows the displayed new painting and shares its rounded render anchor',async()=>{
 const {drawCharlesForeground}=await import('../dist/charles-effects.js');
 for(const time of [3.45,3.55,3.58,3.8,4])for(const reduced of [false,true]){
  const c=intro(time),pose=charlesMotionPose(c,time,reduced),calls=[],stack=[];
  const ctx=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();}},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
  drawCharlesForeground(ctx,c,reduced,pose);const arc=calls.find(x=>x[0]==='arc');assert.ok(arc);assert.equal(arc[1],pose.hand.x);assert.equal(arc[2],pose.hand.y);assert.equal(ctx.globalAlpha,1);
 }
});
