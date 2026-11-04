import {propForegroundBounds} from './prop-geometry.js';
// Locked, readable attacks: all hazards use the same dimensions as their warnings.
export const ANIMALS={ostrich:{hp:32,speed:58,r:18,warning:.8,duration:.7,recovery:1.1,reach:190,width:22,damage:11},paparazzi:{hp:48,speed:36,r:18,warning:1.1,duration:.22,recovery:2,reach:155,width:.5,damage:12},moose:{hp:105,speed:33,r:25,warning:1.2,duration:.75,recovery:1.5,reach:225,width:30,damage:20},disco_chicken:{hp:42,speed:49,r:17,warning:1,duration:1,recovery:1.5,reach:70,width:70,damage:13}};
// These are the existing atlas draw cells, shared with ActorArt without resizing.
export const ANIMAL_FRAMES=Object.freeze(Object.fromEntries(Object.keys(ANIMALS).map(type=>{
 const size=type==='moose'?104:type==='ostrich'?98:80;
 return [type,Object.freeze({size,left:-size/2,top:-size*.94,anchorY:10})];
})));
export function animalFitsViewport(game,e){
 const f=ANIMAL_FRAMES[e.type],v=game.viewport,dx=e.x-game.s.x,dy=e.y-game.s.y;
 // One pixel covers the renderer's rounded camera and actor translations.
 return Math.abs(dx)+f.size/2+1<=v.width/2&&dy+f.anchorY+f.top-1>=-v.height*.48&&dy+f.anchorY+f.top+f.size+1<=v.height*.52;
}
export function findAnimalEntry(game,type,preferred,introduction=false){
 const s=game.s,v=game.viewport,r=ANIMALS[type].r;
 const moving=introduction&&s.walkMoving&&Math.hypot(s.travelX,s.travelY)>.08;
 const angle=moving?Math.atan2(s.travelY,s.travelX):Math.atan2(preferred.y-s.y,preferred.x-s.x);
 const frame=ANIMAL_FRAMES[type];
 // Only the first four encounters start visibly in the periphery. A 24px inset
 // survives ordinary camera movement between frames; 120px leaves ample room
 // beyond contact radii, including the smallest supported 240x320 viewport.
 const w=introduction?v.width/2-frame.size/2-24:v.width/2+r+24;
 const top=introduction?v.height*.48+frame.anchorY+frame.top-24:v.height*.48+r+24;
 const bottom=introduction?v.height*.52-frame.anchorY-frame.top-frame.size-24:v.height*.52+r+24;
 // The first tour should not introduce an animal behind a roof or canopy. Read
 // static cover once per attempt; subsequent random arrivals keep normal rules.
 const covers=introduction?game.world.getVisible(s.x,s.y,v.width+256,v.height+256).filter(p=>!game.world.destroyed.has(p.id)).map(propForegroundBounds).filter(Boolean):[];
 const crowd=introduction?s.enemies.filter(e=>!e.dead).map(e=>({x:e.x,y:e.y,half:Math.max(48,e.r*2),height:Math.max(100,e.r*5)})):[];
 if(introduction){
  if(s.companion&&s.girl.down<=0)crowd.push({x:s.girl.x,y:s.girl.y,half:48,height:100});
  for(const car of s.vehicles)crowd.push({x:car.x,y:car.y,half:80,height:100});
 }
 // Keep the first sampled direction when it works. Search a bounded fan instead
 // of pushing a blocked animal farther behind the same building.
 // Try the outer periphery first, then at most three inner rings when HUD
 // panels cover it. The 120px separation remains mandatory on every ring.
 const rings=introduction?[1,.82,.64,.46]:[1];
 for(const ring of rings)for(let i=0;i<32;i++){
  const offset=i===0?0:(i%2?1:-1)*Math.ceil(i/2)*Math.PI/16;
  const dx=Math.cos(angle+offset),dy=Math.sin(angle+offset);
  const distance=ring*Math.min(w/Math.max(1e-9,Math.abs(dx)),(dy<0?top:bottom)/Math.max(1e-9,Math.abs(dy)));
  if(introduction&&distance<120)continue;
  const x=s.x+dx*distance,y=s.y+dy*distance,steps=Math.ceil(distance/8);
  if(introduction){
   const left=v.width/2+x-s.x-frame.size/2,top=v.height*.48+y-s.y+frame.anchorY+frame.top;
   if((v.occlusions||[]).some(b=>left+frame.size>b.x-6&&left<b.x+b.width+6&&top+frame.size>b.y-6&&top<b.y+b.height+6))continue;
  }
  if(introduction&&crowd.some(e=>Math.abs(e.x-x)<e.half+frame.size/2&&e.y+24>y+frame.anchorY+frame.top&&e.y-e.height<y+frame.anchorY+frame.top+frame.size))continue;
  for(let step=0;step<=steps;step++){
   const remaining=distance*(1-step/steps),p={type,x:s.x+dx*remaining,y:s.y+dy*remaining};
   // Samples are at most 8px apart; the extra 4px conservatively covers the
   // continuous swept chase footprint between them, including thin obstacles.
   if(game.world.collides(p.x,p.y,r*.64+4))break;
   if(animalFitsViewport(game,p)){
    if(covers.some(b=>b.foot>p.y+frame.anchorY&&p.x+frame.size/2>b.left&&p.x-frame.size/2<b.right&&p.y+frame.anchorY+frame.top+frame.size>b.top&&p.y+frame.anchorY+frame.top<b.foot))break;
    if(remaining<=150)return {x,y};
   }
  }
 }
 return null;
}
export const animalLocked=e=>Boolean(ANIMALS[e.type]&&e.phase!=='chase');
export function interruptAnimal(e){if(ANIMALS[e.type]){e.phase='chase';e.animalTime=0;e.cooldown=Math.max(e.cooldown,1.5);}}
export function beginAnimalAttack(e,target){const d=Math.hypot(target.x-e.x,target.y-e.y);e.animalDX=d?(target.x-e.x)/d:1;e.animalDY=d?(target.y-e.y)/d:0;e.animalX=e.x;e.animalY=e.y;e.animalTravel=0;e.animalHit=false;e.phase='animal_warning';e.animalTime=ANIMALS[e.type].warning;}
function visible(world,e,p){const d=Math.hypot(p.x-e.x,p.y-e.y),n=Math.ceil(d/8);for(let i=1;i<=n;i++)if(world.collides(e.x+(p.x-e.x)*i/n,e.y+(p.y-e.y)*i/n,2))return false;return true;}
function segmentDistance(p,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy,t=q?Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/q)):0;return Math.hypot(p.x-ax-t*dx,p.y-ay-t*dy);}
export function updateAnimal(game,e,dt,suppressed){
 const a=ANIMALS[e.type],s=game.s;
 if(suppressed||e.charmed>0){e.phase='chase';e.animalTime=0;e.cooldown=Math.max(e.cooldown,1.5);return;}
 if(e.phase==='chase'){if(e.cooldown<=0&&animalFitsViewport(game,e)&&Math.hypot(s.x-e.x,s.y-e.y)<(e.type==='disco_chicken'?115:220))beginAnimalAttack(e,s);return;}
 e.faceX=e.animalDX;e.faceY=e.animalDY;e.animalTime=Math.max(0,e.animalTime-dt);
 if(e.phase==='animal_warning'){if(e.animalTime===0){e.phase='animal_active';e.animalTime=a.duration;}return;}
 if(e.phase==='animal_recover'){if(!e.animalTime){e.phase='chase';e.cooldown=1.4;}return;}
 if(e.phase!=='animal_active')return;
 const ox=e.x,oy=e.y;
 if(e.type==='moose'||e.type==='ostrich'){
  const travel=Math.min(a.reach-e.animalTravel,a.reach/a.duration*dt),steps=Math.max(1,Math.ceil(travel/5));let moved=0;
  for(let i=1;i<=steps;i++){const n=travel/steps;if(game.world.collides(e.x+e.animalDX*n,e.y+e.animalDY*n,e.r*.64)){e.animalTime=0;break;}e.x+=e.animalDX*n;e.y+=e.animalDY*n;moved+=n;}e.animalTravel+=moved;
 }
 const dx=s.x-e.x,dy=s.y-e.y,d=Math.hypot(dx,dy),hit=e.type==='paparazzi'?d<=a.reach&&(dx*e.animalDX+dy*e.animalDY)/(d||1)>=Math.cos(a.width):e.type==='disco_chicken'?d<=a.reach:segmentDistance(s,ox,oy,e.x,e.y)<=a.width;
 if(!e.animalHit&&hit&&visible(game.world,e,s)){e.animalHit=true;game.damage(a.damage*(game.difficulty.damage||1),'touch',{actorType:e.type,actorId:e.id});}
 if(e.animalTime===0){e.phase='animal_recover';e.animalTime=a.recovery;}
}
export function drawAnimalWarning(ctx,e){
 const a=ANIMALS[e.type];if(!a||!['animal_warning','animal_active'].includes(e.phase))return;
 const warning=e.phase==='animal_warning',color=e.type==='paparazzi'?'#ffd96a':'#ff68bc';ctx.save();ctx.translate(e.animalX,e.animalY);ctx.rotate(Math.atan2(e.animalDY,e.animalDX));ctx.fillStyle=warning?'#ff68bc22':'#ff68bc55';ctx.strokeStyle=color;ctx.lineWidth=warning?2:3;ctx.setLineDash(warning?[7,5]:[]);ctx.beginPath();
 if(e.type==='paparazzi'){ctx.moveTo(0,0);ctx.arc(0,0,a.reach,-a.width,a.width);ctx.closePath();}
 else if(e.type==='disco_chicken')ctx.arc(0,0,a.reach,0,Math.PI*2);
 else ctx.rect(-a.width,-a.width,a.reach+a.width*2,a.width*2);
 ctx.fill();ctx.stroke();ctx.setLineDash([]);if(warning){ctx.fillStyle=color;ctx.font='bold 18px sans-serif';ctx.fillText('!',-4,-28);}ctx.restore();
}
