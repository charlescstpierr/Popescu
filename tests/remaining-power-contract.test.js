import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {UPGRADES} from '../dist/content.js';
import {EVOLUTIONS,bounceHeart,updateCarBills} from '../dist/evolutions.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const ids=[...UPGRADES.map(u=>u.id),...EVOLUTIONS.map(u=>u.id),'recovery','payday','barrier'];
function select(g,id){g.s.mode='upgrade';g.s.options=[{id}];return g.chooseUpgrade(id);}
function cue(g,power,kind){return g.powerEffects.filter(e=>e.power===power&&e.kind===kind);}
function quiet(){const g=new Game({seed:42});for(const k of Object.keys(g.timers))g.timers[k]=1e6;g.nextEvent=1e6;g.s.shotClock=1e6;g.s.xpNeed=1e9;return g;}
test('all twenty real chooseUpgrade routes emit acquisition only on accepted choices',()=>{
 assert.equal(ids.length,20);
 for(const id of ids){const g=quiet();assert.equal(g.chooseUpgrade(id),false);assert.equal(g.powerEffects.length,0);for(const req of EVOLUTIONS.find(e=>e.id===id)?.requires||[])g.s.upg[req]=3;g.recalculate();g.powerEffects.length=0;assert(select(g,id),id);assert.equal(cue(g,id,'acquire').length,1,id);assert.equal(g.chooseUpgrade(id),false);assert.equal(cue(g,id,'acquire').length,1);}
 const g=quiet();assert.equal(select(g,'viralLove'),false);assert.deepEqual(g.powerEffects,[]);
});
test('money heals cue only real coin HP gain, not full health, XP, or unrelated healing',()=>{
 const g=quiet();g.s.upg.money=2;g.recalculate();const drop=kind=>{g.s.drops=[{x:g.s.x,y:g.s.y,kind,value:2,life:30}];g.updateDrops(0);};drop('coin');assert.equal(cue(g,'money','heal').length,0);g.s.hp=40;drop('coin');assert.equal(g.s.hp,41.5);assert.equal(cue(g,'money','heal').length,1);g.powerEffects.length=0;drop('xp');drop('heal');assert.equal(cue(g,'money','heal').length,0);
});
test('detox and validation cues require actual gains and stop at maximum',()=>{
 for(const [power,kind,key,max] of [['detox','heal','hp','maxhp'],['validation','recharge','shield','shieldMax']]){
  const g=quiet();g.s.upg[power]=1;g.recalculate();const maximum=max==='shieldMax'?g.s.stats[max]:g.s[max];g.s[key]=maximum;g.step(1/60,{x:0,y:0});assert.equal(cue(g,power,kind).length,0);g.s[key]=maximum-1;g.step(1/60,{x:0,y:0});assert(g.s[key]>maximum-1);assert.equal(cue(g,power,kind).length,1);g.powerEffects.length=0;g.s[key]=maximum;g.s.elapsed+=2;g.step(1/60,{x:0,y:0});assert.equal(cue(g,power,kind).length,0);
 }
 const g=quiet();g.s.upg.validation=1;g.recalculate();g.lastHit=g.s.elapsed;g.step(1/60,{x:0,y:0});assert.equal(g.s.shield,0);assert.equal(cue(g,'validation','recharge').length,0);
});
test('filter resistance follows effective gas damage, never immunity or ordinary hits',()=>{
 for(const mode of ['gas','invulnerable','airplane','contact']){const g=quiet();g.s.upg.filter=2;g.recalculate();g.s.invulnerable=mode==='invulnerable'?1:0;g.s.airplane.active=mode==='airplane';g.damage(10,mode==='contact'?'contact':'gas');assert.equal(cue(g,'filter','resist').length,mode==='gas'?1:0,mode);if(mode==='gas')assert.equal(g.s.hp,g.s.maxhp-6.8);}
});
test('chopper launch and collision cues track the real bike, not its mere presence',()=>{
 const g=quiet();g.s.upg.chopper=1;g.timers.chopper=0;g.weapons(0);assert.equal(g.s.vehicles.length,1);assert.equal(g.s.vehicles[0].kind,'bike');assert.equal(cue(g,'chopper','activate').length,1);assert.equal(cue(g,'chopper','impact').length,0);const v=g.s.vehicles[0],e=g.spawnEnemy('tank',v.x,v.y);e.hp=e.maxhp=1000;g.updateVehicles(0);assert.equal(e.hp,937);assert.equal(cue(g,'chopper','impact').length,1);g.powerEffects.length=0;g.updateVehicles(0);assert.equal(cue(g,'chopper','impact').length,0);
});
test('viral bounce cue only exists when a distinct next target is selected',()=>{
 for(const mode of ['next','alone','limit','ordinary']){const g=quiet(),e=g.spawnEnemy('tank',50,0);if(mode!=='alone')g.spawnEnemy('tank',100,0);const p={x:50,y:0,vx:240,vy:0,viral:mode!=='ordinary',hitIds:new Set(mode==='limit'?[e.id,90,91]:[e.id]),life:1};bounceHeart(g,p,e);assert.equal(cue(g,'viralLove','bounce').length,mode==='next'?1:0,mode);if(mode==='next'){const c=cue(g,'viralLove','bounce')[0];assert.equal(c.tx,100);assert.equal(c.ty,0);}}
});
test('billionaire volley cue fires at each real three-bill salvo and not on car acquisition',()=>{
 const g=quiet();g.s.upg.money=3;const car={x:0,y:0,vx:455,vy:0,life:2,billSalvos:2,billClock:.8};updateCarBills(g,car,.4);assert.equal(cue(g,'billionaire','volley').length,0);updateCarBills(g,car,.4);assert.equal(g.s.shots.length,3);assert.equal(cue(g,'billionaire','volley').length,1);g.powerEffects.length=0;updateCarBills(g,car,.28);assert.equal(g.s.shots.length,6);assert.equal(cue(g,'billionaire','volley').length,1);g.powerEffects.length=0;updateCarBills(g,car,2);assert.equal(cue(g,'billionaire','volley').length,0);
});
test('remaining effects freeze on modal screens, remain bounded, and never replay on restore',()=>{
 const g=quiet();for(const id of UPGRADES.map(u=>u.id))assert(select(g,id));for(const mode of ['paused','upgrade','dialogue','victory','gameover']){g.s.mode=mode;const before=JSON.stringify(g.powerEffects);g.update(.25);assert.equal(JSON.stringify(g.powerEffects),before);}g.s.mode='playing';assert.deepEqual(restoreRun(captureRun(g)).powerEffects,[]);for(let i=0;i<300;i++)g.powerEffect(ids[i%20],'acquire');assert(g.powerEffects.length<=16);assert.equal(g.s.particles.length,0);
});
test('one viral projectile produces real collision bounces but never a terminal phantom bounce',()=>{
 const g=quiet();g.s.evolutions.viralLove=true;for(let i=0;i<5;i++){const e=g.spawnEnemy('tank',50+i*70,0);e.hp=e.maxhp=1000;}g.shoot(0,0,g.s.enemies[0],'heart',37,240);let bounces=0;for(let i=0;i<300;i++){g.powerEffects.length=0;g.updateShots(.01);bounces+=cue(g,'viralLove','bounce').length;}assert.equal(g.s.enemies.filter(e=>e.hp<1000).length,3);assert.equal(bounces,2);assert.equal(g.s.shots.length,0);
});
test('followers acquisition points at real muzzle and attraction cues require actual moving drops',()=>{const g=quiet();select(g,'followers');const f=cue(g,'followers','acquire')[0];assert(Number.isFinite(f.tx)&&Number.isFinite(f.ty));g.s.upg.magnet=1;g.recalculate();g.s.drops=[{kind:'coin',value:1,x:60,y:0,life:30}];g.updateDrops(0);assert.equal(cue(g,'magnet','attract').length,0);g.updateDrops(.01);assert.equal(cue(g,'magnet','attract').length,1);});
test('charisma brake accents require real movement and stay bounded at three',()=>{const g=quiet();g.s.upg.charisma=1;for(let i=0;i<12;i++){const e=g.spawnEnemy('normal',100+i,20);e.attack=99;}g.updateEnemies(0);assert.equal(cue(g,'charisma','slow').length,0);g.updateEnemies(.01);assert(cue(g,'charisma','slow').length>0);assert(cue(g,'charisma','slow').length<=3);});
