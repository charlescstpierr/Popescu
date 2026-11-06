// Story lull calibration: deterministic headless runs, no DOM.
// Usage: node scripts/simulate-story-lulls.mjs [seeds=20] [minutes=20]
// A small bot flees the centre of nearby enemies and, every 40 s, detours to
// the nearest unvisited street prop. Toma is healed below half health so a run
// lasts its full length; hits still count as recent damage for the lull check.
// Optional SIM_ROOT points at another dist/ copy, used only for calibration.
const root=process.env.SIM_ROOT?new URL(`file://${process.env.SIM_ROOT.replace(/\/?$/,'/')}`):new URL('../dist/',import.meta.url);
const {Game,CALM_N,CALM_R}=await import(new URL('engine.js',root));
const {STREET_SCENE_TYPES}=await import(new URL('content.js',root));
const {BOSS_TROPHIES}=await import(new URL('boss-trophies.js',root));

const SEEDS=Number(process.argv[2]||20),MINUTES=Number(process.argv[3]||20),DT=1/20;
const results=[];
for(let seed=1;seed<=SEEDS;seed++){
 let violations=0,lull=0,samples=0,target=null,targetUntil=0,nextDetour=40,lingerUntil=0;const visited=new Set();
 const g=new Game({seed,onEvent:(type,payload)=>{
  if(type!=='bark'||!payload?.sceneId)return;
  if(/^(street:|arrival:|first-horde)/.test(payload.sceneId)&&!g.isLull())violations++;
 }});
 g.setPausedEncountersEnabled?.(false);
 while(g.s.elapsed<MINUTES*60&&g.s.mode!=='gameover'){
  const s=g.s;
  if(s.mode==='upgrade'){g.chooseUpgrade(s.options[0].id);continue;}
  if(s.mode==='trophy'){const p=s.trophies.pending[0];g.chooseTrophy(BOSS_TROPHIES[p.bossType].choices[0]);continue;}
  if(s.mode==='dialogue'){g.finishDialogue(true);continue;}
  if(s.mode==='victory'){break;}
  if(s.hp<s.maxhp*.5)s.hp=s.maxhp;
  if(s.elapsed>=60&&s.elapsed<840){samples++;if(g.isLull())lull++;}
  // Movement: flee nearby enemies; otherwise visit a street prop now and then.
  let fx=0,fy=0,near=0;
  for(const e of s.enemies){if(e.dead)continue;const dx=s.x-e.x,dy=s.y-e.y,d=Math.hypot(dx,dy);if(d<260){fx+=dx/(d||1);fy+=dy/(d||1);near++;}}
  if(!target&&s.elapsed>=nextDetour){
   const props=g.world.getVisible(s.x,s.y,700,700).filter(p=>STREET_SCENE_TYPES.includes(p.type)&&!visited.has(p.id??`${p.type}:${p.x},${p.y}`));
   props.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
   if(props[0]){target=props[0];targetUntil=s.elapsed+15;}
   nextDetour=s.elapsed+40;
  }
  let mx=0,my=0;const flee=Math.hypot(fx,fy);
  if(target){
   const dx=target.x-s.x,dy=target.y-s.y,d=Math.hypot(dx,dy);
   if(d<30||s.elapsed>targetUntil){visited.add(target.id??`${target.type}:${target.x},${target.y}`);target=null;lingerUntil=d<30?s.elapsed+3:0;}
   else{mx=dx/d;my=dy/d;}
  }
  if(!target&&s.elapsed>=lingerUntil){if(near&&flee>0){mx=fx/flee;my=fy/flee;}else{const a=s.elapsed*.15;mx=Math.cos(a);my=Math.sin(a);}}
  else if(!target&&near>2&&flee>0){mx=fx/flee;my=fy/flee;}
  g.update(DT,{x:mx,y:my});
 }
 const seen=[...g.eventSeen];
 const completed=seen.filter(f=>f.startsWith('scene:street:')).length,cancelled=seen.filter(f=>f.startsWith('skip:street:')).length;
 results.push({seed,elapsed:Math.round(g.s.elapsed),lull:samples?lull/samples:0,completed,cancelled,violations,horde:seen.includes('scene:first-horde'),arrivals:seen.filter(f=>f.startsWith('scene:arrival:')).length,eventSeen:seen.length});
}
const sum=k=>results.reduce((n,r)=>n+r[k],0);
const started=sum('completed')+sum('cancelled');
const summary={calm:{CALM_N,CALM_R},seeds:SEEDS,minutes:MINUTES,
 lullFraction1to14:+(sum('lull')/results.length).toFixed(3),
 completedRate:started?+(sum('completed')/started).toFixed(3):null,
 completedPerRun:+(sum('completed')/results.length).toFixed(2),
 violations:sum('violations'),firstHordeRuns:results.filter(r=>r.horde).length,maxEventSeen:Math.max(...results.map(r=>r.eventSeen))};
const pass={noViolation:summary.violations===0,lull25:summary.lullFraction1to14>=.25,completed60:(summary.completedRate??0)>=.6,twoPerRun:summary.completedPerRun>=2};
console.log(JSON.stringify({summary,pass,results},null,1));
if(!Object.values(pass).every(Boolean))process.exitCode=2;
