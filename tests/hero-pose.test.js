import test from 'node:test';
import assert from 'node:assert/strict';
import {computeHeroPose,solveHeroAim} from '../dist/hero-pose.js';
const metadata=await import('../dist/hero-frames.js');
const near=(a,b,t=1e-8)=>Math.abs(a-b)<t;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const state={x:101,y:-93,moveX:1,moveY:0,walkMoving:true,walkDistance:0,aimX:1,aimY:0};
function mapped(p,mark){const art=p.art,t=art.transform,x=(mark[0]-art.anchor[0])*(art.mirror?-1:1),y=mark[1]-art.anchor[1];return{x:art.ground.x+t.a*x+t.c*y,y:art.ground.y+t.b*x+t.d*y};}

test('each registered whole-body view supplies eight run and five split frames on one native anchor',()=>{
  const frames=metadata.HERO_FRAMES;assert.ok(frames,'whole-frame metadata must exist');assert.equal(frames.width,144);assert.equal(frames.height,128);assert.deepEqual(frames.anchor,[65,111]);
  for(const id of ['E','SE','S','NE','N']){const view=frames.views[id];assert.ok(view);assert.equal(view.run.length,8);assert.equal(view.split.length,5);for(const frame of [...view.run,...view.split]){assert.equal(frame.w,144);assert.equal(frame.h,128);for(const mark of ['muzzle','rearHand','frontHand','hip']){assert.equal(frame[mark].length,2);assert.ok(frame[mark].every(Number.isFinite));}}}
});

test('one undeformed native frame maps its painted muzzle and both grips together',()=>{
  const ids=new Set();
  for(let degree=0;degree<360;degree++){
    const angle=degree*Math.PI/180,s={...state,aimX:Math.cos(angle),aimY:Math.sin(angle)},before=JSON.stringify(s),p=computeHeroPose(s);assert.equal(JSON.stringify(s),before);assert.ok(p.art.transform,'whole painting needs one shared affine transform');ids.add(p.art.id);
    assert.deepEqual(p.art.ground,{x:s.x,y:s.y+14});assert.deepEqual(p.art.anchor,[65,111]);const t=p.art.transform;assert.deepEqual(t,{a:1,b:0,c:0,d:1});assert.ok(near(Math.hypot(p.barrelAim.x,p.barrelAim.y),1));const angles=Object.entries(metadata.HERO_FRAMES.views).flatMap(([id,v])=>['N','S'].includes(id)?[v.angle]:[v.angle,Math.atan2(Math.sin(Math.PI-v.angle),Math.cos(Math.PI-v.angle))]);const nearest=Math.min(...angles.map(a=>Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))));assert.ok(Math.abs(p.art.residual)<=nearest+1e-8);
    assert.ok(distance(mapped(p,p.art.frame.muzzle),p.muzzle)<1e-8);assert.ok(distance(mapped(p,p.art.frame.rearHand),p.weapon.grips.main)<1e-8);assert.ok(distance(mapped(p,p.art.frame.frontHand),p.weapon.grips.support)<1e-8);assert.ok(distance(mapped(p,p.art.frame.hip),p.body.hip)<1e-8);
    assert.ok(near(distance(p.weapon.pivot,p.muzzle),31));assert.ok(near((p.muzzle.x-p.weapon.pivot.x)*p.aim.y-(p.muzzle.y-p.weapon.pivot.y)*p.aim.x,0));
  }
  assert.equal(ids.size,8);
});

test('run frame is linked to actual distance, reverses backwards, and is independent of elapsed time',()=>{
  const a=computeHeroPose({...state,walkDistance:23,elapsed:0}),b=computeHeroPose({...state,walkDistance:23,elapsed:900});assert.equal(a.art.sequence,'run');assert.equal(a.art.frameIndex,2);assert.equal(a.art.frame,b.art.frame);
  const backwards=computeHeroPose({...state,walkDistance:23,moveX:-1});assert.equal(backwards.art.frameIndex,6);
  const idle=computeHeroPose({...state,moveX:0,moveY:0,walkMoving:false,walkDistance:79});assert.equal(idle.art.sequence,'run');assert.equal(idle.art.frameIndex,0);
});

test('running split descends through approved wide poses, holds one exact frame and returns without a standing snap',()=>{
  const samples=[[0,'run',0],[.09,'split',2],[.17,'split',3],[.23,'split',4],[.3,'split',4],[.5,'split',4],[.68,'split',4],[.73,'split',3],[.83,'split',2],[.97,'run',0],[1,'run',0]];
  const poses=samples.map(([progress,sequence,index])=>{const p=computeHeroPose({...state,walkDistance:63,stunt:{kind:'split',active:true,progress,faceX:1,faceY:0}});assert.equal(p.art.sequence,sequence,`sequence at ${progress}`);assert.equal(p.art.frameIndex,index,`frame at ${progress}`);assert.deepEqual(p.art.ground,{x:state.x,y:state.y+14});return p;});
  const hold=poses.slice(4,7);assert.ok(hold.every(p=>p.art.frame===hold[0].art.frame));assert.ok(hold.every(p=>distance(p.muzzle,hold[0].muzzle)<1e-8));assert.ok(hold.every(p=>p.split.amount===1));
  for(const p of poses)if(p.art.sequence==='split')assert.ok(p.art.frameIndex>=2,'run handoff never uses taller standing/preparation paintings');
});

test('per-frame painted muzzle sends an exact target ray at every view seam and split phase',()=>{
  for(const d of [80,150,500])for(const walkDistance of [0,23,67])for(const progress of [null,.09,.17,.5,.83,.97])for(let degree=0;degree<360;degree+=5){
    const angle=degree*Math.PI/180,target={x:Math.cos(angle)*d,y:Math.sin(angle)*d},s={...state,x:0,y:0,walkDistance,moveX:-1,aimX:Math.cos(angle),aimY:Math.sin(angle),stunt:{kind:'split',active:progress!==null,progress:progress??0}},before=JSON.stringify(s),solved=solveHeroAim(s,target);assert.equal(JSON.stringify(s),before);const p=computeHeroPose({...s,...solved}),dx=target.x-p.muzzle.x,dy=target.y-p.muzzle.y,n=Math.hypot(dx,dy);assert.equal(p.art.id,solved.aimArtView);assert.ok((dx*p.aim.x+dy*p.aim.y)/n>1-1e-9,`${d}px ${degree}deg frame ${walkDistance}/${progress}`);assert.ok(Math.abs(dx*p.aim.y-dy*p.aim.x)<1e-7);
  }
});

test('a fixed target keeps one body direction across every gait frame',()=>{
  for(const radius of [80,150,500])for(let degree=0;degree<360;degree++){
    const angle=degree*Math.PI/180,target={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius},s={x:0,y:0,moveX:1,moveY:0,walkMoving:true,walkDistance:0},ids=[];
    for(let step=0;step<24;step++){s.walkDistance=(step%8)*10;Object.assign(s,solveHeroAim(s,target));ids.push(s.aimArtView);}
    assert.equal(new Set(ids).size,1,`${radius}px/${degree}deg: ${ids.join(',')}`);
  }
});

test('eight-way body facing controls reverse gait independently of small projectile-angle corrections',()=>{
  const s={...state,moveX:1,moveY:0,walkDistance:60,aimArtView:'N',aimY:-1};const a=computeHeroPose({...s,aimX:.06}),b=computeHeroPose({...s,aimX:-.06});assert.equal(a.art.frameIndex,b.art.frameIndex);assert.equal(a.art.frameIndex,6);
});
