import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
function quiet(time=0){const events=[],g=new Game({survivalDuration:1200,seed:42,onEvent:(t,p)=>events.push([t,p])});for(const k in g.timers)g.timers[k]=100000;g.s.elapsed=time;g.nextEvent=100000;return {g,events};}
function spawnCount(time){const {g}=quiet(time);g.timers.spawn=0;g.timers.pack=0;for(let i=0;i<150;i++){g.s.elapsed+=1/30;g.spawnWave(1/30);}return g.s.enemies.length;}
test('recovery window reduces arrivals and holds packs without a catch-up burst',()=>{
 assert.ok(spawnCount(180)<spawnCount(160)/2);
 const {g}=quiet(194.99);g.timers.pack=0;g.spawnWave(.01);assert.equal(g.s.enemies.length,0);g.s.elapsed=195.01;g.spawnWave(.02);assert.ok(g.s.enemies.length<=6);
});
test('later hordes alternate existing enemy compositions',()=>{
 const kinds=[];for(const time of [155,215,245]){const {g}=quiet(time);g.timers.horde=0;g.spawnWave(.01);kinds.push([...new Set(g.s.enemies.map(e=>e.type))]);}
 assert.equal(new Set(kinds.map(x=>x.join(','))).size,3);
});
test('horde warning precedes spawning by six seconds even when a previous speech reservation is active',()=>{
 const {g,events}=quiet(150);g.speechUntil=999;g.timers.horde=6.01;g.spawnWave(.02);assert.equal(g.s.enemies.length,0);assert.ok(events.some(([t,p])=>t==='bark'&&p.text.includes('six secondes')));
 g.spawnWave(5.97);assert.equal(g.s.enemies.length,0);g.spawnWave(.03);assert.ok(g.s.enemies.length>0);
});
test('every randomly selected boss warns five seconds before arrival',()=>{
 for(const type of ['matriarch','travestia','pelican']){const {g,events}=quiet(300);Object.assign(g.bossDirector,{nextType:type,remaining:5.01,warned:false});g.spawnWave(.02);assert.equal(g.s.enemies.length,0);assert.ok(events.some(([t,p])=>t==='bark'&&p.text.includes('cinq secondes')));g.spawnWave(5);assert.equal(g.s.enemies.length,1);assert.equal(g.s.enemies[0].type,type);}
});
test('final minute is announced and staged without simultaneous regular encounters',()=>{
 const {g,events}=quiet(1129.99);g.s.elapsed+=.02;g.spawnWave(.02);assert.ok(events.some(([t,p])=>t==='bark'&&p.text.includes('Dernière minute')));
 g.s.elapsed=1140.01;g.timers.horde=g.timers.rival=0;g.spawnWave(.02);assert.equal(g.s.enemies.length,1);assert.equal(g.s.enemies[0].type,g.bossDirector.lastType);
 g.s.elapsed=1160.01;g.spawnWave(.02);assert.equal(g.s.enemies.filter(e=>e.type.startsWith('rival_')).length,1);
 g.s.elapsed=1180.01;g.spawnWave(.02);assert.ok(g.s.enemies.length>10);assert.ok(g.s.enemies.length<=300);
});
test('finale milestones survive checkpoint without replay and old saves skip past beats',()=>{
 const {g}=quiet(1140.01);g.spawnWave(.02);const saved=captureRun(g),b=restoreRun(saved);b.spawnWave(.02);g.spawnWave(.02);assert.equal(b.s.enemies.length,1);
 const {g:old}=quiet(1150);old.spawnWave(.02);assert.equal(old.s.enemies.length,0);
 g.s.elapsed=b.s.elapsed=1160.01;g.spawnWave(.02);b.spawnWave(.02);assert.deepEqual(captureRun(b),captureRun(g));
});
test('endless continuation uses normal schedule and never replays finale',()=>{
 const {g,events}=quiet(1201);g.s.endless=true;g.timers.horde=0;Object.assign(g.bossDirector,{nextType:'travestia',remaining:0,warned:true});g.spawnWave(.02);assert.ok(g.s.enemies.some(e=>e.type==='travestia'));assert.ok(g.s.enemies.length>10);assert.ok(!events.some(([t,p])=>t==='bark'&&p.text.includes('Dernière minute')));
});
test('finale preserves visible enemies and reserves only an offscreen ordinary slot',()=>{
 const {g}=quiet(1140.01);for(let i=0;i<300;i++)g.spawnEnemy('normal',i===299?800:0,0);
 const visibleIds=g.s.enemies.slice(0,299).map(e=>e.id);g.spawnWave(.02);
 assert.equal(g.s.enemies.length,300);assert.ok(g.s.enemies.some(e=>e.type===g.bossDirector.lastType));assert.deepEqual(g.s.enemies.filter(e=>e.type==='normal').map(e=>e.id),visibleIds);
 const boss=g.s.enemies.find(e=>e.type===g.bossDirector.lastType);assert.ok(Math.abs(boss.x)>g.viewport.width/2+boss.r||boss.y < -g.viewport.height*.48-boss.r||boss.y > g.viewport.height*.52+boss.r);
});
test('an already present finale boss does not retire another enemy at capacity',()=>{
 const {g}=quiet(1140.01);g.spawnEnemy('travestia',500,0);for(let i=0;i<299;i++)g.spawnEnemy('normal',800,i);
 const ids=g.s.enemies.map(e=>e.id);g.spawnWave(.02);assert.deepEqual(g.s.enemies.map(e=>e.id),ids);
});
test('pausing before a finale boundary freezes its warning and encounter clock',()=>{
 const {g,events}=quiet(1129.99);g.pause();g.update(.2);assert.equal(g.s.elapsed,1129.99);assert.equal(events.length,0);
 g.resume();g.update(.02);assert.equal(events.filter(([t,p])=>t==='bark'&&p.text.includes('Dernière minute')).length,1);
});
test('full final minute survives deterministic saves and starts Charles once',()=>{
 const events=[],g=new Game({survivalDuration:1200,seed:71,onEvent:(t,p)=>events.push([t,p])});g.s.elapsed=1129.8;g.s.invulnerable=200;g.nextEvent=100000;
 let b=restoreRun(captureRun(g));
 for(let i=0;i<1500&&!g.s.charles;i++){
  for(const run of [g,b]){if(run.s.mode==='upgrade')run.chooseUpgrade(run.s.options[0].id);if(run.s.mode==='dialogue')run.finishDialogue();run.update(.05,{x:Math.cos(i/50),y:Math.sin(i/50)});}
  if(i%100===0){assert.deepEqual(captureRun(b),captureRun(g));b=restoreRun(captureRun(b));}
 }
 assert.equal(g.s.mode,'playing');assert.equal(g.s.charles.phase,'intro');assert.equal(events.filter(([t])=>t==='epilogue-start').length,1);assert.equal(events.filter(([t])=>t==='victory').length,0);assert.deepEqual(captureRun(b),captureRun(g));
 assert.ok(g.eventSeen.has('finale:1180'));assert.ok(g.s.enemies.length<=300);
});
test('a capped final boss retries after space opens and persists the pending encounter',()=>{
 const {g}=quiet(1140.01);for(let i=0;i<300;i++)g.spawnEnemy('normal',0,0);g.spawnWave(.02);assert.equal(g.s.enemies.length,300);
 const b=restoreRun(captureRun(g));b.s.enemies.pop();b.s.elapsed=1140.04;b.spawnWave(.03);assert.ok(b.s.enemies.some(e=>e.type===b.bossDirector.lastType));
});
test('final horde reserves offscreen slots or retries without deleting visible actors',()=>{
 for(const offscreen of [true,false]){const {g}=quiet(1180.01);for(let i=0;i<300;i++)g.spawnEnemy('normal',offscreen?800:0,0);g.spawnWave(.02);
 if(!offscreen){assert.ok(g.s.enemies.every(e=>e.type==='normal'));g.s.enemies.splice(0,20);g.s.elapsed=1180.04;g.spawnWave(.03);}
 assert.ok(g.s.enemies.some(e=>e.type!=='normal'));assert.ok(g.s.enemies.length<=300);}
});
test('scheduled horde composition tolerates floating point boundary drift',()=>{
 const kinds=[];for(const time of [155-1e-7,155+1e-7]){const {g}=quiet(time);g.timers.horde=0;g.spawnWave(.01);kinds.push(g.s.enemies.map(e=>e.type));}assert.deepEqual(kinds[0],kinds[1]);
});
test('an active Travestia does not produce repeated arrival warnings on retry',()=>{
 const {g,events}=quiet(475);g.spawnEnemy('travestia',500,0);g.bossDirector.remaining=5.01;g.spawnWave(.02);assert.ok(!events.some(([t,p])=>t==='bark'&&p.text.includes('Travestia arrive')));
});
test('regular warnings do not promise encounters that the finale will suppress',()=>{
 const {g,events}=quiet(1139);g.timers.horde=6.01;g.bossDirector.remaining=5.01;g.spawnWave(.02);assert.equal(events.filter(([t])=>t==='bark').length,0);
 g.s.endless=true;g.timers.horde=6.01;g.spawnWave(.02);assert.ok(events.some(([t,p])=>t==='bark'&&p.text.includes('six secondes')));
});

