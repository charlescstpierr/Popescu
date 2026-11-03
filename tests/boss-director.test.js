import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES,BOSS_SCHEDULE} from '../dist/boss-director.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function quiet(seed=42){
 const events=[],g=new Game({seed,onEvent:(type,payload)=>events.push([type,payload])});
 for(const key in g.timers)if(key!=='animalIndex')g.timers[key]=100000;
 g.nextEvent=100000;return {g,events};
}
const bosses=g=>g.s.enemies.filter(e=>BOSS_TYPES.includes(e.type)&&!e.dead);
const warnings=events=>events.filter(([type,payload])=>type==='bark'&&payload.text.includes('cinq secondes'));
function arrive(g){const type=g.bossDirector.nextType;if(!g.bossDirector.warned)g.spawnWave(Math.max(.001,g.bossDirector.remaining-4.99));g.spawnWave(g.bossDirector.remaining+.001);assert.equal(bosses(g).length,1);assert.equal(bosses(g)[0].type,type);return bosses(g)[0];}

test('random boss schedule uses bounded delays and a fair non-repeating shuffle bag across seeds',()=>{
 assert.deepEqual([...BOSS_TYPES].sort(),['matriarch','pelican','travestia']);
 assert.deepEqual(BOSS_SCHEDULE,{firstMin:150,firstMax:210,restMin:95,restMax:165,warning:5,retry:1,finaleAt:1140});
 const firstDelays=new Set(),restDelays=new Set(),firstTypes=new Set();
 for(let seed=1;seed<=80;seed++){
  const {g}=quiet(seed),same=quiet(seed).g,sequence=[];g.s.endless=true;
  assert.deepEqual(g.bossDirector,same.bossDirector);
  assert.ok(g.bossDirector.remaining>=150&&g.bossDirector.remaining<=210);
  firstDelays.add(g.bossDirector.remaining);firstTypes.add(g.bossDirector.nextType);
  for(let i=0;i<12;i++){
   const e=arrive(g);sequence.push(e.type);
   const delay=g.bossDirector.remaining;assert.ok(delay>=95&&delay<=165);restDelays.add(delay);
   if(i)assert.notEqual(sequence[i],sequence[i-1]);
   g.s.enemies=[];
  }
  for(let i=0;i<12;i+=3)assert.deepEqual([...sequence.slice(i,i+3)].sort(),[...BOSS_TYPES].sort());
 }
 assert.equal(firstTypes.size,3);assert.ok(firstDelays.size>50);assert.ok(restDelays.size>100);
});

test('boss schedule randomness is isolated from ordinary gameplay random draws',()=>{
 const a=quiet(747).g,b=quiet(747).g;a.s.endless=b.s.endless=true;
 for(let i=0;i<9;i++){
  for(let n=0;n<37;n++)b.random();
  assert.deepEqual(a.bossDirector,b.bossDirector);
  assert.equal(arrive(a).type,arrive(b).type);
  assert.deepEqual(a.bossDirector,b.bossDirector);a.s.enemies=[];b.s.enemies=[];
 }
});

test('all major boss pairings are excluded even through direct spawning',()=>{
 for(const first of BOSS_TYPES){const {g}=quiet();const e=g.spawnEnemy(first,100,0);assert.ok(e);for(const second of BOSS_TYPES)assert.equal(g.spawnEnemy(second,200,0),null,`${first} blocks ${second}`);e.dead=true;assert.ok(g.spawnEnemy(BOSS_TYPES.find(t=>t!==first),200,0));}
});

test('the full next interval freezes until every living major boss has been defeated',()=>{
 for(const type of BOSS_TYPES){
  const {g,events}=quiet();g.s.endless=true;const e=g.spawnEnemy(type,800,0),before=clone(g.bossDirector);
  for(let i=0;i<4;i++)g.spawnWave(200);
  assert.deepEqual(g.bossDirector,before);assert.equal(bosses(g).length,1);assert.equal(warnings(events).length,0);
  e.dead=true;g.spawnWave(1);assert.equal(g.bossDirector.remaining,before.remaining-1);
 }
});

test('pause, upgrade, dialogue and terminal screens freeze the director',()=>{
 for(const mode of ['paused','upgrade','dialogue','victory','gameover']){
  const {g}=quiet();g.s.mode=mode;const before=clone(g.bossDirector),elapsed=g.s.elapsed;
  for(let i=0;i<10;i++)g.update(.25);
  assert.deepEqual(g.bossDirector,before);assert.equal(g.s.elapsed,elapsed);
 }
 const {g}=quiet();const before=g.bossDirector.remaining;g.update(.1);assert.ok(Math.abs(g.bossDirector.remaining-(before-.1))<1e-8);
});

