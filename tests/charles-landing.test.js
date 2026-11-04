import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {CHARLES} from '../dist/charles.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

const innerIds=['-1,-1:forest:10','-1,-1:forest:11','-1,-1:forest:14','-1,-1:forest:5'];
const outerId='-1,-1:forest:17';
const outsideId='-1,-1:forest:12';
const rockId='-1,-1:forest:20';
function descending(){
 const g=new Game({seed:71});g.s.elapsed=1200;g.s.mode='victory';
 assert.equal(g.startCharlesEpilogue(),true);
 Object.assign(g.s.charles,{x:-151,y:-384,hits:18,attackCount:2,phase:'descend',phaseDuration:1.25,phaseTime:1.25});
 g.s.x=-151;g.s.y=-40;g.s.shotClock=100;
 return g;
}
const prop=(g,id)=>g.world.chunk(-1,-1).find(p=>p.id===id);
const collision=(g,id)=>{const p=prop(g,id);assert.ok(p,`real procedural prop ${id}`);return g.world.collides(p.x,p.y,13);};
function reach(g,name){
 for(let frame=0;frame<300&&g.s.charles.phase!==name;frame++)g.update(1/30);
 assert.equal(g.s.charles.phase,name);
}
function frozen(g){
 g.pause();const snapshot=captureRun(g),ids=g.s.charles.destroyed,worldIds=g.world.destroyed;
 for(let frame=0;frame<180;frame++)g.update(1/30,{x:1,y:1});
 assert.deepEqual(captureRun(g),snapshot);
 assert.equal(g.s.charles.destroyed,ids);assert.equal(g.world.destroyed,worldIds);
 g.resume();
}

test('landing removes nearby real pines from cached collision only when feet touch down',()=>{
 const g=descending(),c=g.s.charles;
 for(const id of [...innerIds,outerId,outsideId])assert.equal(collision(g,id),true,id);
 g.update(.25);assert.equal(c.phase,'descend');assert.deepEqual(c.destroyed,[]);
 for(const id of innerIds)assert.equal(collision(g,id),true,id);
 reach(g,'bend');
 assert.deepEqual(c.destroyed,innerIds);
 for(const id of innerIds){assert.ok(g.world.destroyed.has(id));assert.equal(collision(g,id),false,id);}
 assert.equal(collision(g,outerId),true);assert.equal(collision(g,outsideId),true);
 assert.equal(g.s.hp,g.s.maxhp);assert.equal(g.s.elapsed,1200);
});

test('takeoff destroys the wider scenery after landing while protected and distant obstacles stay solid',()=>{
 const g=descending(),c=g.s.charles;reach(g,'bend');
 assert.deepEqual(c.destroyed,innerIds);
 reach(g,'scream');assert.equal(collision(g,outerId),true);
 assert.equal(collision(g,rockId),true);assert.equal(collision(g,outsideId),true);
 reach(g,'burst');
 assert.ok(c.destroyed.includes(outerId));assert.equal(collision(g,outerId),false);
 for(const id of innerIds)assert.equal(collision(g,id),false,id);
 assert.equal(c.destroyed.length,11);
 assert.equal(c.destroyed.includes(rockId),false);assert.equal(collision(g,rockId),true);
 assert.equal(c.destroyed.includes(outsideId),false);assert.equal(collision(g,outsideId),true);
 assert.equal(g.s.hp,g.s.maxhp);
});

test('saving between landing and takeoff restores both collision and exact remaining transformation',()=>{
 const a=descending();reach(a,'bend');a.update(.2);
 assert.deepEqual(a.s.charles.destroyed,innerIds);
 const snapshot=captureRun(a),b=restoreRun(snapshot);
 assert.deepEqual(captureRun(b),snapshot);
 for(const id of innerIds)assert.equal(collision(b,id),false,id);
 assert.equal(collision(b,outerId),true);
 for(let frame=0;frame<180&&a.s.charles.phase!=='burst';frame++){
  a.update(1/30);b.update(1/30);
  assert.deepEqual(captureRun(b),captureRun(a));
  assert.deepEqual(b.world.destroyed,a.world.destroyed);
 }
 assert.equal(a.s.charles.phase,'burst');assert.equal(b.s.charles.phase,'burst');
 assert.equal(collision(b,outerId),false);
 assert.deepEqual(captureRun(restoreRun(captureRun(b))),captureRun(b));
});

test('pausing either impact and reloading grounded Charles cannot replay transitions or destruction',()=>{
 let g=descending();g.s.charles.phaseTime=.01;frozen(g);
 assert.deepEqual(g.s.charles.destroyed,[]);reach(g,'bend');
 assert.deepEqual(g.s.charles.destroyed,innerIds);
 g=restoreRun(captureRun(g));frozen(g);
 const landingIds=g.s.charles.destroyed,landingWorldIds=g.world.destroyed;
 for(let frame=0;frame<30;frame++)g.update(1/30);
 assert.equal(g.s.charles.phase,'bend');assert.equal(g.s.charles.destroyed,landingIds);
 assert.equal(g.world.destroyed,landingWorldIds);
 reach(g,'scream');g.s.charles.phaseTime=.01;frozen(g);
 assert.equal(collision(g,outerId),true);reach(g,'burst');frozen(g);
 const burstIds=g.s.charles.destroyed,burstWorldIds=g.world.destroyed;
 for(let frame=0;frame<30;frame++)g.update(1/30);
 assert.equal(g.s.charles.phase,'burst');assert.equal(g.s.charles.destroyed,burstIds);
 assert.equal(g.world.destroyed,burstWorldIds);
});

