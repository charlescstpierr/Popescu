// Reproducible full-engine arena comparisons, not a human playtest or device FPS test.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES} from '../dist/boss-director.js';
import {DIFFICULTIES} from '../dist/content.js';
import {BOSS_BUILDS,bossFight} from '../tests/helpers/boss-combat.js';

const output=resolve(process.argv[2]||fileURLToPath(new URL('../proof/trophies',import.meta.url)));
mkdirSync(output,{recursive:true});
const combinations={baseline:{},offensive:{pelican:'tarot',travestia:'panache',matriarch:'fanclub'},defensive:{pelican:'ascendant',travestia:'star',matriarch:'badge'}};
const round=n=>+n.toFixed(3);
let lastGame;
function instrumentedGame(combination){return class TrophyArenaGame extends Game{
 constructor(options){super(options);this.s.trophies.chosen={...combinations[combination]};for(const id of ['tarot','panache','fanclub'])if(Object.values(this.s.trophies.chosen).includes(id))this.s.trophies.cooldowns[id]={tarot:8,panache:10,fanclub:18}[id];this.recalculate();this.measurements={hpDamage:0,shieldDamage:0,bossDamage:0,ordinaryDamage:0,acceptedHits:0};lastGame=this;}
 damage(...args){const hp=this.s.hp,shield=this.s.shield;super.damage(...args);const lostHp=Math.max(0,hp-this.s.hp),lostShield=Math.max(0,shield-this.s.shield);this.measurements.hpDamage+=lostHp;this.measurements.shieldDamage+=lostShield;if(lostHp+lostShield>0)this.measurements.acceptedHits++;}
 hurt(e,value){const hp=e.hp;super.hurt(e,value);this.measurements[BOSS_TYPES.includes(e.type)?'bossDamage':'ordinaryDamage']+=Math.min(hp,Math.max(0,hp-e.hp));}
};}
function fight(combination,options){const result=bossFight(instrumentedGame(combination),{...options,maxTime:150,baselineHealth:false});return {...result,combination,ttk:result.defeated?result.time:null,playerMaxHp:lastGame.s.maxhp,playerShield:round(lastGame.s.shield),...Object.fromEntries(Object.entries(lastGame.measurements).map(([key,value])=>[key,round(value)]))};}
const results=[],comparisons=[],determinism=[];
for(const difficulty of Object.keys(DIFFICULTIES))for(const build of BOSS_BUILDS)for(const type of BOSS_TYPES){
 const options={difficulty,build,type,seed:914};const group={};
 for(const combination of Object.keys(combinations)){const result=fight(combination,options);results.push(result);group[combination]=result;assert.equal(result.startingHp,group.baseline.startingHp,'Trophies must not alter hardened boss HP');}
 for(const combination of ['offensive','defensive']){const base=group.baseline,row=group[combination];comparisons.push({difficulty,build:build.name,type,combination,baselineTtk:base.ttk,ttk:row.ttk,ttkChangePercent:base.ttk&&row.ttk?round((row.ttk/base.ttk-1)*100):null,hpDamageChange:round(row.hpDamage-base.hpDamage),shieldDamageChange:round(row.shieldDamage-base.shieldDamage),playerHpChange:round(row.playerHp-base.playerHp),baselinePlayerDied:base.playerDied,playerDied:row.playerDied,trivializationFlag:Boolean(row.defeated&&row.time<12&&base.time>=12)});}
 if(build===BOSS_BUILDS[0]){const replay=fight('offensive',options);assert.deepEqual(replay,group.offensive);determinism.push({difficulty,type,identical:true});}
 console.log(`fight ${difficulty} ${build.name} ${type}: ${Object.entries(group).map(([key,value])=>`${key} ${value.ttk??'unfinished'}s HP${value.playerHp}`).join(', ')}`);
}
const summary={runs:results.length,deterministicReplayChecks:determinism.length,defeats:results.filter(r=>r.defeated).length,playerDeaths:results.filter(r=>r.playerDied).length,trivializationFlags:comparisons.filter(r=>r.trivializationFlag),offensiveTtkChangePercent:comparisons.filter(r=>r.combination==='offensive'&&r.ttkChangePercent!==null).map(r=>r.ttkChangePercent),defensiveTtkChangePercent:comparisons.filter(r=>r.combination==='defensive'&&r.ttkChangePercent!==null).map(r=>r.ttkChangePercent)};
for(const key of ['offensiveTtkChangePercent','defensiveTtkChangePercent']){const values=summary[key];summary[key]={minimum:Math.min(...values),maximum:Math.max(...values),mean:round(values.reduce((a,b)=>a+b,0)/values.length)};}
writeFileSync(resolve(output,'balance.json'),JSON.stringify({method:{seed:914,timestep:1/60,maxFightSeconds:150,baselineHealth:false,combinations,builds:BOSS_BUILDS,arena:'Existing bossFight helper: actual AI, weapons, damage, warnings and adds; deterministic orbit controller, open terrain, ambient spawns disabled.',initialCooldowns:'Attack trophies start at their normal acquisition cooldown; defensive trophies ready.',trivializationFlag:'Heuristic: trophy win below 12 seconds when the same hardened baseline took at least 12 seconds. This is not a certified balance threshold.',limitations:'Identical input policy, not identical path: speed and charm alter combat naturally. Health damage is cumulative actual HP loss, shield damage tracked separately; end HP includes healing. No human/device playtest.'},summary,determinism,comparisons,results},null,2)+'\n');

