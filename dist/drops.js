// Old crystals are folded into one physical pickup, never credited remotely.
export const DROP_CAP=260;
export const XP_LIFETIME=38;
const MAX_DISTANCE=1800;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function compactDrops(state,world){
 const kept=[];
 let packet=null;
 const absorb=drop=>{
  if(!packet)packet={...drop,kind:'xp',compact:true,life:XP_LIFETIME};
  else packet.value+=drop.value;
 };
 // Keep an existing packet's location stable when additional XP expires.
 for(const drop of state.drops)if(drop.kind==='xp'&&drop.compact===true)absorb(drop);
 for(const drop of state.drops){
  if(drop.kind==='xp'){
   if(drop.compact===true)continue;
   if(drop.life<=0||distance(drop,state)>=MAX_DISTANCE)absorb(drop);
   else kept.push(drop);
  }else if(drop.life>0&&distance(drop,state)<MAX_DISTANCE)kept.push(drop);
 }
 if(kept.length+(packet?1:0)>DROP_CAP){
  // A crowded field can become one crystal plus at most 259 other pickups.
  // No per-kill records or off-screen XP arrays accumulate behind this cap.
  for(let i=kept.length-1;i>=0;i--)if(kept[i].kind==='xp'){absorb(kept[i]);kept.splice(i,1);}
 }
 if(packet&&distance(packet,state)>=MAX_DISTANCE){
  const position=reachablePickupPosition(state,world,packet);
  if(position){packet.x=position.x;packet.y=position.y;}
 }
 const budget=DROP_CAP-(packet?1:0);
 if(kept.length>budget)kept.splice(0,kept.length-budget);
 if(packet)kept.push(packet);
 return kept;
}

function reachablePickupPosition(state,world,packet){
 if(!world)return null;
 const girl=state.companion&&state.girl.down<=0?state.girl:null;
 // Aim and companion position must never turn a bank behind the runner
 // into a reward directly ahead. Old saves have no trustworthy travel yet.
 const hasTravel=Math.hypot(state.travelX,state.travelY)>0;
 let dx=hasTravel?-state.travelX:packet.x-state.x,dy=hasTravel?-state.travelY:packet.y-state.y;
 if(!Math.hypot(dx,dy)){dx=0;dy=1;}
 const angle=Math.atan2(dy,dx),radius=Math.max(120,state.stats.magnet+48);
 // Check a player-width corridor, not just an empty endpoint: a crystal on
 // the other side of a warehouse would still be inaccessible. Search is
 // deterministic and bounded; keep the old packet if every route is blocked.
 // Search the trailing half-circle once actual movement is known. If only
 // forward routes are clear, preserve the old bank and retry on a later step.
 for(let i=0;i<(hasTravel?17:32);i++){
  const offset=i===0?0:(i%2?1:-1)*Math.ceil(i/2)*Math.PI/16;
  const x=state.x+Math.cos(angle+offset)*radius,y=state.y+Math.sin(angle+offset)*radius;
  if(girl&&distance({x,y},girl)<=state.stats.magnet+24)continue;
  let clear=true;
  const steps=Math.ceil(radius/6);
  for(let j=0;j<=steps;j++)if(world.collides(state.x+(x-state.x)*j/steps,state.y+(y-state.y)*j/steps,13)){clear=false;break;}
  if(clear)return {x,y};
 }
 return null;
}
