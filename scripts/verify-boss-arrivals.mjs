import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {BOSS_TYPES} from '../dist/boss-director.js';
import {BOSS_TROPHIES} from '../dist/boss-trophies.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {DIFFICULTIES} from '../dist/content.js';
const results=[];
for(const [index,difficulty]of Object.keys(DIFFICULTIES).entries()){
 let victories=0,checkpoints=0,peak=0;const arrivals=[],seen=new Map(),onEvent=type=>{if(type==='victory')victories++;};
 let game=new Game({seed:704+index,difficulty,onEvent});game.nextEvent=1e6;
 for(let frame=0;game.s.elapsed<1500&&frame<20000;frame++){
  if(game.s.mode==='trophy')assert.ok(game.chooseTrophy(BOSS_TROPHIES[game.s.trophies.pending[0].bossType].choices[0]));
  if(game.s.mode==='upgrade')game.chooseUpgrade(game.s.options[0].id);
  if(game.s.mode==='dialogue')game.finishDialogue();
  if(game.s.mode==='victory'){assert.equal(victories,1);game.continueEndless();}
  // Survival/defeats are controlled so this measures the director, not player skill.
  game.s.hp=game.s.maxhp;game.s.invulnerable=1;
  for(const enemy of game.s.enemies.filter(e=>BOSS_TYPES.includes(e.type)&&!e.dead)){
   if(!seen.has(enemy.id)){seen.set(enemy.id,game.s.elapsed);arrivals.push({type:enemy.type,at:+game.s.elapsed.toFixed(3)});}
   if(game.s.elapsed-seen.get(enemy.id)>=30)game.hurt(enemy,1e9);
  }
  game.update(.25,{x:Math.cos(frame/57),y:Math.sin(frame/57)});
  assert.notEqual(game.s.mode,'gameover');
  assert.ok(game.s.enemies.filter(e=>BOSS_TYPES.includes(e.type)&&!e.dead).length<=1);
  assert.ok(game.s.enemies.length<=300);peak=Math.max(peak,game.s.enemies.length);
  if(frame%160===0&&game.s.mode!=='dialogue'){
   const snapshot=captureRun(game);game=restoreRun(snapshot,{onEvent});assert.deepEqual(captureRun(game),snapshot);checkpoints++;
   const before=JSON.stringify(game.bossDirector);if(game.s.mode==='playing'){game.pause();game.update(.25);assert.equal(JSON.stringify(game.bossDirector),before);game.resume();}
  }
 }
 assert.ok(game.s.elapsed>=1500);assert.equal(victories,1);assert.ok(game.s.endless);assert.ok(arrivals.length>=7);
 for(let i=1;i<arrivals.length;i++)assert.notEqual(arrivals[i].type,arrivals[i-1].type);
 assert.equal(new Set(arrivals.map(e=>e.type)).size,3);
 results.push({difficulty,elapsed:game.s.elapsed,victories,endless:game.s.endless,checkpoints,peakEnemies:peak,arrivals});
}
console.log(JSON.stringify({status:'pass',purpose:'Real engine 20-minute victory plus 5-minute endless, controlled survival and boss defeats',results},null,2));
