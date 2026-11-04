// Bounded, committed attacks. Geometry is shared by collision and drawing.
export const EGO_BEASTS={
 ego_peacock:{name:'Paon Paparazzi',hp:74,speed:38,r:22,warning:1.2,duration:.2,recovery:1.25,range:240,damage:14,color:'#71e1eb'},
 ego_toad:{name:'Crapaud Alpha',hp:125,speed:31,r:25,warning:1.05,duration:1,recovery:1.6,range:220,damage:13,color:'#f18db4'},
 ego_rat:{name:'Rat Huissier',hp:66,speed:43,r:18,warning:1.15,duration:1.08,recovery:1.2,range:225,damage:12,color:'#f4ce76'},
 ego_chameleon:{name:'Caméléon Discount',hp:82,speed:45,r:21,warning:.9,duration:.2,recovery:1.35,range:160,damage:20,color:'#c9a2ff'}
};
export const EGO_LIMITS={active:8,perType:2,routeSamples:96};
const SURFACES=['building','asphalt','grass'],JUMP_TIME=.8;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const unit=(x,y)=>{const d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:1,y:0};};
export function initEgoBeast(e){Object.assign(e,{egoTime:0,egoX:e.x,egoY:e.y,egoAimX:e.x,egoAimY:e.y,egoLandX:e.x,egoLandY:e.y,egoDX:1,egoDY:0,egoHits:0,egoBlocked:0,egoSurface:'asphalt',egoReveal:e.type==='ego_chameleon'?2:0,egoSample:0});return e;}
export const egoBeastLocked=e=>Boolean(EGO_BEASTS[e.type]&&e.phase!=='chase');
export function interruptEgoBeast(e){if(!EGO_BEASTS[e.type])return;e.phase='chase';e.egoTime=0;e.egoHits=0;e.egoBlocked=0;if(e.type==='ego_chameleon')e.egoReveal=Math.max(e.egoReveal||0,1);e.cooldown=Math.max(e.cooldown||0,1.5);}
export const egoDamageMultiplier=e=>e.type==='ego_toad'&&e.phase==='ego_recover'?1.5:1;
export function egoHeight(e){if(e.type!=='ego_toad'||e.phase!=='ego_active'||e.dead)return 0;const p=clamp((EGO_BEASTS.ego_toad.duration-e.egoTime)/JUMP_TIME,0,1);return 440*p*(1-p);}
export const egoCamoRatio=e=>e.type==='ego_chameleon'&&e.phase==='chase'&&e.egoReveal<=1e-8&&!e.dead&&!(e.charmed>0)?.82:0;
export function beginEgoAttack(e,target){
 const a=EGO_BEASTS[e.type];if(!a||e.dead||e.charmed>0||!Number.isFinite(target.x)||!Number.isFinite(target.y))return;
 const d=unit(target.x-e.x,target.y-e.y),reach=Math.min(a.range,Math.hypot(target.x-e.x,target.y-e.y));
 Object.assign(e,{phase:'ego_warning',egoTime:a.warning,egoX:e.x,egoY:e.y,egoAimX:target.x,egoAimY:target.y,egoLandX:e.x+d.x*reach,egoLandY:e.y+d.y*reach,egoDX:d.x,egoDY:d.y,egoHits:0,egoBlocked:0});
}
export function egoSegmentDistance(p,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy,t=q?clamp(((p.x-ax)*dx+(p.y-ay)*dy)/q,0,1):0;return Math.hypot(p.x-ax-t*dx,p.y-ay-t*dy);}
function worldPoint(e,forward,side=0){return {x:e.egoX+e.egoDX*forward-e.egoDY*side,y:e.egoY+e.egoDY*forward+e.egoDX*side};}
function segment(a,b,r,id,hot,kind){return {kind,ax:a.x,ay:a.y,bx:b.x,by:b.y,r,id,hot};}
export function egoAttackGeometry(e){
 const a=EGO_BEASTS[e.type];if(!a||e.dead||e.charmed>0||!['ego_warning','ego_active'].includes(e.phase))return [];
 const active=e.phase==='ego_active',age=active?clamp(a.duration-e.egoTime,0,a.duration):0;
 if(e.type==='ego_peacock'){
  const x=e.egoAimX,y=e.egoAimY,w=75,h=55,p=[{x:x-w,y:y-h},{x:x+w,y:y-h},{x:x+w,y:y+h},{x:x-w,y:y+h}];
  return p.map((v,i)=>segment(v,p[(i+1)%4],7,i,active,'frame'));
 }
 if(e.type==='ego_toad')return [{kind:'slam',x:e.egoLandX,y:e.egoLandY,r:42,id:0,hot:active&&age>=JUMP_TIME-1e-8&&!e.egoBlocked}];
 if(e.type==='ego_rat')return [-62,0,62].map((side,id)=>segment(worldPoint(e,28,side),worldPoint(e,205,side),11,id,active&&Math.floor((age+1e-7)/.36)===id&&age-id*.36<.24,'receipt'));
 return [segment(worldPoint(e,0),worldPoint(e,140),15,0,active,'tongue')];
}
function clearLine(world,a,b,r=2){const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/4));if(steps>EGO_LIMITS.routeSamples)return false;for(let i=0;i<=steps;i++)if(world.collides(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,r))return false;return true;}
function hit(game,e,condition,origin={x:e.egoX,y:e.egoY}){
 if(e.egoHits||!condition||!clearLine(game.world,origin,game.s))return;
 e.egoHits=1;game.damage(EGO_BEASTS[e.type].damage*(game.difficulty.damage||1),'touch',{actorType:e.type,actorId:e.id});
}
function recover(e){e.phase='ego_recover';e.egoTime=EGO_BEASTS[e.type].recovery;}
function jumpPosition(e,age){const p=clamp(age/JUMP_TIME,0,1);return {x:e.egoX+(e.egoLandX-e.egoX)*p,y:e.egoY+(e.egoLandY-e.egoY)*p};}
export function updateEgoBeast(game,e,dt,suppressed=false){
 if(!EGO_BEASTS[e.type])return;
 // Cancellation precedes the clock guard, including same-frame charm/Mode avion.
 if(e.dead||e.charmed>0||suppressed){interruptEgoBeast(e);return;}
 if(!Number.isFinite(dt)||dt<=0)return;
 let remaining=Math.min(dt,10);
 while(remaining>1e-9){
  const phaseLeft=e.egoTime>1e-9?e.egoTime:Infinity;
  const age=e.phase==='ego_active'?EGO_BEASTS[e.type].duration-e.egoTime:0;
  const landing=e.type==='ego_toad'&&e.phase==='ego_active'&&age<JUMP_TIME-1e-9?JUMP_TIME-age:Infinity;
  const surfaceLeft=e.type==='ego_chameleon'&&e.phase==='chase'&&e.egoSample>1e-8?e.egoSample:Infinity;
  const step=Math.min(remaining,1/120,phaseLeft,landing,surfaceLeft);
  stepEgoBeast(game,e,step);remaining-=step;
 }
}
function stepEgoBeast(game,e,dt){
 const a=EGO_BEASTS[e.type];
 if(e.phase==='chase'){
  if(e.type==='ego_chameleon'){
   e.egoReveal=Math.max(0,e.egoReveal-dt);
   if(e.egoSample<=1e-8){const surface=game.egoSurfaceAt?.(e.x,e.y);e.egoSurface=SURFACES.includes(surface)?surface:'asphalt';e.egoSample=.25;}
   e.egoSample=Math.max(0,e.egoSample-dt);
  }
  if(e.cooldown<=0&&Math.hypot(game.s.x-e.x,game.s.y-e.y)<=a.range&&(!game.egoFitsViewport||game.egoFitsViewport(e)))beginEgoAttack(e,game.s);return;}
 if(e.phase==='ego_recover'){e.egoTime=Math.max(0,e.egoTime-dt);if(e.egoTime<1e-8)interruptEgoBeast(e);return;}
 if(e.phase==='ego_warning'){
  // A knockback must not move an attack away from its announced origin.
  if(Math.hypot(e.x-e.egoX,e.y-e.egoY)>.01){interruptEgoBeast(e);return;}
  e.faceX=e.egoDX;e.faceY=e.egoDY;e.egoTime=Math.max(0,e.egoTime-dt);
  if(e.egoTime<1e-8){
   if(e.type==='ego_toad'&&!clearLine(game.world,e,{x:e.egoLandX,y:e.egoLandY},e.r*.64)){e.egoBlocked=1;recover(e);return;}
   e.egoTime=a.duration;e.phase='ego_active';
  }
  return;
 }
 if(e.phase!=='ego_active'){interruptEgoBeast(e);return;}
 const oldAge=a.duration-e.egoTime;
 if(e.type==='ego_toad'){
  const expected=jumpPosition(e,oldAge),next=jumpPosition(e,oldAge+dt);
  if(Math.hypot(e.x-expected.x,e.y-expected.y)>.01){interruptEgoBeast(e);return;}
  if(!clearLine(game.world,e,next,e.r*.64)){e.egoBlocked=1;recover(e);return;}
  e.x=next.x;e.y=next.y;
 }else if(Math.hypot(e.x-e.egoX,e.y-e.egoY)>.01){interruptEgoBeast(e);return;}
 e.egoTime=Math.max(0,e.egoTime-dt);
 for(const shape of egoAttackGeometry(e))if(shape.hot){
  if(shape.kind==='slam')hit(game,e,Math.hypot(game.s.x-shape.x,game.s.y-shape.y)<=shape.r+13,{x:shape.x,y:shape.y});
  else hit(game,e,egoSegmentDistance(game.s,shape.ax,shape.ay,shape.bx,shape.by)<=shape.r+13);
 }
 if(e.egoTime<1e-8)recover(e);
}
export function validateEgoBeast(e){
 const a=EGO_BEASTS[e.type];if(!a)return false;
 const limits={chase:0,ego_warning:a.warning,ego_active:a.duration,ego_recover:a.recovery};
 const finite=n=>typeof n==='number'&&Number.isFinite(n),position=n=>finite(n)&&Math.abs(n)<=1e8;
 if(!Object.hasOwn(limits,e.phase)||!finite(e.egoTime)||e.egoTime<0||e.egoTime>limits[e.phase]+1e-6)return false;
 if(e.phase!=='chase'&&e.egoTime===0)return false;
 if((e.phase==='ego_warning'||e.phase==='ego_active'&&e.type!=='ego_toad')&&(!position(e.x)||!position(e.y)||Math.hypot(e.x-e.egoX,e.y-e.egoY)>.01))return false;
 if(e.phase==='ego_active'&&e.egoBlocked)return false;
 if(!['egoX','egoY','egoAimX','egoAimY','egoLandX','egoLandY'].every(k=>position(e[k]))||!finite(e.egoDX)||!finite(e.egoDY)||Math.abs(Math.hypot(e.egoDX,e.egoDY)-1)>1e-6)return false;
 if(!finite(e.egoReveal)||e.egoReveal<0||e.egoReveal>2||!finite(e.egoSample)||e.egoSample<0||e.egoSample>.25)return false;
 if(![0,1].includes(e.egoHits)||![0,1].includes(e.egoBlocked)||!SURFACES.includes(e.egoSurface))return false;
 if(Math.hypot(e.egoLandX-e.egoX,e.egoLandY-e.egoY)>a.range+1e-5)return false;
 if(e.type==='ego_toad'&&e.phase==='ego_active'){const p=jumpPosition(e,a.duration-e.egoTime);if(!position(e.x)||!position(e.y)||Math.hypot(e.x-p.x,e.y-p.y)>.01)return false;}
 return true;
}
