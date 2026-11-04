// Locked, readable attacks: all hazards use the same dimensions as their warnings.
export const ANIMALS={ostrich:{hp:32,speed:58,r:18,warning:.8,duration:.7,recovery:1.1,reach:190,width:22,damage:11},paparazzi:{hp:48,speed:36,r:18,warning:1.1,duration:.22,recovery:2,reach:155,width:.5,damage:12},moose:{hp:105,speed:33,r:25,warning:1.2,duration:.75,recovery:1.5,reach:225,width:30,damage:20},disco_chicken:{hp:42,speed:49,r:17,warning:1,duration:1,recovery:1.5,reach:70,width:70,damage:13}};
export const animalLocked=e=>Boolean(ANIMALS[e.type]&&e.phase!=='chase');
export function interruptAnimal(e){if(ANIMALS[e.type]){e.phase='chase';e.animalTime=0;e.cooldown=Math.max(e.cooldown,1.5);}}
export function beginAnimalAttack(e,target){const d=Math.hypot(target.x-e.x,target.y-e.y);e.animalDX=d?(target.x-e.x)/d:1;e.animalDY=d?(target.y-e.y)/d:0;e.animalX=e.x;e.animalY=e.y;e.animalTravel=0;e.animalHit=false;e.phase='animal_warning';e.animalTime=ANIMALS[e.type].warning;}
function visible(world,e,p){const d=Math.hypot(p.x-e.x,p.y-e.y),n=Math.ceil(d/8);for(let i=1;i<=n;i++)if(world.collides(e.x+(p.x-e.x)*i/n,e.y+(p.y-e.y)*i/n,2))return false;return true;}
function segmentDistance(p,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy,t=q?Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/q)):0;return Math.hypot(p.x-ax-t*dx,p.y-ay-t*dy);}
export function updateAnimal(game,e,dt,suppressed){
 const a=ANIMALS[e.type],s=game.s;
 if(suppressed||e.charmed>0){e.phase='chase';e.animalTime=0;e.cooldown=Math.max(e.cooldown,1.5);return;}
 if(e.phase==='chase'){if(e.cooldown<=0&&Math.hypot(s.x-e.x,s.y-e.y)<(e.type==='disco_chicken'?115:220))beginAnimalAttack(e,s);return;}
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
