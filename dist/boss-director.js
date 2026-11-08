// Encounter decisions have their own saved RNG, independent of combat and loot.
export const BOSS_TYPES=Object.freeze(['matriarch','travestia','pelican']);
export const BOSS_SCHEDULE=Object.freeze({firstMin:150,firstMax:210,restMin:95,restMax:165,warning:5,retry:1,finaleAt:1140});
const TEN_MINUTE_SCHEDULE=Object.freeze({firstMin:90,firstMax:120,restMin:45,restMax:75});
const scheduleFor=duration=>duration===600?TEN_MINUTE_SCHEDULE:BOSS_SCHEDULE;
export const isMajorBoss=type=>BOSS_TYPES.includes(type);
function random(d){d.rng=(Math.imul(d.rng,1664525)+1013904223)>>>0;return d.rng/4294967296;}
export function scheduleNextBoss(d,first=false,duration=1200){
 if(!d.bag.length){
  d.bag=[...BOSS_TYPES];
  for(let i=d.bag.length-1;i>0;i--){const j=Math.floor(random(d)*(i+1));[d.bag[i],d.bag[j]]=[d.bag[j],d.bag[i]];}
  // Keep every three encounters balanced without repeating at a bag boundary.
  if(d.bag[0]===d.lastType){const j=1+Math.floor(random(d)*(d.bag.length-1));[d.bag[0],d.bag[j]]=[d.bag[j],d.bag[0]];}
 }
 d.nextType=d.bag.shift();
 const schedule=scheduleFor(duration),min=first?schedule.firstMin:schedule.restMin,max=first?schedule.firstMax:schedule.restMax;
 d.remaining=min+random(d)*(max-min);d.warned=false;d.retryIn=0;
}
export function createBossDirector(seed,elapsed=0,enemies=[],duration=1200){
 // Mix similar seeds before using a small, fully serializable random stream.
 let rng=(seed^0xa511e9b3)>>>0;rng=Math.imul(rng^(rng>>>16),0x7feb352d)>>>0;rng=Math.imul(rng^(rng>>>15),0x846ca68b)>>>0;rng=(rng^(rng>>>16))>>>0;
 const active=enemies.filter(e=>isMajorBoss(e.type)&&!e.dead).sort((a,b)=>b.id-a.id);
 const d={rng,bag:[],nextType:null,remaining:0,warned:false,retryIn:0,lastType:active[0]?.type??null};
 const first=elapsed<scheduleFor(duration).firstMin&&!active.length;
 scheduleNextBoss(d,first,duration);if(first)d.remaining=Math.max(BOSS_SCHEDULE.warning,d.remaining-elapsed);
 return d;
}
