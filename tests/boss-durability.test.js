import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES} from '../dist/boss-director.js';
import {DIFFICULTIES} from '../dist/content.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {BOSS_BUILDS,bossFight} from './helpers/boss-combat.js';

for(const difficulty of Object.keys(DIFFICULTIES))for(const build of BOSS_BUILDS.slice(0,3))for(const type of BOSS_TYPES){
 test(`${difficulty} ${build.name} ${type}: survives sustained fire substantially longer and remains beatable`,()=>{
  const before=bossFight(Game,{difficulty,build,type,baselineHealth:true});
  const after=bossFight(Game,{difficulty,build,type});
  assert.ok(before.defeated&&after.defeated,'actual weapon hits must defeat the boss, not despawn it');
  assert.equal(after.playerDied,false,'the circling player has no artificial invulnerability');
  assert.ok(after.time>=before.time*(build.at>=1080?3:build.at>=600?2:1.25),`${before.time}s -> ${after.time}s`);
  assert.ok(after.time<=before.time*4.7,`bounded increase: ${before.time}s -> ${after.time}s`);
  assert.ok(after.time<=45,'fixed early/mid/late offense builds must not become a grind');
 });
}
for(const type of BOSS_TYPES)test(`${type}: a control-heavy companion build can still finish across all difficulties`,()=>{
 for(const difficulty of Object.keys(DIFFICULTIES)){
  const result=bossFight(Game,{type,difficulty,build:BOSS_BUILDS[3],maxTime:90});
  assert.ok(result.defeated,`${difficulty}: ${JSON.stringify(result)}`);assert.equal(result.playerDied,false);
 }
});
for(const type of BOSS_TYPES)test(`${type}: the first boss is beatable with the starter gun alone`,()=>{
 const build={name:'starter',at:180,upg:{}};
 const before=bossFight(Game,{type,build,baselineHealth:true,maxTime:90,distance:160});
 const result=bossFight(Game,{type,build,maxTime:130,distance:160});
 assert.ok(result.defeated);assert.ok(result.time>=before.time*1.25,`${before.time}s -> ${result.time}s`);
 assert.ok(result.time<=(type==='matriarch'?125:75),`${result.time}s including the matriarch's summoned enemies`);
});
test('late-game bosses survive their first attack instead of dying during the warning',()=>{
 const travestia=bossFight(Game,{type:'travestia',build:BOSS_BUILDS[2]});
 const pelican=bossFight(Game,{type:'pelican',build:BOSS_BUILDS[2]});
 assert.ok(travestia.phases.includes('tail_recover'),'spin must finish before defeat');
 assert.ok(pelican.phases.includes('peli_zodiac_warning'),'Péli reaches the second pattern');
});
test('the additional boss health curve stops increasing in endless mode',()=>{
 for(const type of BOSS_TYPES){
  const make=time=>{const g=new Game({survivalDuration:1200});g.s.elapsed=time;return g.spawnEnemy(type,0,0);};
  const late=make(1080),endless=make(3600);
  // Existing endless health scaling remains, but the new durability factor is capped.
  const normalScale=(2.6+40*.035)/2.17;
  const originalRatio=normalScale*(type==='matriarch'?2.2/1.36:1);
  assert.ok(Math.abs(endless.maxhp/late.maxhp-originalRatio)<1e-9);
 }
});
test('ordinary enemies and rivals keep their health and weapon damage',()=>{
 const g=new Game({survivalDuration:1200});g.s.elapsed=600;
 for(const [type,hp]of Object.entries({normal:39.6,sprinter:28.05,gas:69.3,tank:217.8,orangutan:66,rival_rooster:247.5,rival_goat:363})){
  g.s.enemies=[];const e=g.spawnEnemy(type,0,0);assert.ok(Math.abs(e.hp-hp)<1e-9,type);
  g.hurt(e,18);assert.ok(Math.abs(e.hp-(hp-18))<1e-9,type);
 }
});
test('wounded bosses in existing v7 saves resume without healing or changing remaining health',()=>{
 for(const type of BOSS_TYPES){
  const g=new Game({survivalDuration:1200});g.s.elapsed=180;const e=g.spawnEnemy(type,100,0);
  // Existing pre-balance values deliberately do not use the new spawn maximum.
  const previousMax={matriarch:696.685,travestia:812.6,pelican:908.2}[type];
  e.maxhp=previousMax;e.hp=previousMax*.37;
  const snapshot=captureRun(g);assert.equal(snapshot.version,16);
  const resumed=restoreRun(snapshot);assert.deepEqual(captureRun(resumed),snapshot);
  assert.equal(resumed.s.enemies[0].hp,e.hp);assert.equal(resumed.s.enemies[0].maxhp,e.maxhp);
  resumed.hurt(resumed.s.enemies[0],e.hp+1);assert.equal(resumed.s.kills,1);
  resumed.s.enemies=[];const next=resumed.spawnEnemy(type,100,0);assert.ok(next.maxhp>=previousMax*1.34);
 }
});
test('new boss health is saved exactly and does not reroll through repeated resumes',()=>{
 for(const type of BOSS_TYPES){
  let g=new Game({survivalDuration:1200});g.s.elapsed=1080;const e=g.spawnEnemy(type,100,0);g.hurt(e,123);
  const snapshot=captureRun(g);
  for(let i=0;i<4;i++){g=restoreRun(captureRun(g));assert.deepEqual(captureRun(g),snapshot);}
  g.hurt(g.s.enemies[0],1e6);assert.equal(g.s.chests.length,1);assert.equal(g.s.drops.find(d=>d.kind==='xp').value,22);
 }
});