function crowd(combination){
 const g=new Game({seed:42,difficulty:'nightmare'}),s=g.s;s.trophies.chosen={...combinations[combination]};s.elapsed=600;s.endless=true;s.hp=s.maxhp=1e8;s.xpNeed=1e9;s.upg={followers:5,money:5,girlfriend:3,car:3,chopper:3};g.recalculate();s.hp=s.maxhp=1e8;
 for(const key of Object.keys(g.timers))if(!['car','money','airplane','truth','chopper'].includes(key))g.timers[key]=99999;
 g.nextEvent=99999;g.eventSeen=new Set(['chapter:0','chapter:60','chapter:180','chapter:360','chapter:600']);
 const types=['normal','sprinter','gas','tank','jealous','orangutan'];
 for(let i=0;i<300;i++){const angle=i*2.399963,radius=80+Math.sqrt(i/300)*420,e=g.spawnEnemy(types[i%types.length],Math.cos(angle)*radius,Math.sin(angle)*radius);e.hp=e.maxhp=1e6;}
 const times=[];let minimumEnemies=300,maximumShots=0,maximumTarotDistinct=0,maximumPanacheIds=0;
 for(let i=0;i<1440;i++){const start=performance.now();g.update(1/60,{x:Math.cos(i/130),y:Math.sin(i/130)});times.push(performance.now()-start);minimumEnemies=Math.min(minimumEnemies,s.enemies.length);maximumShots=Math.max(maximumShots,s.shots.length);maximumTarotDistinct=Math.max(maximumTarotDistinct,s.trophies.tarot?new Set([...s.trophies.tarot.hitOut,...s.trophies.tarot.hitBack]).size:0);maximumPanacheIds=Math.max(maximumPanacheIds,s.trophies.panache?.hitIds.length||0);}
 assert.equal(s.mode,'playing');assert.equal(minimumEnemies,300);assert.ok(maximumTarotDistinct<=3);assert.ok(maximumPanacheIds<=300);
 times.sort((a,b)=>a-b);return {meanMs:round(times.reduce((a,b)=>a+b,0)/times.length),p50Ms:round(times[Math.floor(times.length*.5)]),p95Ms:round(times[Math.floor(times.length*.95)]),minimumEnemies,maximumShots,maximumTarotDistinct,maximumPanacheIds,hpDamage:round(s.maxhp-s.hp),digest:createHash('sha256').update(JSON.stringify(s,(_,value)=>value instanceof Set?[...value]:value)).digest('hex')};
}
// Warm every path before five interleaved repetitions to reduce ordering/JIT bias.
for(const combination of Object.keys(combinations))crowd(combination);
const performanceResults=Object.fromEntries(Object.keys(combinations).map(key=>[key,[]]));
for(let repeat=0;repeat<5;repeat++)for(const combination of Object.keys(combinations)){performanceResults[combination].push(crowd(combination));console.log(`crowd ${combination} repetition ${repeat+1}`);}
const medians={};for(const [key,runs] of Object.entries(performanceResults)){assert.equal(new Set(runs.map(r=>r.digest)).size,1,'Same seeded full-engine scenario must replay deterministically');const means=runs.map(r=>r.meanMs).sort((a,b)=>a-b);medians[key]=means[2];}
writeFileSync(resolve(output,'performance.json'),JSON.stringify({method:{node:process.version,seed:42,difficulty:'nightmare',framesPerRun:1440,simulationSecondsPerRun:24,actors:300,repetitions:5,warmupRuns:3,combinations,setup:'Full engine with real terrain, collision, weapons, actor AI and accepted damage; ambient spawning paused, durable enemies/player avoid deaths and level menus. Trophies start ready to exercise their active path.',limitations:'Headless Node CPU timings, not rendering/frame rate or mobile device performance. Variant trajectories differ because their actual gameplay effects are enabled.'},medianMeanMs:medians,overheadPercent:Object.fromEntries(['offensive','defensive'].map(key=>[key,round((medians[key]/medians.baseline-1)*100)])),runs:performanceResults},null,2)+'\n');
console.log(JSON.stringify({output,balance:summary,performanceMedianMeanMs:medians},null,2));
