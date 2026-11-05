import {HERO_FRAMES} from './hero-frames.js';

// Whole native paintings stay undeformed. Only fourteen-view selection and mirroring
// change the body; projectiles begin at the exact painted muzzle.
export const HERO_GAIT_STEP=10;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const point=(x,y)=>({x,y});
function unit(x,y,fallback={x:1,y:0}){const n=Math.hypot(x,y);return n>1e-8?point(x/n,y/n):point(fallback.x,fallback.y);}
const candidates=Object.entries(HERO_FRAMES.views).flatMap(([id,view])=>{
  const direct={id,source:id,view,mirror:false,base:view.angle};
  return id==='N'||id==='S'?[direct]:[direct,{id:view.mirrorId||(id==='E'?'W':id==='SE'?'SW':'NW'),source:id,view,mirror:true,base:wrap(Math.PI-view.angle)}];
});
function running(s){return typeof s.walkMoving==='boolean'?s.walkMoving:Math.hypot(finite(s.moveX),finite(s.moveY))>.08;}
function backward(s,aim){return finite(s.moveX)*aim.x+finite(s.moveY)*aim.y<-.05;}
function stage(s,reverse=false){
  const stunt=s.stunt||{},active=stunt.active===true&&stunt.kind==='split',progress=active?clamp(finite(stunt.progress,finite(stunt.time)/(finite(stunt.duration,1.3)||1.3)),0,1):0;
  if(active){
    let sequence='split',index=4;
    if(progress<.24){if(progress<.08){sequence='run';index=0;}else if(progress<.16)index=2;else if(progress<.216)index=3;}
    else if(progress>.69){const exit=(progress-.69)/.31;if(exit<1/3)index=3;else if(exit<2/3)index=2;else{sequence='run';index=0;}}
    return {active,progress,sequence,index,amount:sequence==='run'?0:index===2?.4:index===3?.72:1,phase:progress<.24?'entry':progress>.69?'recovery':'split'};
  }
  if(!running(s))return {active:false,progress:0,sequence:'run',index:0,amount:0,phase:'none'};
  const phase=Number.isFinite(s.heroMotion?.phase)?Math.floor(s.heroMotion.phase):((Math.floor(Math.max(0,finite(s.walkDistance))/HERO_GAIT_STEP)%8)+8)%8;
  return {active:false,progress:0,sequence:'run',index:s.heroMotion?phase:reverse?(8-phase)%8:phase,amount:0,phase:'none'};
}
function frameFor(s,candidate){
  const selection=stage(s,backward(s,canonical(candidate)));
  return {...selection,frame:candidate.view[selection.sequence][selection.index]};
}
function canonical(candidate){return point(Math.cos(candidate.base),Math.sin(candidate.base));}
function local(mark,candidate){return point((mark[0]-HERO_FRAMES.anchor[0])*(candidate.mirror?-1:1),mark[1]-HERO_FRAMES.anchor[1]);}
function choose(aim,locked){
  const found=candidates.find(c=>c.id===locked);if(found)return found;
  let selected=candidates[0],best=Infinity;
  for(const candidate of candidates){const d=Math.abs(wrap(Math.atan2(aim.y,aim.x)-candidate.base));if(d<best){best=d;selected=candidate;}}
  return selected;
}

/** Pure full-body pose. No torso, limb or whole-image deformation is applied. */
export function computeHeroPose(s={}){
  const x=finite(s.x),y=finite(s.y),fallback=unit(finite(s.faceX,1),finite(s.faceY)),aim=unit(finite(s.aimX,fallback.x),finite(s.aimY,fallback.y),fallback);aim.angle=Math.atan2(aim.y,aim.x);
  const selected=choose(aim,s.aimArtView),base=canonical(selected),selection=frameFor(s,selected),ground=point(x,y+14);
  const transform={a:1,b:0,c:0,d:1};
  const mapped=mark=>{const p=local(mark,selected);return point(ground.x+transform.a*p.x+transform.c*p.y,ground.y+transform.b*p.x+transform.d*p.y);};
  const muzzle=mapped(selection.frame.muzzle),grips={main:mapped(selection.frame.rearHand),support:mapped(selection.frame.frontHand)},hip=mapped(selection.frame.hip),pivot=point(muzzle.x-aim.x*31,muzzle.y-aim.y*31),perp=point(-aim.y,aim.x);
  const onBarrel=(forward,under=0)=>point(pivot.x+aim.x*forward+perp.x*under,pivot.y+aim.y*forward+perp.y*under);
  const art={id:selected.id,view:selected.source,mirror:selected.mirror,frame:selection.frame,frameIndex:selection.index,sequence:selection.sequence,transform,anchor:[...HERO_FRAMES.anchor],ground,baseAim:base,residual:wrap(aim.angle-selected.base),scale:1,fallbackStage:selection.sequence};
  const axis=unit(finite(s.stunt?.faceX,1),finite(s.stunt?.faceY));
  return {x,y,aim,barrelAim:base,side:selected.mirror?-1:1,mirror:selected.mirror,back:Math.sin(selected.base)<-.1,movement:running(s)?Math.min(1,Math.hypot(finite(s.moveX),finite(s.moveY))):0,walkPhase:selection.index,bob:0,art,muzzle,grips,body:{hip},weapon:{pivot,angle:aim.angle,muzzle,grips,rear:onBarrel(-10),top:onBarrel(10,-3)},split:{active:selection.active,progress:selection.progress,amount:selection.amount,phase:selection.phase,axis}};
}

