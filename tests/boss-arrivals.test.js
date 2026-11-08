import {createTrophyState} from '../dist/boss-trophies.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
test('boss encounters have a separate seeded non-periodic schedule',()=>{
 const games=Array.from({length:30},(_,seed)=>new Game({seed}));
 for(const game of games)assert.ok(game.bossDirector,'shared boss director required');
 assert.ok(new Set(games.map(g=>g.bossDirector.remaining)).size>20);
 assert.equal(new Set(games.map(g=>g.bossDirector.nextType)).size,3);
});
test('spawning a different major boss never stacks a second encounter',()=>{
 for(const first of ['matriarch','travestia','pelican'])for(const second of ['matriarch','travestia','pelican']){
  const game=new Game();assert.ok(game.spawnEnemy(first,100,0));assert.equal(game.spawnEnemy(second,200,0),null);
 }
});
test('genuine v5 overlap migrates without deleting enemies or progress',()=>{
 const original=JSON.parse(readFileSync(new URL('./fixtures/runstore-v5.json',import.meta.url),'utf8'));
 const game=restoreRun(original.run.snapshot),saved=captureRun(game);
 assert.equal(saved.version,16);assert.deepEqual(saved.game.s,{...original.run.snapshot.game.s,coinsSpent:0,upgradeRerolls:0,evolutions:{},travelX:0,travelY:0,trophies:createTrophyState(),charles:null,survivalDuration:1200});
 assert.equal(game.s.enemies.length,2);assert.ok(game.bossDirector);
 assert.equal(game.spawnEnemy('travestia',500,0),null);
});
test('duplicate Travestia IDs cannot restore a second copy of the same boss',()=>{
 const g=new Game();g.spawnEnemy('travestia',500,0);const snapshot=captureRun(g),duplicate=structuredClone(snapshot.game.s.enemies[0]);duplicate.id=snapshot.game.id++;snapshot.game.s.enemies.push(duplicate);assert.throws(()=>restoreRun(snapshot));
});
test('an expired capped finale receives a fresh five-second warning on endless continuation',()=>{
 const events=[],g=new Game({survivalDuration:1200,onEvent:(t,p)=>events.push([t,p])});for(const k in g.timers)g.timers[k]=100000;g.nextEvent=100000;
 for(let i=0;i<300;i++)g.spawnEnemy('normal',0,0);
 g.bossDirector.remaining=5.01;g.s.elapsed=1133;g.spawnWave(.02);g.s.elapsed=1138;g.spawnWave(5);
 assert.equal(g.bossDirector.remaining,0);assert.equal(g.bossDirector.warned,true);
 g.s.elapsed=1140.01;g.spawnWave(.02);g.s.elapsed=1160.01;g.spawnWave(.02);
 const selected={type:g.bossDirector.nextType,rng:g.bossDirector.rng,bag:[...g.bossDirector.bag]};
 g.s.elapsed=1200;g.s.mode='victory';g.s.enemies.pop();events.length=0;g.continueEndless();g.spawnWave(.02);
 assert.ok(g.s.enemies.every(e=>!['matriarch','travestia','pelican'].includes(e.type)));
 assert.equal(events.filter(([t,p])=>t==='bark'&&p.text.includes('cinq secondes')).length,1);
 assert.deepEqual({type:g.bossDirector.nextType,rng:g.bossDirector.rng,bag:g.bossDirector.bag},selected);
 g.spawnWave(4.99);assert.equal(g.s.enemies.length,299);g.spawnWave(.02);assert.equal(g.s.enemies.length,300);assert.ok(g.s.enemies.some(e=>e.type===selected.type));
});
test('the director does not announce a five-second arrival across the finale boundary',()=>{
 const events=[],g=new Game({survivalDuration:1200,onEvent:(t,p)=>events.push([t,p])});for(const key in g.timers)g.timers[key]=100000;
 g.s.elapsed=1135.01;g.bossDirector.remaining=5.02;g.spawnWave(1/30);
 assert.equal(g.bossDirector.warned,false);
 assert.ok(!events.some(([t,p])=>t==='bark'&&p.text.includes('cinq secondes')));
});
