import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {MUSIC_SCORE} from '../dist/audio.js';

test('combined movement, power feedback, returning boss and XP bank resume deterministically',()=>{
 for(const difficulty of ['easy','normal','hard','nightmare']){
  const a=new Game({seed:71,difficulty});
  for(const id of ['detox','validation','speed','magnet','followers','money']){a.s.mode='upgrade';a.s.options=[{id}];assert.ok(a.chooseUpgrade(id));}
  a.s.elapsed=150;a.s.hp=a.s.maxhp-10;a.s.invulnerable=100;a.update(.1,{x:1,y:0});
  const boss=a.spawnEnemy('travestia',a.s.x-1701,a.s.y);assert.ok(boss);boss.hp*=.6;boss.bossCharmResistance=8;const id=boss.id,hp=boss.hp;
  a.s.drops=[{kind:'xp',value:216,x:a.s.x-1600,y:a.s.y,life:38,compact:true}];
  let b=restoreRun(captureRun(a));const events=[[],[]];a.onEvent=(t,p)=>events[0].push([t,p]);b.onEvent=(t,p)=>events[1].push([t,p]);
  for(let i=0;i<180;i++){
   for(const g of [a,b]){if(g.s.mode==='upgrade')g.chooseUpgrade(g.s.options[0].id);g.update(1/30,{x:1,y:0});}
   if(i%30===0){assert.deepEqual(captureRun(b),captureRun(a));b=restoreRun(captureRun(b),{onEvent:(t,p)=>events[1].push([t,p])});}
  }
  assert.deepEqual(captureRun(b),captureRun(a));assert.deepEqual(events[1],events[0]);
  const same=a.s.enemies.find(e=>e.id===id);assert.ok(same);assert.ok(same.hp<=hp);assert.ok(Math.abs(same.bossCharmResistance-2)<1e-8);assert.ok(a.s.travelX>0);assert.ok(a.s.drops.some(d=>d.compact&&d.value>=216&&d.x<a.s.x));assert.ok(a.powerEffects.length<=16);
 }
 assert.deepEqual(MUSIC_SCORE.battle,{title:'Égo de guerre',bpm:148,bars:32});
});
