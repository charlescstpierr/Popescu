// Explicit, one-time evolutions. Their prerequisite powers keep their own ranks.
export const EVOLUTIONS=[
 {id:'billionaire',name:'Lambo de milliardaire',desc:'Le char tire deux salves de 3 billets verts.',icon:'car',color:'#a9df6c',requires:['car','money'],requirement:'Lamborghini 3 + Selfie 3'},
 {id:'viralLove',name:'Amour viral',desc:'Un cœur rebondit sur 3 ennemis maximum.',icon:'girlfriend',color:'#ef70af',requires:['girlfriend','charisma'],requirement:'Blonde IA 3 + Charisme 3'},
];
export const REROLL_COSTS=[5,10];
export function evolutionReady(state,def){return !state.evolutions[def.id]&&def.requires.every(id=>(state.upg[id]||0)>=3);}
// Derived from one spendable balance plus an append-only spending counter.
// Spending must never reduce lifetime records or make their credit markers invalid.
export function totalEarnedCoins(state){return state.coins+state.coinsSpent;}
export function bounceHeart(game,shot,enemy){
 if(!shot.viral)return false;
 if(shot.hitIds.size>=3){shot.life=0;return true;}
 let target=null,best=260*260;
 for(const next of game.s.enemies){if(next.dead||next.charmed>0||shot.hitIds.has(next.id))continue;const d=(next.x-enemy.x)**2+(next.y-enemy.y)**2;if(d<best){best=d;target=next;}}
 if(!target){shot.life=0;return true;}
 shot.linkX=enemy.x;shot.linkY=enemy.y;
 const angle=Math.atan2(target.y-shot.y,target.x-shot.x);shot.vx=Math.cos(angle)*240;shot.vy=Math.sin(angle)*240;
 return true;
}
export function updateCarBills(game,car,dt){
 if(!(car.billSalvos>0)||car.life<=0)return;
 car.billClock-=dt;
 while(car.billSalvos>0&&car.billClock<=0){
  const target=game.nearest(car.x,car.y,440)||{x:car.x+car.vx,y:car.y+car.vy};
  for(let i=0;i<3;i++)game.shoot(car.x,car.y,target,'bill',16+game.rank('money')*9,310,(i-1)*.23);
  car.billSalvos--;car.billClock=car.billSalvos?car.billClock+.28:0;
 }
}