test('each selected boss is warned once five seconds before its arrival',()=>{
 for(const type of BOSS_TYPES){
  const {g,events}=quiet();g.bossDirector.nextType=type;g.bossDirector.remaining=5.01;g.speechUntil=999;
  g.spawnWave(.02);assert.equal(bosses(g).length,0);assert.equal(warnings(events).length,1);assert.equal(g.bossDirector.warned,true);
  g.spawnWave(4.9);assert.equal(bosses(g).length,0);assert.equal(warnings(events).length,1);
  g.spawnWave(.1);assert.equal(bosses(g)[0].type,type);assert.equal(warnings(events).length,1);
 }
});

test('a visible full crowd delays the selected encounter without rerolling or repeating its warning',()=>{
 const {g,events}=quiet();g.s.endless=true;for(let i=0;i<300;i++)g.spawnEnemy('normal',0,0);
 const ids=g.s.enemies.map(e=>e.id);g.bossDirector.remaining=5.01;g.spawnWave(.02);
 const selected={rng:g.bossDirector.rng,bag:clone(g.bossDirector.bag),nextType:g.bossDirector.nextType,lastType:g.bossDirector.lastType};
 for(let i=0;i<12;i++)g.spawnWave(1);
 assert.deepEqual(g.s.enemies.map(e=>e.id),ids);assert.equal(warnings(events).length,1);
 for(const [key,value]of Object.entries(selected))assert.deepEqual(g.bossDirector[key],value);
 assert.equal(g.bossDirector.remaining,0);
 g.s.enemies.pop();g.spawnWave(1.01);assert.equal(g.s.enemies.length,300);assert.equal(bosses(g)[0].type,selected.nextType);
 assert.ok(g.bossDirector.remaining>=95&&g.bossDirector.remaining<=165);
});

test('offscreen ordinary capacity can be retired without removing a rival or visible foe',()=>{
 const {g}=quiet();const rival=g.spawnEnemy('rival_rooster',800,0),visible=g.spawnEnemy('normal',0,0);
 for(let i=2;i<300;i++)g.spawnEnemy('normal',800,0);
 g.bossDirector.remaining=0;g.bossDirector.warned=true;g.spawnWave(.01);
 assert.equal(g.s.enemies.length,300);assert.equal(bosses(g).length,1);assert.ok(g.s.enemies.includes(rival));assert.ok(g.s.enemies.includes(visible));
});

test('v6 saves preserve warnings, waiting capacity and subsequent random encounters exactly',()=>{
 const {g}=quiet(987);g.s.endless=true;for(let i=0;i<300;i++)g.spawnEnemy('normal',0,0);
 g.bossDirector.remaining=5.01;g.spawnWave(.02);g.spawnWave(5);
 const snapshot=captureRun(g);assert.equal(snapshot.version,8);assert.deepEqual(snapshot.game.bossDirector,g.bossDirector);
 const b=restoreRun(snapshot);assert.deepEqual(captureRun(b),snapshot);assert.notEqual(b.bossDirector,g.bossDirector);assert.notEqual(b.bossDirector.bag,g.bossDirector.bag);
 g.s.enemies.pop();b.s.enemies.pop();g.spawnWave(1.01);b.spawnWave(1.01);assert.deepEqual(captureRun(g),captureRun(b));
 for(let i=0;i<8;i++){g.s.enemies=[];b.s.enemies=[];arrive(g);arrive(b);assert.deepEqual(captureRun(g),captureRun(b));}
});

test('malformed director fields are rejected instead of silently rerolling v6 saves',()=>{
 const corruptions=[d=>d.rng='bad',d=>d.rng=.5,d=>d.nextType='normal',d=>d.remaining=-1,d=>d.remaining=Infinity,d=>d.warned=1,d=>d.retryIn=-1,d=>d.lastType='rival_goat',d=>d.bag=['pelican','pelican'],d=>d.bag=['normal'],d=>d.bag=Array(20).fill('pelican')];
 for(const corrupt of corruptions){const snapshot=captureRun(quiet().g);corrupt(snapshot.game.bossDirector);assert.throws(()=>restoreRun(snapshot));}
 const snapshot=captureRun(quiet().g);delete snapshot.game.bossDirector;assert.throws(()=>restoreRun(snapshot));
});

test('legacy versions initialize a deterministic director without disturbing existing progress',()=>{
 for(const version of [1,2,3,4,5]){
  const {g}=quiet(901);g.s.elapsed=345;g.spawnEnemy('normal',100,100);const snapshot=captureRun(g);snapshot.version=version;delete snapshot.game.bossDirector;
  const a=restoreRun(snapshot),b=restoreRun(snapshot);assert.equal(a.s.elapsed,345);assert.deepEqual(a.s.enemies,g.s.enemies);assert.deepEqual(a.bossDirector,b.bossDirector);assert.equal(captureRun(a).version,8);
 }
});

