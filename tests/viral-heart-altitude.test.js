import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {beginEgoAttack,egoHeight} from '../dist/ego-beasts.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

function fixture(x=100,y=110){
 const g=new Game({seed:42});Object.assign(g.s.upg,{girlfriend:3,charisma:3});g.s.companion=true;g.s.evolutions.viralLove=true;g.recalculate();
 const first=g.spawnEnemy('normal',0,0),toad=g.spawnEnemy('ego_toad',x,y);
 beginEgoAttack(toad,{x,y});toad.phase='ego_active';toad.egoTime=.6;
 g.s.shots=[{x:0,y:0,vx:240,vy:0,life:1.8,kind:'heart',damage:1,r:8,pierce:0,hitIds:new Set(),viral:true,linkX:0,linkY:0}];
 return {g,first,toad};
}

test('viral heart ricochet aims at the same raised toad hitbox as ordinary shots',()=>{
 const {g,first,toad}=fixture();assert.equal(egoHeight(toad),110);
 g.updateShots(.001);const shot=g.s.shots[0];
 assert.deepEqual([...shot.hitIds],[first.id]);
 const expected=0; // The midpoint lift puts the body exactly at (100, 0).
 assert.ok(Math.abs(Math.atan2(shot.vy,shot.vx)-expected)<1e-12,'ricochet must aim at the airborne body, not its shadow');
 const hp=toad.hp;for(let i=0;i<50;i++)g.updateShots(.01);
 assert.ok(toad.hp<hp,'heart reaches the raised collision circle');
});

test('viral heart range checks the raised target rather than rejecting an in-range body',()=>{
 const {g,first,toad}=fixture(200,250);
 assert.ok(Math.hypot(toad.x-first.x,toad.y-first.y)>260);
 assert.ok(Math.hypot(200,140)<260); // 250 ground Y minus the 110 px lift.
 g.updateShots(.001);assert.equal(g.s.shots.length,1,'in-range raised target keeps the ricochet alive');
 assert.deepEqual([...g.s.shots[0].hitIds],[first.id]);
});

test('saving an altitude-corrected viral rebound preserves its trajectory and combat state',()=>{
 const {g}=fixture();g.updateShots(.001);const snapshot=captureRun(g),restored=restoreRun(snapshot);
 assert.deepEqual(captureRun(restored),snapshot);
 for(let i=0;i<100;i++){g.updateShots(.01);restored.updateShots(.01);}
 assert.deepEqual(captureRun(restored),captureRun(g));
});

for(const outcome of ['surviving','killed','charmed'])test(`viral rebound uses the raised source impact after a ${outcome} toad hit`,()=>{
 const g=new Game({seed:42});Object.assign(g.s.upg,{girlfriend:3,charisma:3});g.s.companion=true;g.s.evolutions.viralLove=true;g.recalculate();
 const toad=g.spawnEnemy('ego_toad',0,110),next=g.spawnEnemy('normal',200,-140);
 beginEgoAttack(toad,{x:0,y:110});toad.phase='ego_active';toad.egoTime=.6;
 // These RNG seeds select the real heart charm branch; no combat function is replaced.
 g.rng=outcome==='charmed'?1:65535;
 if(outcome==='killed')toad.hp=1;
 g.s.shots=[{x:0,y:0,vx:240,vy:0,life:1.8,kind:'heart',damage:1,r:8,pierce:0,hitIds:new Set(),viral:true,linkX:0,linkY:0}];
 g.updateShots(.001);
 if(outcome==='charmed')assert.ok(toad.charmed>0);else if(outcome==='killed')assert.ok(toad.dead);else assert.equal(toad.charmed,0);
 assert.equal(g.s.shots.length,1,'244 px body-to-body rebound stays in range even after its source lands, dies, or is charmed');
 const shot=g.s.shots[0];assert.deepEqual([...shot.hitIds],[toad.id]);assert.equal(shot.linkX,0);assert.equal(shot.linkY,0,'trail starts at the original airborne impact');
 const cue=g.powerEffects.find(effect=>effect.power==='viralLove'&&effect.kind==='bounce');assert.equal(cue.y,0);
 const expected=Math.atan2(-140-shot.y,200-shot.x);assert.ok(Math.abs(Math.atan2(shot.vy,shot.vx)-expected)<1e-12);
});
