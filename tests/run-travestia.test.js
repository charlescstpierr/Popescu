import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';
import {travestiaFrame} from '../dist/travestia.js';
function setup(){const events=[],g=new Game({seed:42,onEvent:(type,payload)=>events.push([type,payload])});for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;g.s.companion=true;g.s.girl.x=0;g.s.girl.y=0;g.recalculate();const e=g.spawnEnemy('travestia',60,0);g.updateEnemies(.01);return {g,e,events};}
function advance(g,seconds){for(let t=0;t<seconds-1e-7;t+=.01){g.s.elapsed+=.01;g.updateEnemies(.01);}}
test('warning resumes exact phase and delivers pending reply once',()=>{
 const {g,e}=setup();advance(g,3.2);assert.equal(e.phase,'tail_windup');assert.equal(e.tailReplyPending,true);const events=[],b=restoreRun(captureRun(g),{onEvent:(t,p)=>events.push([t,p])});assert.equal(travestiaFrame(b.s.enemies[0]),travestiaFrame(e));advance(g,.7);advance(b,.7);assert.deepEqual(captureRun(b),captureRun(g));assert.equal(events.filter(([t,p])=>t==='bark'&&p.text==='FUCKK !').length,1);
});
test('spin resumes hit flags so player and companion are not damaged twice',()=>{
 const {g,e}=setup();advance(g,4.25);assert.equal(e.phase,'tail_spin');assert.equal(e.tailHitPlayer,true);assert.equal(e.tailHitGirl,true);const b=restoreRun(captureRun(g)),hp=b.s.hp,girlHp=b.s.girl.hp;b.s.invulnerable=0;advance(b,.6);assert.equal(b.s.hp,hp);assert.equal(b.s.girl.hp,girlHp);
});
test('recovery remains harmless and future movement/cooldowns deterministic',()=>{
 const {g,e}=setup();advance(g,5.7);assert.equal(e.phase,'tail_recover');const b=restoreRun(captureRun(g)),hp=b.s.hp;advance(g,.8);advance(b,.8);assert.equal(b.s.hp,hp);assert.deepEqual(captureRun(b),captureRun(g));
});
for(const effect of ['charm','airplane'])test(`interrupted ${effect} attack does not resurrect or reply after reload`,()=>{
 const {g,e}=setup();if(effect==='charm')e.charmed=3;else g.s.airplane.active=true;g.updateEnemies(.01);const events=[],b=restoreRun(captureRun(g),{onEvent:(t,p)=>events.push([t,p])});advance(b,1);assert.equal(b.s.enemies[0].tailTime,0);assert.equal(events.filter(([t,p])=>t==='bark'&&p.who==='TOMA').length,0);
});
test('boss spawn timer and paused walk frame survive restoration',()=>{
 const {g,e}=setup();g.timers.travestia=80;e.tailWalkDistance=47;e.tailMoving=true;g.pause();const b=restoreRun(captureRun(g)),snap=captureRun(b);b.update(.2);assert.deepEqual(captureRun(b),snap);assert.equal(b.timers.travestia,80);assert.equal(b.s.enemies[0].tailWalkDistance,47);assert.equal(b.spawnEnemy('travestia',200,0),null);
});
test('malformed boss attacks and missing pending reply are rejected',()=>{
 for(const change of [e=>e.tailTime=999,e=>e.phase='unknown',e=>e.tailBanterIndex=.5,e=>delete e.tailReply,e=>delete e.tailWarning,e=>e.tailHitPlayer=null]){const {g}=setup();const snap=captureRun(g);change(snap.game.s.enemies[0]);assert.throws(()=>restoreRun(snap));}
});
test('version-one run migrates missing Travestia timer and common fields without losing discoveries',()=>{
 const g=new Game({seed:42});g.spawnEnemy('normal',100,100);g.discoveryCooldowns.set('site',125);g.discoveryContact='site';const old=captureRun(g);old.version=1;delete old.game.timers.travestia;for(const e of old.game.s.enemies)for(const key of ['tailTime','tailFaceX','tailHitPlayer','tailHitGirl'])delete e[key];const b=restoreRun(old);assert.equal(b.timers.travestia,240);assert.equal(b.s.enemies[0].tailTime,0);assert.deepEqual([...b.discoveryCooldowns],[['site',125]]);b.update(.01);assert.ok(Number.isFinite(b.timers.travestia));
 const raw=JSON.stringify({version:1,revision:2,totals:{best:1,lifetime:0,coins:0},run:{id:'old',snapshot:old,creditedKills:0,creditedCoins:0}});const store=new RunStore({getItem:()=>raw});assert.equal(store.read().status,'ready');assert.equal(store.read().value.run.snapshot.game.timers.travestia,240);
});
test('same-frame charm and Mode avion interruptions remain valid snapshots before next enemy update',()=>{
 for(const effect of ['charm','airplane']){const {g,e}=setup();if(effect==='charm'){e.charmed=3;e.phase='charmed';}else{g.s.airplane.active=true;e.phase='suppressed';}assert.ok(e.tailTime>0);const b=restoreRun(captureRun(g));b.updateEnemies(.01);assert.equal(b.s.enemies[0].tailTime,0);assert.equal(b.s.enemies[0].tailReplyPending,false);}
});
test('announced long warning cannot silently lose its pending-reply flag',()=>{
 const {g}=setup();const snapshot=captureRun(g);delete snapshot.game.s.enemies[0].tailReplyPending;assert.throws(()=>restoreRun(snapshot));
});