/** Stable chest bearing chooses the body; muzzle bob affects only the bullet ray. */
export function solveHeroAim(s={},target={}){
  const x=finite(s.x),y=finite(s.y),t=point(finite(target.x,x),finite(target.y,y)),bearing=unit(t.x-x,t.y-(y-40)),angle=Math.atan2(bearing.y,bearing.x);
  let selected=s.heroMotion?choose(bearing,s.aimArtView):choose(bearing,null);
  const previous=candidates.find(c=>c.id===s.aimArtView),cost=c=>Math.abs(wrap(angle-c.base));
  if(!s.heroMotion&&previous&&cost(previous)<=cost(selected)+.05)selected=previous;
  const selection=frameFor(s,selected),m=local(selection.frame.muzzle,selected),muzzle=point(x+m.x,y+14+m.y),aim=unit(t.x-muzzle.x,t.y-muzzle.y,canonical(selected));
  return {aimX:aim.x,aimY:aim.y,aimArtView:selected.id};
}


/** Simulation-owned presentation state. No input, target selection or damage lag. */
export function advanceHeroMotion(s,target,dt=0){
  const fallback=unit(finite(s.aimX,1),finite(s.aimY)),previous=candidates.find(c=>c.id===s.aimArtView);
  const distance=Math.max(0,finite(s.walkDistance)),old=s.heroMotion;
  const motion=old||{angle:previous?.base??Math.atan2(fallback.y,fallback.x),phase:(distance/HERO_GAIT_STEP)%8,distance,reverse:false};
  let desired=motion.angle;
  if(target)desired=Math.atan2(finite(target.y)-finite(s.y)+40,finite(target.x)-finite(s.x));
  else if(Math.hypot(finite(s.moveX),finite(s.moveY))>.08)desired=Math.atan2(s.moveY,s.moveX);
  const change=wrap(desired-motion.angle),step=Math.max(0,finite(dt))*16;
  // A zero-duration pose query resolves immediately; normal play uses short turns.
  motion.angle=wrap(motion.angle+(dt>0?clamp(change,-step,step):change));
  const direction=point(Math.cos(motion.angle),Math.sin(motion.angle));
  let selected=choose(direction,null);
  if(previous&&Math.abs(wrap(motion.angle-previous.base))<=Math.abs(wrap(motion.angle-selected.base))+.08)selected=previous;
  s.aimArtView=selected.id;
  const travel=Number.isFinite(s.travelX)&&Number.isFinite(s.travelY)&&Math.hypot(s.travelX,s.travelY)>.08?point(s.travelX,s.travelY):point(finite(s.moveX),finite(s.moveY));
  const dot=travel.x*Math.cos(selected.base)+travel.y*Math.sin(selected.base);
  if(dot<-.15)motion.reverse=true;else if(dot>.15)motion.reverse=false;
  if(old){
    const travelled=distance-motion.distance;
    if(travelled<0)motion.phase=(distance/HERO_GAIT_STEP)%8;
    else if(running(s))motion.phase=((motion.phase+travelled/HERO_GAIT_STEP*(motion.reverse?-1:1))%8+8)%8;
  }else if(motion.reverse)motion.phase=(8-motion.phase)%8;
  motion.distance=distance;s.heroMotion=motion;
  return selected.id;
}
