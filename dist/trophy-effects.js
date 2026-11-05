import {hasTrophy} from './boss-trophies.js';

const GORILLAS=new Set(['normal','sprinter','gas','tank','jealous','explosive']);
const ANCHORED=new Set(['pelican','travestia','matriarch','rival_rooster','rival_goat']);
const EPS=1e-9;
const alive=e=>!e.dead&&!(e.charmed>0);
const distance2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
const compareId=(a,b)=>a.id-b.id;
const feedback=(t,id,amount=0)=>{t.feedback={id,life:.55,amount};};
const remaining=(n,dt)=>Math.max(0,n-dt<EPS?0:n-dt);

// The rendered card is 24 along its locked travel axis and 36 across it.
// Sweeping that rectangle along the same axis is another rectangle; distance
// from the enemy's circle center gives exact collision, including rounded corners.
function cardIntersects(card,e,from,to){
 const x=e.x-card.originX,y=e.y-card.originY;
 const along=x*card.dx+y*card.dy,across=-x*card.dy+y*card.dx;
 const low=Math.min(from,to)-12,high=Math.max(from,to)+12;
 const gapX=Math.max(low-along,0,along-high),gapY=Math.max(0,Math.abs(across)-18);
 return gapX*gapX+gapY*gapY<=(e.r||0)**2+EPS;
}
const cardDistance=age=>220*(age<=.8?age/.8:(1.6-age)/.8);
function cardPass(game,card,start,end,back){
 const hits=back?card.hitBack:card.hitOut,known=new Set([...card.hitOut,...card.hitBack]);
 const from=cardDistance(start),to=cardDistance(end);
 const candidates=game.s.enemies.filter(e=>alive(e)&&!hits.includes(e.id)&&cardIntersects(card,e,from,to));
 // Hit order follows travel, not enemy-array order, including a large timestep.
 candidates.sort((a,b)=>((a.x-b.x)*card.dx+(a.y-b.y)*card.dy)*(back?-1:1)||compareId(a,b));
 for(const e of candidates){if(!known.has(e.id)&&known.size>=3)continue;known.add(e.id);hits.push(e.id);game.hurt(e,18);}
}
function updateCard(game,dt,canHit=true){
 const t=game.s.trophies,c=t.tarot;if(!c)return;
 const end=Math.min(1.6,c.age+dt);
 if(canHit&&c.age<.8)cardPass(game,c,c.age,Math.min(end,.8),false);
 if(canHit&&end>.8)cardPass(game,c,Math.max(c.age,.8),end,true);
 c.age=end;const d=cardDistance(end);c.x=c.originX+c.dx*d;c.y=c.originY+c.dy*d;
 if(end>=1.6-EPS)t.tarot=null;
}
function pointSegmentDistance2(x,y,dx,dy){
 const f=Math.max(0,Math.min(100,x*dx+y*dy));return (x-dx*f)**2+(y-dy*f)**2;
}
// Exact enemy-circle intersection with the fixed circular sector, not an ellipse.
function inSector(p,e){
 const wx=e.x-p.x,wy=e.y-p.y,x=wx*p.dx+wy*p.dy,y=-wx*p.dy+wy*p.dx;
 const d=Math.hypot(x,y),r=e.r||0;
 if(d<=r)return true;
 if(x>=d*.5-EPS&&d<=100+r)return true;
 const side=Math.sqrt(3)/2;
 return Math.min(pointSegmentDistance2(x,y,.5,side),pointSegmentDistance2(x,y,.5,-side))<=r*r+EPS;
}
function hitSector(game,p){
 // IDs are never reused. Retired actors can no longer be hit, so do not retain
 // their IDs while newly spawned actors enter this still-active sweep.
 const present=new Set(game.s.enemies.map(e=>e.id));p.hitIds=p.hitIds.filter(id=>present.has(id));
 for(const e of game.s.enemies){if(!alive(e)||p.hitIds.includes(e.id)||!inSector(p,e))continue;
  p.hitIds.push(e.id);game.hurt(e,20);
  if(!e.dead&&!ANCHORED.has(e.type)){
   const d=Math.hypot(e.x-p.x,e.y-p.y),dx=d?(e.x-p.x)/d:p.dx,dy=d?(e.y-p.y)/d:p.dy;
   // Small steps cannot tunnel over a thin wall during instantaneous knockback.
   for(let i=0;i<7;i++)game.move(e,dx*5,dy*5,e.r*.64);
  }
 }
}
export function updateTrophyEffects(game,dt,passiveOnly=false){
 const s=game.s,t=s.trophies;if(!t||s.mode!=='playing'||!Number.isFinite(dt)||dt<=0)return;
 for(const id of Object.keys(t.cooldowns))t.cooldowns[id]=remaining(t.cooldowns[id],dt);
 t.starLife=remaining(t.starLife,dt);
 if(t.feedback){t.feedback.life=remaining(t.feedback.life,dt);if(!t.feedback.life)t.feedback=null;}
 // Arrival is cinematic, not an opportunity to farm the frozen survivors.
 // Timed rewards still expire, but no new attack, hit or charm is issued.
 if(passiveOnly){updateCard(game,dt,false);if(t.panache){t.panache.life=remaining(t.panache.life,dt);if(!t.panache.life)t.panache=null;}return;}
 for(const e of s.enemies)if(e.trophyCharmLife>0)e.trophyCharmLife=Math.min(Math.max(0,e.charmed),remaining(e.trophyCharmLife,dt));
 if(hasTrophy(s,'tarot')&&!t.tarot&&t.cooldowns.tarot===0){
  const candidates=s.enemies.filter(e=>alive(e)&&distance2(e,s)<=220**2).sort((a,b)=>distance2(a,s)-distance2(b,s)||compareId(a,b));
  if(candidates.length){const e=candidates[0],length=Math.hypot(e.x-s.x,e.y-s.y);t.tarot={x:s.x,y:s.y,originX:s.x,originY:s.y,dx:length?(e.x-s.x)/length:1,dy:length?(e.y-s.y)/length:0,age:0,hitOut:[],hitBack:[]};t.cooldowns.tarot=8;}
 }
 updateCard(game,dt);
 if(hasTrophy(s,'panache')&&!t.panache&&t.cooldowns.panache===0){
  const length=Math.hypot(s.aimX,s.aimY)||1,p={x:s.x,y:s.y,dx:s.aimX/length,dy:s.aimY/length,life:.35,hitIds:[]};
  if(s.enemies.some(e=>alive(e)&&inSector(p,e))){t.panache=p;t.cooldowns.panache=10;}
 }
 if(t.panache){hitSector(game,t.panache);t.panache.life=remaining(t.panache.life,dt);if(!t.panache.life)t.panache=null;}
 if(hasTrophy(s,'fanclub')&&t.cooldowns.fanclub===0){
  const targets=s.enemies.filter(e=>alive(e)&&GORILLAS.has(e.type)&&distance2(e,s)<150**2).sort((a,b)=>distance2(a,s)-distance2(b,s)||compareId(a,b)).slice(0,2);
  if(targets.length){for(const e of targets){e.charmed=2.5;e.trophyCharmLife=2.5;e.windup=0;e.gasPose=0;e.swipe=0;e.charge=0;e.crow=0;e.phase='charmed';}t.cooldowns.fanclub=18;feedback(t,'fanclub',targets.length);}
 }
}

// Called only for an accepted hit, after difficulty/filter reductions and before
// ordinary shield. It deliberately grants no invulnerability of its own.
export function reduceTrophyDamage(game,value,source,context){
 const s=game.s,t=s.trophies;if(!t||value<=0)return value;
 if(hasTrophy(s,'badge')&&context?.kind==='ordinary-contact'&&GORILLAS.has(context.actorType)){
  const reduced=Math.max(1,value-2);feedback(t,'badge',Math.max(0,value-reduced));value=reduced;
 }
 if(hasTrophy(s,'ascendant')&&t.cooldowns.ascendant===0){const absorbed=Math.min(12,value);value-=absorbed;t.cooldowns.ascendant=12;feedback(t,'ascendant',absorbed);}
 return value;
}
// The engine invokes this only when ordinary shield or HP actually decreased.
export function notifyTrophyDamage(game){
 const s=game.s,t=s.trophies;if(!t||!hasTrophy(s,'star')||t.cooldowns.star>0)return;
 t.starLife=2;t.cooldowns.star=8;feedback(t,'star');
}
export function trophySpeedMultiplier(state){return hasTrophy(state,'star')&&state.trophies?.starLife>0?1.25:1;}
