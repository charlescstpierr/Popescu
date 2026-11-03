import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';

function quiet(){const events=[],g=new Game({seed:42,onEvent:(t,p)=>events.push([t,p])});for(const key of Object.keys(g.timers))if(key!=='animalIndex')g.timers[key]=1e5;g.nextEvent=1e5;g.s.xpNeed=100000;g.s.shotClock=1000;return {g,events};}
function chest(g,type,x=0,y=0){const boss=g.spawnEnemy(type,x,y);assert.ok(boss);g.hurt(boss,boss.hp);g.s.enemies=g.s.enemies.filter(e=>!e.dead);return g.s.chests.at(-1);}

test('a boss chest keeps its real species and author while ordinary loot stays unchanged',()=>{
 const {g}=quiet();const c=chest(g,'pelican');assert.equal(c.bossType,'pelican');assert.ok(c.bossId<c.id);assert.deepEqual(g.s.drops.map(d=>[d.kind,d.value]),[['xp',22],['gem',3],['heal',25]]);
 g.s.hp=30;g.s.stats.shieldMax=20;g.updateChests(.01);assert.equal(g.s.coins,5);assert.equal(g.s.hp,48);assert.equal(g.s.shield,12);assert.equal(g.s.xp,10);assert.equal(c.open,true);assert.deepEqual(g.s.trophies.pending,[{bossType:'pelican',chestId:c.id,bossId:c.bossId}]);
 g.updateChests(.01);assert.equal(g.s.coins,5);assert.equal(g.s.xp,10);assert.equal(g.s.trophies.pending.length,1);
});
test('ordinary chests never offer a trophy',()=>{const {g}=quiet();g.s.chests.push({id:g.id++,x:0,y:0,open:false,openedAt:0});g.update(.01);assert.equal(g.s.mode,'playing');assert.deepEqual(g.s.trophies.pending,[]);assert.deepEqual(g.s.trophies.chosen,{});});
test('one click chooses exactly one of the two fixed options and freezes the simulation',()=>{
 const {g}=quiet();chest(g,'travestia');g.update(.01);assert.equal(g.s.mode,'trophy');const before=JSON.stringify(g.s);g.update(.25,{x:1,y:0});assert.equal(JSON.stringify(g.s),before);assert.equal(g.chooseTrophy('badge'),false);assert.equal(g.chooseTrophy('panache'),true);assert.equal(g.chooseTrophy('star'),false);assert.equal(g.s.mode,'playing');assert.deepEqual(g.s.trophies.chosen,{travestia:'panache'});assert.equal(g.s.trophies.cooldowns.panache,10);assert.equal(g.s.invulnerable,.6);assert.equal(g.s.moveX,0);assert.equal(g.s.moveY,0);
});
test('only one reward per species survives duplicate boss chests and the total never exceeds three',()=>{
 const {g}=quiet();for(const type of ['pelican','pelican','travestia','matriarch'])chest(g,type);g.update(.01);assert.equal(g.s.trophies.pending.length,3);assert.equal(g.s.coins,20);
 for(const id of ['ascendant','star','badge'])assert.equal(g.chooseTrophy(id),true);assert.equal(g.s.mode,'playing');assert.equal(Object.keys(g.s.trophies.chosen).length,3);chest(g,'pelican');g.update(.01);assert.equal(g.s.mode,'playing');assert.equal(g.s.trophies.pending.length,0);assert.equal(g.s.coins,25);assert.equal(g.chooseTrophy('tarot'),false);
});
test('a level already open has priority and the trophy follows that exact choice before XP backlog',()=>{
 const {g}=quiet();g.s.xpNeed=8;g.gainXP(8);const options=g.s.options.map(o=>o.id);chest(g,'matriarch');g.updateChests(.01);assert.equal(g.s.mode,'upgrade');assert.deepEqual(g.s.options.map(o=>o.id),options);assert.equal(g.s.trophies.pending.length,1);g.s.xp=1000;assert.equal(g.chooseUpgrade(options[0]),true);assert.equal(g.s.mode,'trophy');assert.equal(g.chooseTrophy('fanclub'),true);assert.equal(g.s.mode,'upgrade');
});
test('twenty-minute victory outranks a same-step chest and preserves its pending choice for endless',()=>{
 const {g,events}=quiet();g.s.elapsed=1199.99;chest(g,'pelican');g.update(.02);assert.equal(g.s.mode,'victory');assert.equal(g.s.trophies.pending.length,1);assert.equal(events.filter(([t])=>t==='trophy').length,0);assert.equal(g.s.coins,5);g.continueEndless();assert.equal(g.s.mode,'trophy');assert.equal(g.s.endless,true);g.chooseTrophy('tarot');assert.equal(g.s.mode,'playing');assert.equal(g.s.coins,5);
});
test('a queued trophy cannot replace gameover or an active dialogue',()=>{
 const {g}=quiet();chest(g,'matriarch');g.updateChests(.01);g.startDialogue([{who:'TOMA',text:'Moi.'}]);g.openTrophy();assert.equal(g.s.mode,'dialogue');g.finishDialogue();assert.equal(g.s.mode,'trophy');
 const {g:b}=quiet();chest(b,'pelican');b.updateChests(.01);b.s.drops=[];b.s.hp=0;b.update(.01);assert.equal(b.s.mode,'gameover');assert.equal(b.chooseTrophy('tarot'),false);assert.equal(b.s.trophies.pending.length,1);
});
test('trophy choice does not draw randomness or credit ordinary chest rewards again',()=>{const {g}=quiet();chest(g,'pelican');g.update(.01);const rng=g.rng,coins=g.s.coins,xp=g.s.xp;g.chooseTrophy('tarot');assert.equal(g.rng,rng);assert.equal(g.s.coins,coins);assert.equal(g.s.xp,xp);});
test('chest trimming reserves all pending choices even when ordinary capacity is zero',async()=>{const {trimTrophyChests}=await import('../dist/boss-trophies.js');const {g}=quiet();for(const type of ['pelican','travestia','matriarch'])chest(g,type);g.updateChests(.01);g.s.chests.push({id:g.id++,x:100,y:100,open:false,openedAt:0});assert.equal(trimTrophyChests(g.s,3).length,3);});