test('landing includes the 145 pixel boundary but does not reach beyond it',()=>{
 for(const [distance,destroyed] of [[145,true],[145.001,false]]){
  const g=descending();g.s.charles.x+=distance;reach(g,'bend');
  assert.equal(g.s.charles.destroyed.includes(innerIds[0]),destroyed,`${distance} pixels`);
  assert.equal(collision(g,innerIds[0]),!destroyed,`${distance} pixels`);
 }
});

test('landing and takeoff share the existing 64-item destruction budget without replacing earlier IDs',()=>{
 for(const initialCount of [63,64]){
  const g=descending(),c=g.s.charles;
  const previous=g.world.getVisible(10000,10000,4000,4000)
   .filter(p=>['tree','pine','crate','pallet','barricade','planter'].includes(p.type))
   .slice(0,initialCount).map(p=>p.id);
  assert.equal(previous.length,initialCount);
  c.destroyed=[...previous];g.world.setDestroyed(c.destroyed);
  reach(g,'bend');
  assert.equal(c.destroyed.length,64);
  assert.deepEqual(c.destroyed.slice(0,initialCount),previous);
  assert.equal(collision(g,innerIds[0]),initialCount===64);
  assert.equal(collision(g,innerIds[1]),true);
  const landed=[...c.destroyed];reach(g,'burst');
  assert.deepEqual(c.destroyed,landed);assert.equal(collision(g,outerId),true);
  assert.equal(new Set(c.destroyed).size,CHARLES.maxDestroyed);
  const restored=restoreRun(captureRun(g));
  assert.deepEqual(restored.s.charles.destroyed,landed);
  assert.deepEqual(restored.world.destroyed,g.world.destroyed);
 }
});

test('a real seed 71 dodge leaves scenery for both later transformation impacts',()=>{
 const g=new Game({seed:71});g.s.elapsed=1200;g.s.mode='victory';
 assert.equal(g.startCharlesEpilogue(),true);
 const c=g.s.charles,impacts=new Map();
 for(let frame=0;frame<1200&&c.phase!=='burst';frame++){
  const before=c.phase,d=Math.hypot(g.s.x-c.x,g.s.y-c.y);
  const input=['cape_warning','cape_spin'].includes(c.phase)&&d<c.capeRadius+38
   ?{x:(g.s.x-c.x)/d,y:(g.s.y-c.y)/d}:{x:0,y:0};
  g.update(1/30,input);
  assert.equal(g.s.mode,'playing');
  if(c.phase!==before&&['recover','bend','burst'].includes(c.phase))impacts.set(c.phase,[...c.destroyed]);
 }
 assert.equal(c.phase,'burst');assert.equal(c.hits,18);
 assert.equal(g.s.hp,g.s.maxhp);assert.equal(g.s.elapsed,1200);
 const wave=impacts.get('recover'),landing=impacts.get('bend'),takeoff=impacts.get('burst');
 assert.ok(wave.length>0,'the first shockwave still breaks scenery');
 assert.ok(!wave.includes('0,-1:10'),'the wave leaves the nearby landing prop intact');
 assert.ok(landing.length>wave.length,'landing breaks additional scenery');
 assert.ok(landing.includes('0,-1:10'));
 assert.ok(!landing.includes('-1,-1:forest:16'),'outer pine survives until takeoff');
 assert.ok(takeoff.length>landing.length,'takeoff breaks additional outer scenery');
 assert.ok(takeoff.includes('-1,-1:forest:16'));
});

test('wave destruction is a deterministic subset while landing and takeoff clear their full geometry',()=>{
 const g=descending(),c=g.s.charles;
 Object.assign(c,{hits:0,attackCount:0,phase:'shockwave',phaseDuration:1.8,phaseTime:1.8});
 reach(g,'recover');
 assert.deepEqual([...c.destroyed].sort(),[
  '-1,-1:forest:12','-1,-1:forest:15','-1,-1:forest:18',
  '-1,-1:forest:3','-1,-1:forest:6','-1,-1:forest:9','-1,-2:forest:16'
 ]);
 for(const id of innerIds)assert.equal(collision(g,id),true,id);
 assert.equal(collision(g,outerId),true);
 const waveIds=[...c.destroyed];
 Object.assign(c,{hits:18,attackCount:2,phase:'descend',phaseDuration:1.25,phaseTime:1.25});
 reach(g,'bend');
 assert.deepEqual(c.destroyed.slice(waveIds.length),innerIds);
 for(const id of innerIds)assert.equal(collision(g,id),false,id);
 assert.equal(collision(g,outerId),true);
 reach(g,'burst');
 assert.equal(c.destroyed.length,15);assert.equal(collision(g,outerId),false);
 assert.equal(collision(g,rockId),true);
 const restored=restoreRun(captureRun(g));
 assert.deepEqual(restored.world.destroyed,g.world.destroyed);
});
