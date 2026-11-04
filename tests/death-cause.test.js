import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
const game=()=>new Game({seed:987});

test('only the accepted lethal damage writes the cause, after shield absorption',()=>{
 const g=game(),enemy=g.spawnEnemy('tank',50,50);g.s.elapsed=33;g.s.hp=5;g.s.shield=4;g.damage(10,'touch',{actorType:enemy.type,actorId:enemy.id});assert.deepEqual(g.s.deathCause,{source:'touch',actorType:'tank',actorId:enemy.id,at:33,hpLoss:6});g.damage(99,'gas');assert.equal(g.s.deathCause.source,'touch');
});
test('blocked and nonlethal hits never invent a death cause',()=>{
 const g=game();g.s.invulnerable=1;g.damage(999,'touch');assert.equal(g.s.deathCause,undefined);g.s.invulnerable=0;g.s.airplane.active=true;g.damage(999,'gas');assert.equal(g.s.deathCause,undefined);g.s.airplane.active=false;g.s.shield=200;g.damage(110,'touch');assert.equal(g.s.deathCause,undefined);g.s.invulnerable=0;g.s.shield=0;g.damage(5,'gas');assert.equal(g.s.deathCause,undefined);
});
test('gas deaths state the known cause without guessing which cloud or enemy produced it',()=>{
 const g=game();g.s.hp=1;g.s.clouds.push({x:0,y:0,vx:0,vy:0,r:20,life:1,arm:0});g.updateClouds(.01);assert.deepEqual(g.s.deathCause,{source:'gas',actorType:null,actorId:null,at:0,hpLoss:7});
});
test('lethal explosion retains the actual exploder even if it was removed later',()=>{
 const g=game(),e=g.spawnEnemy('explosive',0,0);g.s.hp=1;g.explode(e,30,25);assert.equal(g.s.deathCause.actorType,'explosive');assert.equal(g.s.deathCause.actorId,e.id);g.s.enemies=[];g.s.hp=0;g.s.mode='gameover';assert.deepEqual(restoreRun(captureRun(g)).s.deathCause,g.s.deathCause);
});
test('old dead saves remain honest about an unavailable cause and corrupt causes are rejected',()=>{
 const g=game();g.s.hp=0;g.s.mode='gameover';const old=captureRun(g);assert.equal(restoreRun(old).s.deathCause,undefined);
 for(const deathCause of [{source:'fake',actorType:null,actorId:null,at:0,hpLoss:1},{source:'gas',actorType:null,actorId:null,at:1,hpLoss:1},{source:'gas',actorType:'fake',actorId:1,at:0,hpLoss:1},{source:'gas',actorType:null,actorId:null,at:0,hpLoss:-1}]){const snapshot=structuredClone(old);snapshot.game.s.deathCause=deathCause;assert.throws(()=>restoreRun(snapshot));}
});

test('a same-frame healing pickup keeps the survivor saveable without a stale lethal cause',()=>{
 const g=game();for(const key in g.timers)g.timers[key]=999;g.nextEvent=999;g.s.hp=1;g.s.shotClock=999;const e=g.spawnEnemy('normal',g.s.x,g.s.y);e.attack=0;g.s.drops.push({kind:'heal',x:g.s.x,y:g.s.y,life:10,value:20});g.update(.01);assert.ok(g.s.hp>0);assert.equal(g.s.deathCause,undefined);assert.doesNotThrow(()=>restoreRun(captureRun(g)));
});

for(const [type,x,seconds,source] of [['pelican',160,2,'pelican'],['travestia',60,4.5,'tail'],['ostrich',100,2,'touch'],['rival_goat',60,3,'touch'],['orangutan',50,2,'touch']])test(`${type} lethal attack reports its real actor through the engine`,()=>{
 const g=game();g.world.collides=()=>false;g.s.hp=1;const e=g.spawnEnemy(type,x,0);for(let t=0;t<seconds&&g.s.hp>0;t+=.01){g.s.elapsed+=.01;g.updateEnemies(.01);}assert.ok(g.s.hp<=0);assert.equal(g.s.deathCause.source,source);assert.equal(g.s.deathCause.actorType,type);assert.equal(g.s.deathCause.actorId,e.id);
});
test('Travestia dash reports the boss rather than generic contact',()=>{
 const g=game();g.world.collides=()=>false;g.s.hp=1;g.s.x=120;const e=g.spawnEnemy('travestia',0,0);e.tailAttackCount=1;for(let t=0;t<2&&g.s.hp>0;t+=.01){g.s.elapsed+=.01;g.updateEnemies(.01);}assert.equal(g.s.deathCause.source,'tail');assert.equal(g.s.deathCause.actorType,'travestia');assert.equal(g.s.deathCause.actorId,e.id);
});
test('a rooster wave keeps its factual owner even after that actor dies',()=>{
 const g=game(),e=g.spawnEnemy('rival_rooster',0,0);g.s.hp=1;g.s.x=30;g.s.enemies=[];g.s.shockwaves.push({x:0,y:0,r:0,prevR:0,maxR:80,life:1,maxlife:1,width:8,damage:10,ownerId:e.id,hitPlayer:false,hitGirl:false});g.updateShockwaves(.25);assert.equal(g.s.deathCause.source,'shockwave');assert.equal(g.s.deathCause.actorType,'rival_rooster');assert.equal(g.s.deathCause.actorId,e.id);
});
