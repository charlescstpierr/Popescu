// Deterministic arena harness: actual AI, damage, weapons and projectile collision.
// No random ambient waves or terrain, and fixed loadouts; not a human playtest.
export const BOSS_BUILDS = [
  {name:'early-balanced',at:180,upg:{muscle:1,followers:1,chopper:1,ego:1,speed:1,validation:1}},
  {name:'mid-offense',at:600,upg:{muscle:3,followers:3,chopper:2,money:2,truth:1,ego:2,speed:2,validation:2}},
  {name:'late-offense',at:1080,upg:{muscle:5,followers:5,chopper:3,money:3,truth:2,car:2,ego:3,speed:2,validation:3}},
  {name:'late-companion',at:1080,upg:{muscle:4,followers:4,girlfriend:3,charisma:2,chopper:2,money:2,airplane:2,ego:3,speed:2,validation:3}},
];
export const EXTRA_BOSS_BUILDS = [
 {name:'early-companion',at:180,upg:{muscle:1,followers:1,girlfriend:2,charisma:1,ego:1}},
 {name:'mid-companion',at:600,upg:{muscle:2,followers:2,girlfriend:3,charisma:3,chopper:2,ego:2,speed:1,validation:2}},
 {name:'late-evolved',at:1080,upg:{muscle:5,followers:5,car:3,money:3,girlfriend:3,charisma:3,chopper:3,ego:3,speed:2,validation:3},evolutions:['billionaire','viralLove']},
 {name:'late-max-charm',at:1080,upg:{muscle:4,followers:4,girlfriend:5,charisma:5,chopper:3,money:3,ego:3,speed:2,validation:3},evolutions:['viralLove']},
];
export function bossFight(Game,{type='pelican',difficulty='normal',build=BOSS_BUILDS[0],maxTime=150,baselineHealth=false,distance=115,seed=914}={}){
 const game=new Game({seed,difficulty}),s=game.s;
 // The arena removes cover/pathfinding variance, not damage, attack warnings or adds.
 game.world.collides=()=>false;game.world.update=()=>{};game.world.chunk=()=>[];
 s.elapsed=build.at;s.x=-distance;s.y=0;game.nextEvent=1e6;
 for(const [id,rank]of Object.entries(build.upg))for(let i=0;i<rank;i++){
  s.mode='upgrade';s.options=[{id}];game.chooseUpgrade(id);
 }
 for(const id of build.evolutions||[]){s.mode='upgrade';s.options=[{id}];game.chooseUpgrade(id);}
 s.mode='playing';s.invulnerable=0;s.shield=s.stats.shieldMax;s.xpNeed=1e9;
 for(const key of Object.keys(game.timers))if(!['car','money','airplane','truth','chopper'].includes(key))game.timers[key]=1e6;
 const boss=game.spawnEnemy(type,0,0);
 // The first (insufficient) HP buff is frozen here for offense-only comparisons.
 // Compare separate engine checkouts to measure the changed charm behavior too.
 if(baselineHealth){const min=build.at/60,scale=1+Math.min(1.6,min*.065)+Math.max(0,min-20)*.035;boss.hp=boss.maxhp={matriarch:550,travestia:680,pelican:760}[type]*scale*(type==='matriarch'?1+min*.02:1)*((type==='matriarch'?1.35:1.6)+(2-(type==='matriarch'?1.35:1.6))*Math.max(0,Math.min(1,(min-3)/15)));}
 const startingHp=boss.maxhp,phases=new Set();let time=0,peak=0,charmSeconds=0;
 while(time<maxTime&&!boss.dead&&s.mode==='playing'){
  const dx=s.x-boss.x,dy=s.y-boss.y,d=Math.hypot(dx,dy)||1;
  // Orbit and correct range, rather than face-tanking or maintaining invulnerability.
  const radial=Math.max(-1,Math.min(1,(distance-d)/60));
  const input={x:-dy/d+dx/d*radial,y:dx/d+dy/d*radial};
  game.update(1/60,input);time+=1/60;if(boss.charmed>0)charmSeconds+=1/60;phases.add(boss.phase);peak=Math.max(peak,s.enemies.length);
 }
 return {type,difficulty,build:build.name,startingHp,time:+time.toFixed(3),defeated:boss.dead&&boss.rewarded===true,playerDied:s.mode==='gameover',playerHp:+s.hp.toFixed(3),bossRemaining:Math.max(0,+boss.hp.toFixed(3)),phases:[...phases],attackCycles:boss.peliAttackCount??boss.tailAttackCount??0,charmSeconds:+charmSeconds.toFixed(3),peakEnemies:peak};
}
