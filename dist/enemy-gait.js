// The old supporting atlases have four whole-body steps (two for animals).
// Distances, rather than elapsed time, register their contact to real AI travel.
const STEPS=Object.freeze({normal:7,sprinter:8,gas:7,tank:10,jealous:7,explosive:8,matriarch:12,orangutan:9,rival_goat:9,rival_rooster:8,ostrich:14,paparazzi:7,moose:16,disco_chicken:7});
const TWO_FRAMES=new Set(['ostrich','paparazzi','moose','disco_chicken']);
export function enemyGaitFrame(actor,gait,fallback=0){
 const step=STEPS[actor.type];
 if(!step)return fallback;if(!gait?.moving)return 0;
 return Math.floor(gait.distance/step)%(TWO_FRAMES.has(actor.type)?2:4);
}
export function recordEnemyWalk(cache,actor,distance){
 if(!STEPS[actor.type])return;
 const gait=cache.get(actor)||{distance:0,moving:false};
 if(distance>1e-7){gait.distance=(gait.distance+distance)%(STEPS[actor.type]*(TWO_FRAMES.has(actor.type)?2:4));gait.moving=true;}
 else gait.moving=false;
 cache.set(actor,gait);
}