test('restored warning text combines pending threats without changing clocks or replaying suppressed arrivals',()=>{
 const {g}=quiet(300);g.timers.horde=3.1;Object.assign(g.bossDirector,{remaining:2.2,warned:true});
 const before=captureRun(g),warning=g.pendingEncounterWarning();
 assert.match(warning,/arrive dans environ 3 s/);assert.match(warning,/horde arrive dans environ 4 s/);
 assert.deepEqual(captureRun(g),before);
 g.s.elapsed=1139;assert.equal(g.pendingEncounterWarning(),'');
 g.s.endless=true;assert.match(g.pendingEncounterWarning(),/horde/);
});

test('a pending capped boss uses imminent wording instead of claiming zero seconds',()=>{
 const {g}=quiet(300);Object.assign(g.bossDirector,{remaining:0,warned:true,retryIn:1});
 assert.match(g.pendingEncounterWarning(),/arrive bientôt/);assert.doesNotMatch(g.pendingEncounterWarning(),/0 s/);
 g.spawnEnemy(g.bossDirector.nextType,500,0);assert.equal(g.pendingEncounterWarning(),'');
});

test('late saves do not invent missed finale warnings or repeat completed finale countdowns',()=>{
 const {g}=quiet(1175);assert.equal(g.pendingEncounterWarning(),'');
 g.eventSeen.add('finale:1174');assert.match(g.pendingEncounterWarning(),/vague.*5 s/);
 g.s.elapsed=1180;assert.equal(g.pendingEncounterWarning(),'');
 g.s.elapsed=1175;g.s.endless=true;assert.equal(g.pendingEncounterWarning(),'');
});
