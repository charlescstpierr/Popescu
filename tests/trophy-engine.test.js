import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {DIFFICULTIES} from '../dist/content.js';
function quiet(difficulty='normal'){const g=new Game({seed:42,difficulty});for(const k in g.timers)if(k!=='animalIndex')g.timers[k]=100000;g.nextEvent=100000;g.s.shotClock=100000;g.s.xpNeed=100000;return g;}
test('ordinary melee carries provenance and applies badge after each difficulty multiplier',()=>{
 for(const difficulty of Object.keys(DIFFICULTIES)){const g=quiet(difficulty);g.s.trophies.chosen.matriarch='badge';const hp=g.s.hp;g.spawnEnemy('normal',g.s.x,g.s.y);g.updateEnemies(.001);assert.ok(Math.abs(g.s.hp-(hp-Math.max(1,11*(g.difficulty.damage||1)-2)))<1e-8,difficulty);}
});
test('badge does not change a special attack reusing touch or a matriarch contact',()=>{
 const a=quiet();a.s.trophies.chosen.matriarch='badge';a.damage(14,'touch');assert.equal(a.s.hp,a.s.maxhp-14);
 const b=quiet();b.s.trophies.chosen.matriarch='badge';b.spawnEnemy('matriarch',b.s.x,b.s.y);b.updateEnemies(.001);assert.equal(b.s.hp,b.s.maxhp-26*(b.difficulty.damage||1));
});
test('ascendant respects existing rejected-hit gates and adds no invulnerability on full absorption',()=>{
 const g=quiet();g.s.trophies.chosen.pelican='ascendant';g.s.invulnerable=1;g.damage(11,'touch');assert.equal(g.s.trophies.cooldowns.ascendant,0);g.s.invulnerable=0;g.s.airplane.active=true;g.damage(7,'gas');assert.equal(g.s.trophies.cooldowns.ascendant,0);g.s.airplane.active=false;g.damage(11,'touch');assert.equal(g.s.hp,g.s.maxhp);assert.equal(g.s.invulnerable,0);assert.equal(g.s.trophies.cooldowns.ascendant,12);g.damage(11,'touch');assert.equal(g.s.hp,g.s.maxhp-11);
});
test('star runs from an ordinary shield hit, without stacking or replacing current speed bonuses',()=>{
 const g=quiet();g.s.upg.speed=3;g.s.trophies.chosen.travestia='star';g.recalculate();const speed=g.s.stats.speed;g.s.shield=20;g.damage(5,'touch');assert.equal(g.s.hp,g.s.maxhp);assert.equal(g.s.shield,15);assert.equal(g.s.stats.speed,speed*1.25);assert.equal(g.s.trophies.starLife,2);g.s.invulnerable=0;g.damage(5,'touch');assert.equal(g.s.trophies.starLife,2);assert.equal(g.s.trophies.cooldowns.star,8);g.recalculate();assert.equal(g.s.stats.speed,speed*1.25);
});
test('a fully absorbed hit cannot trigger star',()=>{const g=quiet();Object.assign(g.s.trophies.chosen,{pelican:'ascendant',travestia:'star'});g.damage(10,'touch');assert.equal(g.s.trophies.starLife,0);assert.equal(g.s.trophies.cooldowns.star,0);});
test('engine advances trophy combat and clocks only during playing simulation',()=>{
 const g=quiet();g.s.trophies.chosen.pelican='tarot';g.s.trophies.cooldowns.tarot=.1;g.spawnEnemy('tank',100,0);g.update(.05);assert.ok(g.s.trophies.cooldowns.tarot<.1);g.pause();const state=JSON.stringify(g.s.trophies);g.update(.2);assert.equal(JSON.stringify(g.s.trophies),state);g.resume();g.update(.1);assert.ok(g.s.trophies.tarot);assert.ok(g.s.trophies.cooldowns.tarot>7);
});
