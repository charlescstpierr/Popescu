import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {lethalDamageCause,validateDeathCause} from '../dist/run-history.js';
const fixture=()=>JSON.parse(readFileSync(new URL('./fixtures/paused-v14-travestia.json',import.meta.url)));
const species=['ego_toad','ego_chameleon','ego_peacock','ego_rat'];
test('v14 migration adds only new scheduler state and preserves active dialogue cursor and progress',()=>{
 const old=fixture(),original=structuredClone(old),next=captureRun(restoreRun(old));
 assert.equal(next.version,16);assert.equal(next.game.timers.ego,9);assert.equal(next.game.timers.egoIndex,0);
 assert.equal(next.game.encounters.active.index,1);assert.deepEqual(old,original);
 assert.equal(next.game.s.survivalDuration,1200);delete next.game.s.survivalDuration;next.version=14;delete next.game.timers.ego;delete next.game.timers.egoIndex;assert.deepEqual(next,old);
});
test('every historical schema rejects injected new enemy state and scheduler fields',()=>{
 for(let version=1;version<=14;version++)for(const inject of [s=>s.game.timers.ego=1,s=>s.game.timers.egoIndex=1,s=>s.game.s.enemies[0].egoTime=0,s=>s.game.s.enemies[0].phase='ego_active',...species.map(type=>s=>s.game.s.enemies[0].type=type)]){
  const old=fixture();old.version=version;inject(old);assert.throws(()=>restoreRun(old),undefined,`v${version}`);
 }
});
test('lethal damage preserves each ego species attribution',()=>{
 for(const actorType of species){const cause=lethalDamageCause('touch',{actorType,actorId:7},12,3);assert.equal(cause.actorType,actorType);assert.equal(cause.actorId,7);assert.equal(validateDeathCause(cause,12,8),cause);}
});
test('scheduler rejects invalid finite/index state',()=>{
 for(const [key,value] of [['ego',Infinity],['ego',NaN],['ego',-1e9],['egoIndex',-.1],['egoIndex',.5]]){const s=captureRun(new Game());s.game.timers[key]=value;assert.throws(()=>restoreRun(s));}
});

for(const type of species)for(const phase of ['chase','ego_warning','ego_active','ego_recover'])test(`${type} ${phase} round-trips and continues deterministically`,async()=>{
 const {EGO_BEASTS,beginEgoAttack,updateEgoBeast}=await import('../dist/ego-beasts.js');
 const g=new Game({seed:15}),e=g.spawnEnemy(type,0,0);e.cooldown=0;
 if(phase!=='chase'){beginEgoAttack(e,{x:0,y:0});if(phase!=='ego_warning')updateEgoBeast(g,e,EGO_BEASTS[type].warning+.05);if(phase==='ego_recover')updateEgoBeast(g,e,EGO_BEASTS[type].duration);}
 assert.equal(e.phase,phase);const saved=captureRun(g),b=restoreRun(saved);assert.deepEqual(captureRun(b),saved);
 for(let i=0;i<30;i++){g.update(.01,{x:0,y:1});b.update(.01,{x:0,y:1});assert.deepEqual(captureRun(b),captureRun(g));}
});
test('save validation rejects invalid attack geometry, phases, surface, counters and obsolete path fields',()=>{
 const g=new Game(),e=g.spawnEnemy('ego_toad',0,0),source=captureRun(g);
 for(const change of [e=>e.egoTime=-1,e=>e.egoTime=1,e=>e.phase='ego_unknown',e=>e.egoLandX=1e8+1,e=>e.egoAimY=1e8+1,e=>e.egoLandX=221,e=>e.egoDX=0,e=>e.egoHits=2,e=>e.egoBlocked=true,e=>e.egoSurface='water',e=>e.egoPath=[],e=>e.egoCursor=0,e=>e.egoSample=1,e=>e.egoReveal=3]){const bad=structuredClone(source);change(bad.game.s.enemies[0]);assert.throws(()=>restoreRun(bad));}
});
test('save boundary rejects a forged third live actor of the same species',()=>{
 const g=new Game();g.spawnEnemy('ego_rat',0,0);g.spawnEnemy('ego_rat',30,0);const bad=captureRun(g),extra=structuredClone(bad.game.s.enemies[0]);extra.id=bad.game.id++;bad.game.s.enemies.push(extra);assert.throws(()=>restoreRun(bad));
});
for(const type of species)for(const interruption of ['charm','airplane'])test(`${type} ${interruption} same-frame checkpoint preserves safe cancellation`,async()=>{
 const {beginEgoAttack}=await import('../dist/ego-beasts.js');const g=new Game(),e=g.spawnEnemy(type,0,0);beginEgoAttack(e,{x:0,y:0});
 if(interruption==='charm')e.charmed=2;else g.s.airplane.active=true;
 const b=restoreRun(captureRun(g)),hp=b.s.hp;b.updateEnemies(0);assert.equal(b.s.enemies[0].phase,'chase');assert.equal(b.s.enemies[0].egoTime,0);assert.equal(b.s.hp,hp);assert.doesNotThrow(()=>captureRun(b));
});
for(const type of species)test(`${type} lethal attack retains species through save and restore`,async()=>{
 const {EGO_BEASTS,beginEgoAttack,updateEgoBeast}=await import('../dist/ego-beasts.js');const g=new Game(),e=g.spawnEnemy(type,0,0);beginEgoAttack(e,{x:0,y:0});
 if(type==='ego_peacock')g.s.x=-75;if(type==='ego_rat'){g.s.x=80;g.s.y=-62;}if(type==='ego_chameleon')g.s.x=35;
 g.s.hp=1;g.s.invulnerable=0;updateEgoBeast(g,e,EGO_BEASTS[type].warning+EGO_BEASTS[type].duration);g.update(.01);assert.equal(g.s.mode,'gameover');assert.equal(g.s.deathCause.actorType,type);assert.equal(g.s.deathCause.actorId,e.id);assert.deepEqual(restoreRun(captureRun(g)).s.deathCause,g.s.deathCause);
});