test('legacy overlapping bosses survive migration and block new arrivals until all have cleared',()=>{
 const {g}=quiet(15);g.s.elapsed=400;const matriarch=g.spawnEnemy('matriarch',500,0);g.s.enemies=[];const travestia=g.spawnEnemy('travestia',600,0);g.s.enemies=[matriarch,travestia];
 const snapshot=captureRun(g);snapshot.version=5;delete snapshot.game.bossDirector;
 const b=restoreRun(snapshot);assert.deepEqual(b.s.enemies,g.s.enemies);const before=clone(b.bossDirector);
 b.spawnWave(250);assert.deepEqual(b.bossDirector,before);assert.equal(bosses(b).length,2);
 b.s.enemies[0].dead=true;b.spawnWave(250);assert.deepEqual(b.bossDirector,before);assert.equal(bosses(b).length,1);
 b.s.enemies[1].dead=true;b.spawnWave(1);assert.equal(b.bossDirector.remaining,before.remaining-1);
});

test('the finale consumes the preselected random type rather than forcing a specific boss',()=>{
 for(const type of BOSS_TYPES){const {g}=quiet();g.bossDirector.nextType=type;g.s.elapsed=1140.01;g.spawnWave(.02);assert.equal(bosses(g).length,1);assert.equal(bosses(g)[0].type,type);assert.ok(g.eventSeen.has('finale:1140'));g.spawnWave(10);assert.equal(bosses(g).length,1);}
});

test('the finale keeps any active major boss and never replaces or stacks it',()=>{
 for(const type of BOSS_TYPES){const {g}=quiet();const e=g.spawnEnemy(type,100,0),before=clone(g.bossDirector);g.s.elapsed=1140.01;g.spawnWave(.02);assert.deepEqual(bosses(g),[e]);assert.deepEqual(g.bossDirector,before);assert.ok(g.eventSeen.has('finale:1140'));}
});

test('endless mode resumes the same waiting boss schedule after victory',()=>{
 const {g}=quiet();g.s.elapsed=1200;g.s.mode='victory';const before=clone(g.bossDirector);g.continueEndless();assert.equal(g.s.endless,true);assert.deepEqual(g.bossDirector,before);const e=arrive(g);assert.equal(e.type,before.nextType);g.s.enemies=[];arrive(g);assert.equal(bosses(g).length,1);
});

test('a capped finale retains its selected type across retries and save/resume',()=>{
 const {g}=quiet(233);for(let i=0;i<300;i++)g.spawnEnemy('normal',0,0);
 const before=clone(g.bossDirector);g.s.elapsed=1140.01;g.spawnWave(.02);assert.equal(bosses(g).length,0);assert.deepEqual(g.bossDirector,before);
 const b=restoreRun(captureRun(g));b.s.elapsed=1141;b.spawnWave(.1);assert.deepEqual(b.bossDirector,before);assert.equal(bosses(b).length,0);
 b.s.enemies.pop();b.s.elapsed=1141.1;b.spawnWave(.1);assert.equal(bosses(b).length,1);assert.equal(bosses(b)[0].type,before.nextType);assert.ok(b.eventSeen.has('finale:1140'));
});

test('v5 Péli combat state remains intact during migration to the shared director',()=>{
 const {g}=quiet(57);g.s.elapsed=600;const e=g.spawnEnemy('pelican',100,0);g.updateEnemies(.01);assert.ok(e.phase.startsWith('peli_'));
 const snapshot=captureRun(g);snapshot.version=5;delete snapshot.game.bossDirector;const b=restoreRun(snapshot);
 assert.deepEqual(b.s.enemies,g.s.enemies);const before=clone(b.bossDirector);b.spawnWave(300);assert.deepEqual(b.bossDirector,before);assert.equal(bosses(b).length,1);
});

test('a genuine v5 overlapping-boss fixture migrates and remains resumable after saving v6',async()=>{
 const {readFileSync}=await import('node:fs');
 const original=JSON.parse(readFileSync(new URL('./fixtures/runstore-v5.json',import.meta.url),'utf8'));
 assert.equal(original.version,5);assert.equal(original.run.snapshot.version,5);assert.equal(original.run.snapshot.game.bossDirector,undefined);
 const a=restoreRun(original.run.snapshot),b=restoreRun(original.run.snapshot);
 assert.deepEqual(a.s.enemies,original.run.snapshot.game.s.enemies);assert.deepEqual(b.bossDirector,a.bossDirector);
 assert.deepEqual(bosses(a).map(e=>e.type),['matriarch','pelican']);
 const before=clone(a.bossDirector);for(const key in a.timers)if(key!=='animalIndex')a.timers[key]=100000;
 a.spawnWave(200);assert.deepEqual(a.bossDirector,before);a.s.enemies[0].dead=true;a.spawnWave(200);assert.deepEqual(a.bossDirector,before);
 const saved=captureRun(a);assert.equal(saved.version,8);assert.deepEqual(captureRun(restoreRun(saved)),saved);
 a.s.enemies[1].dead=true;a.spawnWave(1);assert.equal(a.bossDirector.remaining,before.remaining-1);
});
