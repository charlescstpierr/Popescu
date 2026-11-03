import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES} from '../dist/boss-director.js';
import {DIFFICULTIES} from '../dist/content.js';
import {BOSS_BUILDS,EXTRA_BOSS_BUILDS,bossFight} from '../tests/helpers/boss-combat.js';
// Supply the prior clean checkout to compare the actual previous charm behavior.
// Without it the script still validates all current encounters; it never labels
// health-only comparisons as the previous complete boss behavior.
const baseline=process.argv[2]?resolve(process.argv[2]):null;
const Before=baseline?(await import(pathToFileURL(resolve(baseline,'dist/engine.js')))).Game:null;
const builds=[...BOSS_BUILDS,...EXTRA_BOSS_BUILDS],comparisons=[];
for(const difficulty of Object.keys(DIFFICULTIES))for(const build of builds)for(const type of BOSS_TYPES)for(const seed of [17,914,8291]){
 const before=Before?bossFight(Before,{difficulty,build,type,seed,maxTime:120}):null;
 const after=bossFight(Game,{difficulty,build,type,seed,maxTime:90});
 assert.ok(after.defeated&&!after.playerDied,`${difficulty}/${build.name}/${type}/${seed}: ${JSON.stringify(after)}`);
 assert.ok(after.time<=70,'fixed progressed builds must not become a grind');
 if(build===BOSS_BUILDS[2])assert.ok(after.time>=20,'late offense must face sustained encounters');
 if(type==='travestia')assert.ok(after.phases.includes('tail_spin')&&after.phases.includes('tail_dash'),'both existing attack patterns must execute');
 if(type==='pelican')assert.ok(after.phases.includes('peli_tarot'),'the complete attack cycle must execute');
 comparisons.push({difficulty,build:build.name,type,seed,before,after,ratio:before?.defeated?+(after.time/before.time).toFixed(3):null});
}
const starters=BOSS_TYPES.map(type=>({type,
 before:Before?bossFight(Before,{type,build:{name:'starter',at:180,upg:{}},maxTime:130,distance:160}):null,
 after:bossFight(Game,{type,build:{name:'starter',at:180,upg:{}},maxTime:130,distance:160})
}));
for(const row of starters)assert.ok(row.after.defeated&&!row.after.playerDied);
console.log(JSON.stringify({
 status:'pass',baseline,method:'Deterministic open arena, 60 Hz actual engine AI/weapons/collisions and matriarch summons; fixed builds, three seeds, four difficulties and circling controller; no artificial invulnerability, ambient waves or terrain.',
 limits:'Not a human playtest, win-rate estimate or mobile performance claim. Before is null unless a separate baseline checkout was supplied. Some previous companion scenarios can reach the 120s limit without a defeat. Builds are fixed test scenarios, not measured average player progression.',
 builds,comparisons,starters
},null,2));
