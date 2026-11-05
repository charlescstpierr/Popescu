import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {beginEgoAttack,egoHeight} from '../dist/ego-beasts.js';
import {updateTrophyEffects} from '../dist/trophy-effects.js';

function game(){const g=new Game({seed:42});g.s.trophies.chosen.pelican='tarot';return g;}
function toad(g,x,y){
 const e=g.spawnEnemy('ego_toad',x,y);beginEgoAttack(e,{x,y});e.phase='ego_active';e.egoTime=.6;
 assert.equal(egoHeight(e),110);return e;
}
function card(g,dx=1,dy=0){
 g.s.trophies.cooldowns.tarot=8;
 g.s.trophies.tarot={x:0,y:0,originX:0,originY:0,dx,dy,age:0,hitOut:[],hitBack:[]};
}

test('tarot locks its launch toward the raised toad body, not its shadow',()=>{
 const g=game();toad(g,100,110);updateTrophyEffects(g,.001);
 assert.equal(g.s.trophies.tarot.dx,1);assert.equal(g.s.trophies.tarot.dy,0);
});

test('tarot acquires an in-range body even when its ground anchor is beyond reach',()=>{
 const g=game();toad(g,100,250);updateTrophyEffects(g,.001);
 assert.ok(g.s.trophies.tarot,'the body at (100, 140) is within 220 px');
});

test('tarot remains ready when only a shadow is within acquisition range',()=>{
 const g=game();toad(g,100,-180);updateTrophyEffects(g,.001);
 assert.equal(g.s.trophies.tarot,null,'the body at (100, -290) is outside 220 px');
 assert.equal(g.s.trophies.cooldowns.tarot,0);
});

test('tarot selects the nearest body rather than the nearest ground anchor',()=>{
 const g=game();g.spawnEnemy('tank',0,120);toad(g,100,110);updateTrophyEffects(g,.001);
 assert.equal(g.s.trophies.tarot.dx,1);assert.equal(g.s.trophies.tarot.dy,0);
});

test('tarot damages a crossed airborne body once on each passage',()=>{
 const g=game(),e=toad(g,100,110),hp=e.hp;card(g);
 updateTrophyEffects(g,.8);assert.equal(e.hp,hp-18);
 updateTrophyEffects(g,.8);assert.equal(e.hp,hp-36);assert.equal(g.s.trophies.tarot,null);
});

test('tarot never damages an airborne toad merely by crossing its shadow',()=>{
 const g=game(),e=toad(g,100,0),hp=e.hp;card(g);
 updateTrophyEffects(g,1.6);assert.equal(e.hp,hp);
});

test('tarot collision keeps exact rectangle edges around a raised body',()=>{
 const g=game(),edge=toad(g,100,153),outside=toad(g,100,153.01),hp=edge.hp;card(g);
 updateTrophyEffects(g,1.6);
 assert.equal(edge.hp,hp-36,'body at y=43 touches the 18 px half-width plus 25 px radius');
 assert.equal(outside.hp,hp);
});

test('tarot orders its three victims by body position along a vertical passage',()=>{
 const g=game(),first=g.spawnEnemy('tank',0,80),second=g.spawnEnemy('tank',0,140),last=g.spawnEnemy('tank',0,210),raised=toad(g,0,290);
 const hp=[first,second,last,raised].map(e=>e.hp);g.s.enemies.reverse();card(g,0,1);
 updateTrophyEffects(g,1.6);
 assert.deepEqual([first,second,last,raised].map((e,i)=>hp[i]-e.hp),[36,36,0,36]);
});

test('the full game hits the raised body while the real jump keeps progressing',()=>{
 const g=game(),e=toad(g,100,110),hp=e.hp;card(g);
 Object.assign(g.s.trophies.tarot,{x:55,age:.2});g.s.shotClock=999;
 for(const key of ['spawn','pack','horde','ego','animal','rival'])g.timers[key]=999;
 g.update(.05);
 assert.equal(e.hp,hp-18);
 assert.ok(egoHeight(e)>108&&egoHeight(e)<109,'real enemy simulation advances past the jump apex');
 assert.deepEqual(g.s.trophies.tarot.hitOut,[e.id]);
});
