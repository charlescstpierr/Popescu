import test from 'node:test';import assert from 'node:assert/strict';import {Game} from '../dist/engine.js';import {EGO_BEASTS,beginEgoAttack,egoHeight,updateEgoBeast} from '../dist/ego-beasts.js';
function setup(type,x=90,y=0){const g=new Game();g.world.collides=()=>false;const e=g.spawnEnemy(type,x,y);return {g,e};}
for(const type of Object.keys(EGO_BEASTS))test(`${type} cannot cause extra generic contact damage`,()=>{const {g,e}=setup(type,0,0);e.cooldown=9;const hp=g.s.hp;g.updateEnemies(.01);assert.equal(g.s.hp,hp);});
for(const type of Object.keys(EGO_BEASTS))test(`${type} warning is stable under movement and crowd separation`,()=>{const {g,e}=setup(type);beginEgoAttack(e,g.s);const x=e.x,y=e.y;g.spawnEnemy('normal',x,y);g.move(e,30,30,e.r);g.knockback(e,30,30,e.r);g.separateEnemies(.1);assert.equal(e.x,x);assert.equal(e.y,y);});
for(const type of Object.keys(EGO_BEASTS))test(`${type} airborne or active simulation freezes during pause`,()=>{const {g,e}=setup(type);beginEgoAttack(e,g.s);updateEgoBeast(g,e,EGO_BEASTS[type].warning+.1);g.pause();const before=JSON.stringify(g.s);g.update(.25,{x:1,y:0});assert.equal(JSON.stringify(g.s),before);});
test('toad takes increased damage in recovery only',()=>{const {g,e}=setup('ego_toad');const hp=e.hp;g.hurt(e,10);assert.equal(e.hp,hp-10);e.phase='ego_recover';g.hurt(e,10);assert.equal(e.hp,hp-25);});
test('bullets aim at and collide with the airborne whole toad rather than its ground shadow',()=>{
 const {g,e}=setup('ego_toad',100,100);beginEgoAttack(e,{x:100,y:100});e.phase='ego_active';e.egoTime=.6;const lift=egoHeight(e),hp=e.hp;assert.ok(lift>100);
 g.s.shots=[{x:e.x,y:e.y-lift,vx:0,vy:0,life:1,kind:'bullet',damage:5,r:4,pierce:0,hitIds:new Set()}];g.updateShots(.01);assert.equal(e.hp,hp-5);
 g.s.shots=[];g.shoot(0,0,e,'bullet',5,100);assert.ok(Math.abs(g.s.shots[0].vy/g.s.shots[0].vx-(e.y-lift)/e.x)<1e-6);
});
test('Mode avion due this frame interrupts before a beast strike is evaluated',()=>{
 const {g,e}=setup('ego_chameleon',-45,0);g.world.blocksAxisMove=()=>false;g.s.upg.airplane=1;g.timers.airplane=0;g.s.shotClock=99;beginEgoAttack(e,g.s);e.phase='ego_active';e.egoTime=.15;const hp=g.s.hp;g.step(.01,{x:0,y:0});assert.equal(g.s.hp,hp);assert.equal(e.phase,'chase');assert.equal(g.s.airplane.active,true);
});
