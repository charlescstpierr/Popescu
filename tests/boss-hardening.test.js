import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES} from '../dist/boss-director.js';
import {DIFFICULTIES} from '../dist/content.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {BOSS_BUILDS,EXTRA_BOSS_BUILDS,bossFight} from './helpers/boss-combat.js';

function heart(game,enemy){
 // A real overlapping projectile; deterministic successful charm roll.
 game.random=()=>0;game.shoot(enemy.x,enemy.y,enemy,'heart',1,0);game.updateShots(1/60);
}
for(const type of BOSS_TYPES){
 test(`${type}: sustained late offense lasts through several attacks, not a six-second burst`,()=>{
  const result=bossFight(Game,{type,build:BOSS_BUILDS[2],maxTime:60});
  assert.ok(result.defeated&&!result.playerDied,JSON.stringify(result));
  assert.ok(result.time>=20&&result.time<=45,JSON.stringify(result));
 });
 test(`${type}: companion interruption is brief and cannot repeatedly cancel boss attacks`,()=>{
  const g=new Game(),e=g.spawnEnemy(type,100,0);g.s.upg.charisma=3;
  heart(g,e);assert.ok(e.charmed>0&&e.charmed<=1.2,'boss interruption lasts at most 1.2 seconds');
  const saved=captureRun(g),resumed=restoreRun(saved),copy=resumed.s.enemies[0];
  assert.deepEqual(captureRun(resumed),saved);
  resumed.world.collides=()=>false;resumed.updateEnemies(1.3);
  assert.equal(copy.charmed,0);const hp=copy.hp;
  heart(resumed,copy);assert.equal(copy.charmed,0,'hearts still damage but cannot interrupt during recovery');assert.equal(copy.hp,hp-1);
  resumed.updateEnemies(10);heart(resumed,copy);assert.ok(copy.charmed>0,'boss becomes interruptible again');
 });
 test(`${type}: old wounded saves without charm resistance resume without healing`,()=>{
  const g=new Game();g.s.elapsed=600;const e=g.spawnEnemy(type,100,0);
  e.maxhp=1000;e.hp=321;e.charmed=3;delete e.bossCharmResistance;
  const save=captureRun(g),resumed=restoreRun(save),copy=resumed.s.enemies[0];
  assert.deepEqual(captureRun(resumed),save);assert.equal(copy.hp,321);assert.equal(copy.maxhp,1000);assert.equal(copy.charmed,3);
 });
}
test('ordinary charm keeps its full duration and no boss resistance field',()=>{
 const g=new Game(),e=g.spawnEnemy('tank',100,0);g.s.upg.charisma=3;heart(g,e);
 assert.equal(e.charmed,5.2);assert.equal(e.bossCharmResistance,undefined);
});
test('boss charm recovery must be finite, bounded and exclusive to bosses in saves',()=>{
 for(const bad of [-1,13,'8']){const g=new Game(),e=g.spawnEnemy('pelican',100,0);e.bossCharmResistance=bad;assert.throws(()=>captureRun(g),/Invalid/);}
 const g=new Game(),e=g.spawnEnemy('tank',100,0);e.bossCharmResistance=4;assert.throws(()=>captureRun(g),/Invalid/);
});

test('boss resistance freezes during pause and survives repeated resumes without a second charm',()=>{
 let g=new Game(),e=g.spawnEnemy('pelican',100,0);heart(g,e);g.pause();const saved=captureRun(g);
 g.update(.25);assert.deepEqual(captureRun(g),saved);
 for(let i=0;i<3;i++){g=restoreRun(captureRun(g));assert.deepEqual(captureRun(g),saved);}
 g.resume();g.s.enemies[0].charmed=0;heart(g,g.s.enemies[0]);assert.equal(g.s.enemies[0].charmed,0);
});
test('victory still arrives at twenty minutes with a surviving strengthened boss',()=>{
 const g=new Game();g.s.elapsed=1199.99;g.world.collides=()=>false;g.world.update=()=>{};g.world.chunk=()=>[];
 const e=g.spawnEnemy('matriarch',600,0);g.update(1/60,{x:0,y:0});
 assert.equal(g.s.mode,'victory');assert.equal(e.dead,false);g.continueEndless();assert.equal(g.s.mode,'playing');assert.equal(g.s.endless,true);
});

for(const difficulty of Object.keys(DIFFICULTIES))for(const build of EXTRA_BOSS_BUILDS)for(const type of BOSS_TYPES){
 test(`${difficulty} ${build.name} ${type}: companion and evolved builds allow full attacks without becoming a grind`,()=>{
  const result=bossFight(Game,{type,difficulty,build,maxTime:75});
  assert.ok(result.defeated&&!result.playerDied,JSON.stringify(result));assert.ok(result.time<=70,JSON.stringify(result));
  if(type==='travestia')assert.ok(result.phases.includes('tail_spin')&&result.phases.includes('tail_dash'),JSON.stringify(result));
  if(type==='pelican')assert.ok(result.phases.includes('peli_tarot'),JSON.stringify(result));
 });
}
