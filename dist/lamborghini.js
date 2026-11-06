import {updateCarBills} from './evolutions.js';
// Frozen rank data drives physics, choice copy and artwork. Trips retain their
// launch rank, so an upgrade never changes a car already crossing the screen.
export const CAR_LEVELS=Object.freeze([
 {name:'Coupé fantôme',description:'Un coupé jaune traverse la horde en ligne droite.',damage:72,speed:455,interval:8.9,halfWidth:36,halfHeight:18,knockback:0,returns:false,count:1},
 {name:'Pare-chocs VIP',description:'Le pare-chocs renforcé repousse les ennemis ordinaires au contact.',damage:94,speed:490,interval:7.8,halfWidth:39,halfHeight:18,knockback:22,returns:false,count:1},
 {name:'Version large',description:'Une carrosserie plus large frappe un couloir élargi et repousse au contact.',damage:116,speed:525,interval:6.7,halfWidth:43,halfHeight:25,knockback:26,returns:false,count:1},
 {name:'Retour du voiturier',description:'Après son passage, le char marque une pause puis revient dans la même voie. 82 dégâts par passage.',damage:82,speed:560,interval:6.5,halfWidth:43,halfHeight:25,knockback:26,returns:true,count:1},
 {name:'Convoi présidentiel',description:'Deux voitures décalées font l’aller-retour. 64 dégâts par voiture et par passage; deux voitures actives maximum.',damage:64,speed:595,interval:7.5,halfWidth:43,halfHeight:25,knockback:26,returns:true,count:2},
].map((level,index)=>Object.freeze({...level,rank:index+1})));
export const CAR_TRIP=Object.freeze({distance:960,halfDistance:480,turnDelay:.32,escortDelay:.3,maxActive:2});
export function carLevel(rank=1){return CAR_LEVELS[Math.max(0,Math.min(4,(Math.trunc(rank)||1)-1))];}
export function launchLamborghini(game){
 const s=game.s,level=carLevel(game.rank('car'));
 if(s.vehicles.filter(v=>v.kind==='car'&&v.life>0).length+level.count>CAR_TRIP.maxActive)return false;
 for(let i=0;i<level.count;i++){
  const delay=i*CAR_TRIP.escortDelay,originY=s.y+40+(i?8:0);
  s.vehicles.push({kind:'car',x:s.x-CAR_TRIP.halfDistance,y:originY,vx:level.speed,vy:0,damage:level.damage,hitIds:new Set(),
   life:CAR_TRIP.distance/level.speed*(level.returns?2:1)+(level.returns?CAR_TRIP.turnDelay:0)+delay,
   carRank:level.rank,carOriginX:s.x,carOriginY:originY,carPhase:'out',carTurnClock:0,carDelay:delay,
   ...(i===0&&s.evolutions.billionaire?{billSalvos:2,billClock:.8}:{})});
 }
 game.powerEffect('car','activate');game.sound('truth');return true;
}
function contacts(game,v,fromX,toX,level){
 const left=Math.min(fromX,toX)-level.halfWidth,right=Math.max(fromX,toX)+level.halfWidth;
 for(const e of game.combatTargets()){
  if(e.dead||v.hitIds.has(e.id)||e.x+e.r<=left||e.x-e.r>=right||Math.abs(e.y-v.y)>=e.r+level.halfHeight)continue;
  v.hitIds.add(e.id);game.hurt(e,level.damage);
  // Boss positions and locked attack lanes must not shift under their warnings.
  if(level.knockback&&!e.dead&&!['charles','pelican','travestia','matriarch'].includes(e.type)&&!(e.windup>0||e.charge>0||e.swipe>0||e.crow>0||e.gasPose>0))game.knockback(e,Math.sign(v.vx)*level.knockback,0,e.r*.6);
  game.burst(e.x,e.y,'#f2bd53',Math.min(4,Math.max(0,200-game.s.particles.length)));
 }
}
export function updateLamborghini(game,v,dt){
 const level=carLevel(v.carRank),epsilon=1e-9;let remaining=Math.max(0,dt);
 // At most: escort wait, three outbound bill segments, turn, return. No queue,
 // timers or extra vehicles are allocated when crossing an endpoint.
 for(let transitions=0;remaining>epsilon&&v.life>epsilon&&transitions<10;transitions++){
  if(v.carDelay>epsilon){const step=Math.min(remaining,v.carDelay);v.carDelay=Math.max(0,v.carDelay-step);v.life-=step;remaining-=step;continue;}
  if(v.carPhase==='turn'){
   const step=Math.min(remaining,v.carTurnClock);v.carTurnClock=Math.max(0,v.carTurnClock-step);v.life-=step;remaining-=step;
   if(v.carTurnClock<=epsilon){v.carTurnClock=0;v.carPhase='back';v.vx=-level.speed;v.hitIds.clear();}continue;
  }
  const end=v.carOriginX+(v.carPhase==='out'?CAR_TRIP.halfDistance:-CAR_TRIP.halfDistance);
  const untilEnd=Math.abs(end-v.x)/level.speed;
  const untilBill=v.billSalvos>0?Math.max(epsilon,v.billClock):Infinity;
  const step=Math.min(remaining,untilEnd,untilBill),before=v.x;
  v.x+=v.vx*step;contacts(game,v,before,v.x,level);updateCarBills(game,v,step);v.life=Math.max(0,v.life-step);remaining-=step;
  if(untilEnd-step<=epsilon){
   v.x=end;
   if(v.carPhase==='out'&&level.returns){v.carPhase='turn';v.carTurnClock=CAR_TRIP.turnDelay;v.vx=0;}
   else{v.life=0;break;}
  }
 }
 if(v.carDelay<epsilon)v.carDelay=0;
 if(v.life<epsilon)v.life=0;
}
export function validLamborghiniState(v,ownedRank){
 const fields=['carRank','carOriginX','carOriginY','carPhase','carTurnClock','carDelay'];
 if(!fields.some(key=>v[key]!==undefined))return true; // pre-feature vehicles
 if(v.kind!=='car'||!Number.isInteger(v.carRank)||v.carRank<1||v.carRank>5||v.carRank>ownedRank)return false;
 const level=carLevel(v.carRank),near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-6;
 if(!Number.isFinite(v.carOriginX)||Math.abs(v.carOriginX)>1e8||!Number.isFinite(v.carOriginY)||Math.abs(v.carOriginY)>1e8||!near(v.y,v.carOriginY)||v.vy!==0||v.damage!==level.damage)return false;
 if(!['out','turn','back'].includes(v.carPhase)||!Number.isFinite(v.carDelay)||v.carDelay<0||v.carDelay>CAR_TRIP.escortDelay||!Number.isFinite(v.carTurnClock)||v.carTurnClock<0||v.carTurnClock>CAR_TRIP.turnDelay)return false;
 if(Math.abs(v.x-v.carOriginX)>CAR_TRIP.halfDistance+1e-6)return false;
 if(v.carDelay>0&&(v.carRank!==5||v.carPhase!=='out'||!near(v.x,v.carOriginX-CAR_TRIP.halfDistance)))return false;
 if(!level.returns&&v.carPhase!=='out')return false;
 if(v.carPhase==='turn'){
  if(v.vx!==0||v.carTurnClock<=0||!near(v.x,v.carOriginX+CAR_TRIP.halfDistance)||v.carDelay!==0)return false;
 }else if(v.vx!==(v.carPhase==='out'?level.speed:-level.speed)||v.carTurnClock!==0)return false;
 let life=v.carDelay;
 if(v.carPhase==='out')life+=(v.carOriginX+CAR_TRIP.halfDistance-v.x)/level.speed+(level.returns?CAR_TRIP.turnDelay+CAR_TRIP.distance/level.speed:0);
 else if(v.carPhase==='turn')life+=v.carTurnClock+CAR_TRIP.distance/level.speed;
 else life+=(v.x-v.carOriginX+CAR_TRIP.halfDistance)/level.speed;
 return near(v.life,life)&&v.life>0&&new Set(v.hitIds).size===v.hitIds.length;
}
