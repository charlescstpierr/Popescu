import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {UPGRADES} from '../dist/content.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function choose(game,id){game.s.mode='upgrade';game.s.options=[UPGRADES.find(u=>u.id===id)];return game.chooseUpgrade(id);}

test('each approved power acquisition produces its own cue only after a valid choice',()=>{
 for(const power of ['car','girlfriend','airplane','muscle','truth']){
  const g=new Game({seed:42});assert.equal(g.chooseUpgrade(power),false);assert.deepEqual(g.powerEffects,[]);
  assert(choose(g,power));assert.equal(g.powerEffects.length,1);
  assert.equal(g.powerEffects[0].power,power);assert.equal(g.powerEffects[0].kind,'acquire');
  assert.equal(g.powerEffects[0].rank,1);assert.equal(g.powerEffects[0].start,0);
  assert(g.powerEffects[0].life<=1);assert.equal(g.chooseUpgrade(power),false);assert.equal(g.powerEffects.length,1);
 }
 const g=new Game({seed:42});choose(g,'money');assert.equal(g.powerEffects[0].power,'money','remaining power sheet is now approved');
});

test('truth impacts immediately and leaves one simultaneous burst, never a travelling damage ring',()=>{
 const g=new Game({seed:42});g.s.shotClock=99;g.s.upg.truth=1;g.recalculate();g.timers.truth=0;
 const near=g.spawnEnemy('tank',80,0),edge=g.spawnEnemy('tank',168,0),far=g.spawnEnemy('tank',350,0);
 for(const e of [near,edge,far])e.hp=e.maxhp=1000;
 g.weapons(0);assert.equal(near.hp,957);assert.equal(edge.hp,957);assert.equal(far.hp,1000);
 const effect=g.powerEffects.find(e=>e.power==='truth');assert(effect);assert.equal(effect.kind,'activate');assert.equal(effect.r,169);
 assert.equal(g.s.pulses.filter(p=>p.color==='#c9a8ff').length,0,'the old expanding truth ring is replaced');
 g.s.elapsed=.3;g.updateEffects(.3);assert.equal(near.hp,957,'visual decay never reapplies damage');
});

test('airplane activation remains defensive, suppresses attacks and clears gas without damage',()=>{
 const g=new Game({seed:42});g.s.shotClock=99;g.s.upg.airplane=1;g.recalculate();g.timers.airplane=0;
 const e=g.spawnEnemy('gas',80,0);e.hp=e.maxhp=1000;e.windup=1;
 g.s.clouds=[{x:0,y:0,r:30}];g.weapons(0);
 assert.equal(e.hp,1000);assert.equal(e.windup,0);assert.equal(e.phase,'suppressed');assert.equal(g.s.clouds.length,0);
 assert(g.s.airplane.active);assert.equal(g.powerEffects.find(e=>e.power==='airplane').r,455);
 assert.equal(g.s.pulses.filter(p=>p.color==='#8adce6').length,0);
});

test('car launch cue is synchronized to the real car lane and does not change its speed or damage',()=>{
 const g=new Game({seed:42});g.s.upg.car=1;g.timers.car=0;g.weapons(0);
 assert.equal(g.s.vehicles.length,1);assert.equal(g.s.vehicles[0].vx,455);assert.equal(g.s.vehicles[0].damage,72);
 const e=g.powerEffects.find(e=>e.power==='car');assert.equal(e.kind,'activate');assert.equal(e.y,g.s.y);assert.equal(g.s.vehicles[0].y,e.y+40);
});

test('companion collection coalesces hundreds of pickups to one local cue, without extra rewards',()=>{
 const g=new Game({seed:42,survivalDuration:1200});choose(g,'girlfriend');g.powerEffects.length=0;g.s.xpNeed=1e9;
 g.s.girl.x=-150;g.s.girl.y=0;
 for(let i=0;i<260;i++)g.s.drops.push({x:-150,y:0,kind:'xp',value:2,life:30});
 g.updateDrops(0);assert.equal(g.s.xp,520);assert.equal(g.s.drops.length,0);
 assert.equal(g.powerEffects.length,1);assert.equal(g.powerEffects[0].power,'girlfriend');assert.equal(g.powerEffects[0].kind,'collect');
 assert.equal(g.powerEffects[0].x,-150);
});

test('power cues freeze with all modal screens, expire in place, and do not replay after save/resume',()=>{
 const g=new Game({seed:42});choose(g,'muscle');const effects=g.powerEffects,saved=captureRun(g);
 for(const mode of ['paused','upgrade','dialogue','victory','gameover']){g.s.mode=mode;const before=JSON.stringify(g.powerEffects);g.update(.25);assert.equal(JSON.stringify(g.powerEffects),before);}
 assert.equal(saved.game.powerEffects,undefined);assert.deepEqual(restoreRun(saved).powerEffects,[]);
 g.s.elapsed=2;g.updateEffects(0);assert.equal(g.powerEffects,effects,'pruning reuses one array');assert.equal(effects.length,0);
});

test('rapid use bounds transient records even before the next simulation frame',()=>{
 const g=new Game({seed:42});g.s.upg.car=1;
 for(let i=0;i<300;i++){g.timers.car=0;g.weapons(0);}
 assert(g.powerEffects.length>0&&g.powerEffects.length<=16);
 assert.equal(g.s.particles.length,0,'power cues allocate no generic particles');
});
