import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES} from '../dist/boss-director.js';
import {DIFFICULTIES} from '../dist/content.js';
import {BOSS_BUILDS,bossFight} from '../tests/helpers/boss-combat.js';
const comparisons=[];
for(const difficulty of Object.keys(DIFFICULTIES))for(const build of BOSS_BUILDS)for(const type of BOSS_TYPES){
 const before=bossFight(Game,{difficulty,build,type,baselineHealth:true,maxTime:90});
 const after=bossFight(Game,{difficulty,build,type,maxTime:90});
 assert.ok(before.defeated&&after.defeated,`${difficulty}/${build.name}/${type} must end in a real defeat`);
 assert.equal(after.playerDied,false);assert.ok(after.time>before.time);
 comparisons.push({difficulty,build:build.name,type,before,after,ratio:+(after.time/before.time).toFixed(3)});
}
const starters=BOSS_TYPES.map(type=>({type,
 before:bossFight(Game,{type,build:{name:'starter',at:180,upg:{}},baselineHealth:true,maxTime:90,distance:160}),
 after:bossFight(Game,{type,build:{name:'starter',at:180,upg:{}},maxTime:90,distance:160})
}));
for(const row of starters)assert.ok(row.before.defeated&&row.after.defeated);
console.log(JSON.stringify({
 status:'pass',method:'Deterministic open arena, 60 Hz actual engine AI/weapons/collisions and matriarch summons; fixed builds and circling controller; no artificial invulnerability, ambient waves or terrain.',
 limits:'Not a human playtest, win-rate estimate or mobile performance claim. Companion charm already prevents targeting; those builds can take considerably longer. Builds are fixed test scenarios, not measured average player progression.',
 builds:BOSS_BUILDS,comparisons,starters
},null,2));
