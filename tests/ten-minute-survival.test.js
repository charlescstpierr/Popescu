import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES,BOSS_SCHEDULE,createBossDirector,scheduleNextBoss} from '../dist/boss-director.js';
import {SURVIVAL_SECONDS,LEGACY_SURVIVAL_SECONDS,survivalDuration,progressionTime,finaleAt,finaleBeats} from '../dist/run-rules.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {trophyChoices} from '../dist/boss-trophies.js';

function quiet(duration=600,seed=42){
 const events=[],g=new Game({survivalDuration:duration,seed,onEvent:(type,payload)=>events.push({type,payload})});
 for(const key of ['spawn','animal','ego','pack','horde','rival','chest','bark'])g.timers[key]=100000;
 g.nextEvent=100000;g.setBanterEnabled(false);return {g,events};
}
const bosses=g=>g.s.enemies.filter(e=>BOSS_TYPES.includes(e.type)&&!e.dead);
function cross(g,at){g.s.elapsed=at+.001;g.updateFinale(.002);}

test('new runs last ten minutes while the legacy duration remains explicit',()=>{
 assert.equal(SURVIVAL_SECONDS,600);assert.equal(LEGACY_SURVIVAL_SECONDS,1200);
 assert.equal(new Game().s.survivalDuration,600);
 assert.equal(new Game({survivalDuration:1200}).s.survivalDuration,1200);
 for(const duration of [0,599,601,1199,NaN,'600'])assert.throws(()=>new Game({survivalDuration:duration}),RangeError);
 assert.equal(survivalDuration({}),600);assert.equal(finaleAt({}),540);
 assert.deepEqual(finaleBeats({}),{warning:530,boss:540,rivalWarning:554,rival:560,hordeWarning:574,horde:580});
});

test('Charles enters once at the selected boundary and pauses the survival clock',()=>{
 for(const duration of [600,1200]){
  const {g,events}=quiet(duration);g.s.elapsed=duration-.02;g.update(.01);
  assert.equal(g.s.charles,null);g.update(.02);assert.equal(g.s.charles.phase,'intro');
  assert.equal(events.filter(e=>e.type==='epilogue-start').length,1);
  const elapsed=g.s.elapsed;g.update(.25);g.update(.25);
  assert.equal(g.s.elapsed,elapsed);assert.equal(events.filter(e=>e.type==='epilogue-start').length,1);
  g.leaveCharlesEpilogue();g.continueEndless();g.update(.25);
  assert.equal(g.s.endless,true);assert.ok(g.s.elapsed>elapsed);assert.equal(events.filter(e=>e.type==='epilogue-start').length,1);
 }
});

test('all six finale beats keep a full final minute and survive repeated restored updates',()=>{
 for(const duration of [600,1200]){
  let {g}=quiet(duration);const beats=finaleBeats(g.s),at=Object.values(beats);
  g.s.elapsed=beats.boss-.001;assert.equal(g.runPacing().finale,false);
  for(const time of at){
   cross(g,time);const snapshot=captureRun(g);g=restoreRun(snapshot);
   for(let i=0;i<3;i++)g.updateFinale(.002);
   assert.deepEqual(captureRun(g),snapshot);
   assert.ok(g.eventSeen.has(`finale:${time}`));
  }
  assert.equal(bosses(g).length,1);
  assert.equal(g.s.enemies.filter(e=>e.type.startsWith('rival_')).length,1);
  assert.ok(g.s.enemies.length>25);
  for(const elapsed of [beats.boss,beats.boss+25,duration-.001]){g.s.elapsed=elapsed;assert.equal(g.runPacing().finale,true);}
 }
});

test('the real final minute stays deterministic through repeated checkpoints and reaches Charles once',()=>{
 const events=[],g=new Game({seed:71,onEvent:type=>events.push(type)});
 g.s.elapsed=529.8;g.s.invulnerable=200;g.nextEvent=100000;
 let restored=restoreRun(captureRun(g));
 for(let i=0;i<1500&&!g.s.charles;i++){
  for(const run of [g,restored]){
   if(run.s.mode==='upgrade')run.chooseUpgrade(run.s.options[0].id);
   if(run.s.mode==='dialogue')run.finishDialogue();
   if(run.s.mode==='trophy')run.chooseTrophy(trophyChoices(run.s.trophies.pending[0].bossType)[0].id);
   run.update(.05,{x:Math.cos(i/50),y:Math.sin(i/50)});
  }
  if(i%100===0){assert.deepEqual(captureRun(restored),captureRun(g));restored=restoreRun(captureRun(restored));}
 }
 assert.equal(g.s.charles?.phase,'intro');assert.equal(events.filter(type=>type==='epilogue-start').length,1);
 assert.equal(events.filter(type=>type==='victory').length,0);assert.ok(g.eventSeen.has('finale:580'));
 assert.deepEqual(captureRun(restored),captureRun(g));assert.ok(g.s.enemies.length<=300);
});

