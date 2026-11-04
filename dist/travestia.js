import {TAIL_DASH,beginTailDash,advanceTailDash} from './travestia-dash.js';
// Shared simulation/render constants keep warning and damage footprints identical.
export const TRAVESTIA_BANTER=[
  [
    "Vas-y Toma, je sais que tu veux toucher ma queue, touche-la Toma",
    "FUCKK !"
  ],
  [
    "Avoue, Toma, tu voudrais sentir ma queue dans ta main !",
    "Range ça, câlisse ! J'ai déjà les mains pleines !"
  ],
  [
    "Toma, arrête de regarder ma queue. Ou viens la voir de proche !",
    "Je check où j'marche, tabarnak !"
  ]
];
// Old saves may still have one of these replies waiting to play.
export const TRAVESTIA_BANTER_LEGACY_REPLIES=["FUCKK !","T’es pas ben, men !!"];
export const TRAVESTIA={radius:105,warning:1.2,spin:1.4,recovery:1.2,damage:24};
export function tailLocked(e){return e.type==='travestia'&&e.tailTime>0;}
export function updateTravestia(game,e,dt,suppressed){
  const s=game.s;
  if(e.charmed>0||suppressed){e.tailTime=0;e.tailReplyPending=false;e.phase=suppressed?'suppressed':'chase';e.cooldown=Math.max(e.cooldown,2);return;}
  if(e.tailTime>0){
    e.faceX=e.tailFaceX;e.faceY=0;e.tailTime=Math.max(0,e.tailTime-dt);
    if(e.phase==='tail_windup'&&e.tailReplyPending&&e.tailTime<=.7){game.bark('TOMA',e.tailReply,true,{actorId:e.id});e.tailReplyPending=false;}
    if(e.tailTime===0){
      if(e.phase==='tail_dash_windup'){e.phase='tail_dash';e.tailTime=TAIL_DASH.duration;}
      else if(e.phase==='tail_dash'){e.phase='tail_dash_recover';e.tailTime=TAIL_DASH.recovery;}
      else if(e.phase==='tail_windup'){e.phase='tail_spin';e.tailTime=TRAVESTIA.spin;e.tailHitPlayer=false;e.tailHitGirl=false;}
      else if(e.phase==='tail_spin'){e.phase='tail_recover';e.tailTime=TRAVESTIA.recovery;}
      else{e.phase='chase';e.cooldown=2.4;e.tailAttackCount=(e.tailAttackCount||0)+1;}
    }
  }else if(e.cooldown<=0&&Math.hypot(s.x-e.x,s.y-e.y)<150){if((e.tailAttackCount||0)%2===1){beginTailDash(e,s);return;}e.phase='tail_windup';e.tailTime=TRAVESTIA.warning;e.tailWarning=TRAVESTIA.warning;e.tailFaceX=e.faceX<0?-1:1;if(s.elapsed>=(e.tailTauntAt??-1)){const index=(e.tailBanterIndex||0)%TRAVESTIA_BANTER.length,exchange=TRAVESTIA_BANTER[index],modal=game.queueEncounterDialogue({id:'boss:travestia',actorId:e.id,actorType:'travestia',pair:index});if(!modal)game.bark('TRAVESTIA',exchange[0],true,{actorId:e.id});e.tailReply=exchange[1];e.tailBanterIndex=(e.tailBanterIndex||0)+1;e.tailTauntAt=s.elapsed+18;e.tailTime=4.2;e.tailWarning=4.2;e.tailReplyPending=!modal;if(modal)return;game.speechUntil=Math.max(game.speechUntil,s.elapsed+7.5);for(const pending of [game.pendingStuntReply,game.pendingRivalReply])if(pending)pending.at=Math.max(pending.at,game.speechUntil+.1);}}
  else e.phase='chase';
  if(e.phase==='tail_dash'){advanceTailDash(game,e,dt);return;}
  if(e.phase!=='tail_spin')return;
  if(!e.tailHitPlayer&&Math.hypot(s.x-e.x,s.y-e.y)<=TRAVESTIA.radius){e.tailHitPlayer=true;game.damage(TRAVESTIA.damage*(game.difficulty.damage||1),'tail',{actorType:e.type,actorId:e.id});}
  const girl=s.girl;
  if(s.companion&&girl.down<=0&&!e.tailHitGirl&&Math.hypot(girl.x-e.x,girl.y-e.y)<=TRAVESTIA.radius){e.tailHitGirl=true;girl.hp-=TRAVESTIA.damage*(game.difficulty.damage||1);}
}
export function travestiaFrame(e,time=0){
  if(e.phase==='tail_windup')return e.tailTime>.8?5:e.tailTime>.4?6:7;
  if(e.phase==='tail_spin')return 8+(Math.floor((TRAVESTIA.spin-e.tailTime)*16)%2);
  if(e.phase==='tail_recover')return e.tailTime>.6?10:4;
  if(e.hitFlash>0)return 11;
  return e.tailMoving?Math.floor((e.tailWalkDistance||0)/14)%4:4;
}
