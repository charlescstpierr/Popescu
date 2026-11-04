// A single major boss owns three short, bounded attacks. Simulation and drawing
// share these footprints; no tarot card enters the player's projectile list.
export const PELICAN={
 hug:{warning:1.25,duration:.65,recovery:1.1,speed:350,width:30,damage:22},
 zodiac:{warning:1.4,duration:1.25,recovery:1.1,radius:155,width:16,gap:.85,damage:18},
 tarot:{warning:1.1,duration:2.2,recovery:1.1,reach:230,width:11,spread:.24,damage:16},
 trigger:260,replyDelay:4.4,cooldown:1.8
};
export const PELICAN_BANTER=[
  [
    "Approche, Toma. Mononcle a sorti ses cartes juste pour toi.",
    "FUCKK ! Rentre tes cartes, j'ai pas pris rendez-vous !"
  ],
  [
    "Poissons ascendant Sagittaire... Ah, t'aimes ça qu'on parle de toi !",
    "YEAHHHHHH ! Continue ce bout-là !"
  ],
  [
    "Mon petit Poisson se sauve encore ? J't'ai même pas fait ton câlin !",
    "Ta yeule, pélican puant !"
  ],
  [
    "Viens passer la nuit chez mononcleee, il va gâter ton petit Poisson !",
    "FUCKK ! J'couche pas dans ton nid !"
  ],
  [
    "J'ai tiré la carte des amoureux. Regarde qui est dessus, Toma.",
    "Dents jaunes ! Va te brosser le bec !"
  ],
  [
    "Viens sous mon aile. Y'a de la place, j'ai tassé ma bedaine.",
    "Petit obèse ! Tu bloques toute la rue !"
  ],
  [
    "Tu peux courir, mon Poisson. J'ai ton ascendant pis toute la soirée.",
    "Va donc chier avec ton horoscope !"
  ]
];
// Old saves may still have one of these replies waiting to play.
export const PELICAN_BANTER_LEGACY_REPLIES=["FUCKK ! Ma carte du ciel, j’m’en câlisse !","YEAHHHHHH ! C’est mon criss de charisme, ça !","Ta yeule, pélican puant !","FUCKK ! Garde ton bec loin de mon Poisson !","Recule, dents jaunes ! J’te dois pas un câlin !","Petit obèse ! C’est toi qui caches une planète là-dedans !","YEAHHHH ! Mon ascendant te dit d’aller chier !"];
export const pelicanLocked=e=>e.type==='pelican'&&e.peliTime>0;
export function interruptPelican(e,phase='chase'){
 if(e.type!=='pelican')return;
 e.phase=phase;e.peliTime=0;e.peliReplyPending=false;e.peliReplyTime=0;e.cooldown=Math.max(e.cooldown,2.2);e.peliMoving=false;
}
function segmentDistance(p,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy,t=q?Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/q)):0;return Math.hypot(p.x-ax-t*dx,p.y-ay-t*dy);}
function visible(world,e,p){const dx=p.x-e.peliX,dy=p.y-e.peliY,distance=Math.hypot(dx,dy);if(distance>PELICAN.trigger+PELICAN.hug.width)return false;const n=Math.max(1,Math.ceil(distance/8));for(let i=1;i<=n;i++)if(world.collides(e.peliX+dx*i/n,e.peliY+dy*i/n,2))return false;return true;}
function hitTargets(game,e,damage,hits){
 const s=game.s,amount=damage*(game.difficulty.damage||1);
 if(!e.peliHitPlayer&&hits(s)&&visible(game.world,e,s)){e.peliHitPlayer=true;game.damage(amount,'pelican',{actorType:e.type,actorId:e.id});}
 if(s.companion&&s.girl.down<=0&&!e.peliHitGirl&&hits(s.girl)&&visible(game.world,e,s.girl)){e.peliHitGirl=true;s.girl.hp-=amount;game.burst(s.girl.x,s.girl.y,'#f4b0ef',4);}
}
export function pelicanCards(e,time=e.peliTime){
 if(e.phase!=='peli_tarot')return [];
 const a=PELICAN.tarot,progress=Math.max(0,Math.min(1,1-time/a.duration));
 const travel=a.reach*(progress<.5?progress*2:(1-progress)*2),aim=Math.atan2(e.peliDY,e.peliDX);
 return [-1,0,1].map((spread,i)=>{const angle=aim+spread*a.spread;return {x:e.peliX+Math.cos(angle)*travel,y:e.peliY+Math.sin(angle)*travel,angle:angle+(progress>.5?Math.PI:0),kind:i};});
}
export function pelicanRingRadius(time){const a=PELICAN.zodiac;return a.radius*Math.max(0,Math.min(1,1-time/a.duration));}
function beginAttack(game,e){
 const s=game.s,d=Math.hypot(s.x-e.x,s.y-e.y);
 e.peliDX=d?(s.x-e.x)/d:1;e.peliDY=d?(s.y-e.y)/d:0;e.peliX=e.x;e.peliY=e.y;e.peliTravel=0;e.peliHitPlayer=false;e.peliHitGirl=false;
 const kind=['hug','zodiac','tarot'][e.peliAttackCount%3];e.phase=`peli_${kind}_warning`;e.peliTime=PELICAN[kind].warning;
 if(s.elapsed>=e.peliTauntAt&&s.elapsed>=game.speechUntil&&!e.peliReplyPending){
  const index=e.peliBanterIndex%PELICAN_BANTER.length,pair=PELICAN_BANTER[index],modal=game.queueEncounterDialogue({id:'boss:pelican',actorId:e.id,actorType:'pelican',pair:index});if(!modal)game.bark('PÉLI ZODIAQUE',pair[0],true,{actorId:e.id});e.peliBanterIndex++;e.peliTauntAt=s.elapsed+24;e.peliReply=pair[1];e.peliReplyPending=!modal;e.peliReplyTime=modal?0:PELICAN.replyDelay;
  if(modal)return;
  game.speechUntil=Math.max(game.speechUntil,s.elapsed+PELICAN.replyDelay+4.3);
  for(const reply of [game.pendingStuntReply,game.pendingRivalReply])if(reply)reply.at=Math.max(reply.at,game.speechUntil+.2);
 }
}
export function updatePelican(game,e,dt,suppressed){
 if(e.charmed>0||suppressed){interruptPelican(e,suppressed?'suppressed':'charmed');return;}
 if(e.peliReplyPending){e.peliReplyTime=Math.max(0,e.peliReplyTime-dt);if(e.peliReplyTime===0){game.bark('TOMA',e.peliReply,true,{actorId:e.id});e.peliReplyPending=false;}}
 if(e.peliTime<=0){e.phase='chase';if(e.cooldown<=0&&Math.hypot(game.s.x-e.x,game.s.y-e.y)<PELICAN.trigger)beginAttack(game,e);return;}
 e.faceX=e.peliDX;e.faceY=e.peliDY;
 const previous=e.peliTime,step=Math.min(dt,previous);e.peliTime=Math.max(0,previous-dt);
 if(e.phase.endsWith('_warning')){if(e.peliTime===0){e.phase=e.phase.replace('_warning','');e.peliTime=PELICAN[e.phase.slice(5)].duration;}return;}
 if(e.phase==='peli_recover'){if(e.peliTime===0){e.phase='chase';e.cooldown=PELICAN.cooldown;e.peliAttackCount++;}return;}
 const kind=e.phase.slice(5),a=PELICAN[kind];if(!a){interruptPelican(e);return;}
 if(kind==='hug'){
  const ox=e.x,oy=e.y,travel=Math.min(a.speed*step,a.speed*a.duration-e.peliTravel),steps=Math.max(1,Math.ceil(travel/5));
  for(let i=0;i<steps;i++){const n=travel/steps;if(game.world.collides(e.x+e.peliDX*n,e.y+e.peliDY*n,e.r*.64)){e.peliTime=0;break;}e.x+=e.peliDX*n;e.y+=e.peliDY*n;e.peliTravel+=n;e.peliWalkDistance+=n;e.peliMoving=true;}
  hitTargets(game,e,a.damage,p=>segmentDistance(p,ox,oy,e.x,e.y)<=a.width);
 }else if(kind==='zodiac'){
  const from=pelicanRingRadius(previous),to=pelicanRingRadius(e.peliTime),aim=Math.atan2(e.peliDY,e.peliDX);
  hitTargets(game,e,a.damage,p=>{const dx=p.x-e.peliX,dy=p.y-e.peliY,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(angle-aim),Math.cos(angle-aim));return r>=Math.max(a.width,from-a.width/2)&&r<=to+a.width/2&&Math.abs(delta)>a.gap;});
 }else if(kind==='tarot'){
  const from=pelicanCards(e,previous),to=pelicanCards(e);
  hitTargets(game,e,a.damage,p=>to.some((card,i)=>segmentDistance(p,from[i].x,from[i].y,card.x,card.y)<=a.width));
 }
 if(e.peliTime===0){e.phase='peli_recover';e.peliTime=a.recovery;}
}