test('a blocked final boss retries after restore without rerolling or duplicating the arrival',()=>{
 let {g}=quiet();for(let i=0;i<300;i++)g.spawnEnemy('normal',0,0);
 const selected=g.bossDirector.nextType,director=structuredClone(g.bossDirector);
 cross(g,540);assert.ok(g.eventSeen.has('finale:540:pending'));assert.deepEqual(g.bossDirector,director);
 g=restoreRun(captureRun(g));g.s.elapsed=541;g.updateFinale(.1);
 assert.deepEqual(g.bossDirector,director);assert.equal(bosses(g).length,0);
 g.s.enemies.pop();g.updateFinale(.1);
 assert.equal(bosses(g)[0].type,selected);assert.ok(g.eventSeen.has('finale:540'));assert.equal(g.eventSeen.has('finale:540:pending'),false);
 const snapshot=captureRun(g);g=restoreRun(snapshot);g.updateFinale(.1);assert.deepEqual(captureRun(g),snapshot);
});

test('boss cadence is bounded for each duration and still warns for five real seconds',()=>{
 assert.equal(BOSS_SCHEDULE.firstMin,150);assert.equal(BOSS_SCHEDULE.restMax,165);
 for(const duration of [600,1200])for(let seed=1;seed<=40;seed++){
  const first=duration===600?[90,120]:[150,210],rest=duration===600?[45,75]:[95,165];
  const director=createBossDirector(seed,0,[],duration);
  assert.ok(director.remaining>=first[0]&&director.remaining<=first[1]);
  for(let i=0;i<9;i++){scheduleNextBoss(director,false,duration);assert.ok(director.remaining>=rest[0]&&director.remaining<=rest[1]);}
  const {g,events}=quiet(duration,seed);g.bossDirector.remaining=5.01;
  g.updateBossArrivals(.02);assert.equal(g.bossDirector.remaining,5);assert.equal(bosses(g).length,0);
  g.updateBossArrivals(4.9);assert.equal(bosses(g).length,0);
  g.updateBossArrivals(.11);assert.equal(bosses(g).length,1);
  assert.equal(events.filter(e=>e.type==='bark'&&e.payload.text.includes('cinq secondes')).length,1);
  assert.ok(g.bossDirector.remaining>=rest[0]&&g.bossDirector.remaining<=rest[1]);
 }
});

test('enemy strength, unlocks and horde composition reach the legacy progression in half the time',()=>{
 for(const time of [0,60,180,420,600]){
  const a=quiet(600).g,b=quiet(1200).g;a.s.elapsed=time;b.s.elapsed=time*2;
  assert.equal(progressionTime(a.s),progressionTime(b.s));
  const one=a.spawnEnemy('normal',100,100),two=b.spawnEnemy('normal',100,100);
  assert.equal(one.hp,two.hp);assert.equal(one.speed,two.speed);
  a.s.enemies=[];b.s.enemies=[];a.spawnHorde();b.spawnHorde();assert.deepEqual(a.s.enemies,b.s.enemies);
 }
 for(const duration of [600,1200]){
  const g=quiet(duration).g;g.s.elapsed=duration===600?121:242;g.timers.spawn=0;g.random=()=>.6;g.spawnWave(.01);
  assert.equal(g.s.enemies[0].type,'explosive');
 }
 assert.equal(progressionTime({elapsed:630,survivalDuration:600}),1230);
 assert.equal(progressionTime({elapsed:1230,survivalDuration:1200}),1230);
});

test('XP gains scale once and retained upgrade XP is unchanged by resume or repeated drains',()=>{
 for(const duration of [600,1200]){
  let {g}=quiet(duration);g.gainXP(duration===600?13.5:27);
  assert.equal(g.s.level,2);assert.equal(g.s.xp,19);assert.equal(g.s.mode,'upgrade');
  g=restoreRun(captureRun(g));g.chooseUpgrade(g.s.options[0].id);
  assert.equal(g.s.level,3);assert.equal(g.s.xp,0);assert.equal(g.s.mode,'upgrade');
  g.chooseUpgrade(g.s.options[0].id);g.gainXP(0);g.gainXP(0);
  assert.equal(g.s.level,3);assert.equal(g.s.xp,0);assert.equal(g.s.mode,'playing');
 }
});

test('endless mode skips scheduled finale beats and keeps real-time growth after ten minutes',()=>{
 const {g}=quiet();g.s.endless=true;cross(g,540);cross(g,560);cross(g,580);
 assert.equal(g.eventSeen.size,0);assert.equal(g.s.enemies.length,0);assert.equal(g.runPacing().finale,false);
 g.s.elapsed=601;assert.equal(progressionTime(g.s),1201);g.s.elapsed=661;assert.equal(progressionTime(g.s),1261);
});
