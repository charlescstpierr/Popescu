// Whole paintings selected only by existing simulation timers. No saved visual state.
export const ENEMY_ATTACK_ART=Object.freeze({
  orangutan:Object.freeze({image:'orangutan_attack',cellWidth:160,anchorX:64,size:83}),
  rival_goat:Object.freeze({image:'rival_goat_attack',cellWidth:128,anchorX:60,size:88}),
  rival_rooster:Object.freeze({image:'rival_rooster_attack',cellWidth:128,anchorX:68,size:78}),
});
export function enemyAttackPose(e){
  const spec=ENEMY_ATTACK_ART[e.type];if(!spec)return null;
  let index;
  if(e.type==='orangutan'){
    if(e.windup>0)index=0;
    else if(e.swipe>0){const elapsed=.28-Math.min(.28,e.swipe);index=elapsed<.1?1:elapsed<.2?2:3;}
    else return null;
  }else if(e.type==='rival_goat'){
    if(e.windup>0)index=e.windup>.4?0:1;
    else if(e.charge>0)index=2+Math.floor(Math.max(0,.55-e.charge)*8)%2;
    else return null;
  }else{
    if(e.windup>0)index=e.windup>.57?0:e.windup>.28?1:2;
    else if(e.crow>0)index=e.crow>.12?3:4;
    else return null;
  }
  const fx=(e.type==='orangutan'?e.swipeDirX:e.chargeDirX)??e.faceX??1;
  const fy=(e.type==='orangutan'?e.swipeDirY:e.chargeDirY)??e.faceY??0;
  return {...spec,index,back:fy<-.45,flip:fx<-.1};
}
