import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../dist/engine.js';
import {updateTrophyEffects} from '../dist/trophy-effects.js';
import {captureRun,restoreRun,RunStore} from '../dist/run-save.js';
const blank=()=>({chosen:{},pending:[],cooldowns:{tarot:0,ascendant:0,panache:0,star:0,fanclub:0},tarot:null,panache:null,starLife:0,feedback:null});
const run=()=>{const g=new Game({seed:123});g.s.trophies=blank();return g;};
const copy=x=>JSON.parse(JSON.stringify(x));
const fixture=()=>JSON.parse(readFileSync(new URL('./fixtures/runstore-v8.json',import.meta.url),'utf8'));
test('genuine v8 record migrates to v10 without changing travel or crediting trophies',()=>{
 const old=fixture();assert.equal(old.version,8);assert.equal(old.run.snapshot.game.s.trophies,undefined);
 let raw=JSON.stringify(old);const store=new RunStore({getItem:()=>raw,setItem:(_k,v)=>raw=v});const read=store.read();assert.equal(read.status,'ready');assert.equal(read.value.version,13);
 const g=restoreRun(read.value.run.snapshot);assert.deepEqual(g.s.trophies,blank());assert.equal(g.s.travelX,.6);assert.equal(g.s.travelY,.8);assert.equal(g.s.coins,7);
 assert.ok(store.checkpoint('real-v8-run',g).ok);assert.equal(JSON.parse(raw).version,13);
});
test('legacy schemas cannot smuggle trophy state, provenance or charm',()=>{
 const old=fixture().run.snapshot;old.game.s.trophies={...blank(),chosen:{pelican:'tarot'}};old.game.s.chests=[{id:old.game.id++,x:0,y:0,open:false,openedAt:0,bossType:'pelican',bossId:1}];old.game.s.enemies[0].trophyCharmLife=2;
 const g=restoreRun(old);assert.deepEqual(g.s.trophies,blank());assert.equal(g.s.chests[0].bossType,undefined);assert.equal(g.s.chests[0].bossId,undefined);assert.equal(g.s.enemies[0].trophyCharmLife,undefined);
});
test('valid chosen effects persist exactly and remain independent',()=>{
 const g=run();g.id=20;Object.assign(g.s.trophies,{chosen:{pelican:'tarot',travestia:'panache',matriarch:'fanclub'},tarot:{x:110,y:0,originX:0,originY:0,dx:1,dy:0,age:.4,hitOut:[1,2],hitBack:[]},panache:{x:0,y:0,dx:1,dy:0,life:.2,hitIds:[1,2]},feedback:{id:'tarot',life:.5,amount:18}});g.s.trophies.cooldowns.tarot=7.6;
 const s=captureRun(g);assert.equal(s.version,13);const restored=restoreRun(s);assert.deepEqual(captureRun(restored),s);assert.notEqual(restored.s.trophies,g.s.trophies);
});
test('rejects malformed choices, cooldowns, effect ownership and attack bounds',()=>{
 const bad=[t=>t.chosen.pelican='badge',t=>t.chosen.fake='tarot',t=>t.cooldowns.tarot=8.1,t=>t.cooldowns.ascendant=-1,t=>t.cooldowns.star=Infinity,t=>t.cooldowns.fanclub=19,t=>t.starLife=2.1,t=>t.starLife=1,t=>t.feedback={id:'badge',life:.5,amount:2},t=>t.pending=[{bossType:'pelican',bossId:1,chestId:2}],t=>t.tarot={x:0,y:0,originX:0,originY:0,dx:1,dy:0,age:0,hitOut:[],hitBack:[]}];
 for(const change of bad){const s=captureRun(run());change(s.game.s.trophies);assert.throws(()=>restoreRun(s));}
 const g=run();g.id=400;g.s.trophies.chosen={pelican:'tarot',travestia:'panache'};g.s.trophies.tarot={x:110,y:0,originX:0,originY:0,dx:1,dy:0,age:1.2,hitOut:[1,2],hitBack:[2]};g.s.trophies.panache={x:0,y:0,dx:1,dy:0,life:.2,hitIds:[]};
 for(const change of [t=>t.tarot.age=2,t=>t.tarot.x=111,t=>t.tarot.dx=2,t=>t.tarot.hitBack=[3,4],t=>t.tarot.hitOut=[1,1],t=>t.tarot.hitOut=[400],t=>t.panache.life=.36,t=>t.panache.dy=1,t=>t.panache.hitIds=[1,1],t=>t.panache.hitIds=Array.from({length:301},(_,i)=>i+1)]){const s=captureRun(g);change(s.game.s.trophies);assert.throws(()=>restoreRun(s));}
});
test('pending choices require opened credited chest with matching unique provenance',()=>{
 const g=run();g.id=6;g.s.chests=[{id:3,x:0,y:0,open:true,openedAt:0,bossType:'pelican',bossId:2}];g.s.trophies.pending=[{bossType:'pelican',chestId:3,bossId:2}];g.s.mode='trophy';const s=captureRun(g);assert.deepEqual(captureRun(restoreRun(s)),s);
 for(const change of [s=>s.trophies.pending=[],s=>s.chests[0].open=false,s=>s.chests[0].bossId=4,s=>s.trophies.pending.push(copy(s.trophies.pending[0])),s=>s.trophies.chosen.pelican='tarot',s=>s.chests[0].bossType='normal']){const bad=copy(s);change(bad.game.s);assert.throws(()=>restoreRun(bad));}
});
test('trophy charm is bounded and requires fanclub ownership on eligible gorillas',()=>{
 const g=run();g.s.trophies.chosen.matriarch='fanclub';const e=g.spawnEnemy('normal',100,100);e.charmed=2;e.trophyCharmLife=2;const s=captureRun(g);assert.deepEqual(captureRun(restoreRun(s)),s);
 for(const value of [-1,2.6,'2']){const bad=copy(s);bad.game.s.enemies[0].trophyCharmLife=value;assert.throws(()=>restoreRun(bad));}
 const bad=copy(s);bad.game.s.trophies.chosen={};assert.throws(()=>restoreRun(bad));
});
test('terminal saves retain queued choice and overflow cannot discard its credited chest',()=>{
 const g=run();g.id=30;g.s.elapsed=1200;g.s.mode='victory';g.s.chests=[{id:3,x:0,y:0,open:true,openedAt:1199,bossType:'pelican',bossId:2}];g.s.trophies.pending=[{bossType:'pelican',chestId:3,bossId:2}];
 for(let id=4;id<20;id++)g.s.chests.push({id,x:100,y:100,open:false,openedAt:0});
 const saved=captureRun(g);assert.equal(saved.game.s.chests.length,12);assert.equal(saved.game.s.chests.some(c=>c.id===3),true);assert.equal(g.s.chests.length,17);assert.deepEqual(captureRun(restoreRun(saved)),saved);
 const malformed=copy(saved);malformed.game.s.mode='trophy';assert.throws(()=>restoreRun(malformed));
 const over=copy(saved);over.game.s.mode='gameover';over.game.s.hp=0;assert.equal(restoreRun(over).s.trophies.pending.length,1);
});
test('actual chest choice resumes without duplicate loot or second trophy',()=>{
 const g=run();g.s.xpNeed=1000;const boss=g.spawnEnemy('pelican',0,0);g.hurt(boss,boss.hp+1);g.updateChests(0);g.openTrophy();assert.equal(g.s.mode,'trophy');
 const saved=captureRun(g),copyGame=restoreRun(saved),coins=g.s.coins,xp=g.s.xp,rng=g.rng;
 assert.equal(copyGame.chooseTrophy('tarot'),true);assert.equal(copyGame.chooseTrophy('ascendant'),false);assert.equal(copyGame.s.coins,coins);assert.equal(copyGame.s.xp,xp);assert.equal(copyGame.rng,rng);
 copyGame.updateChests(0);assert.equal(copyGame.s.coins,coins);assert.equal(copyGame.s.xp,xp);assert.deepEqual(copyGame.s.trophies.chosen,{pelican:'tarot'});
});
test('mid-effect replay stays deterministic across save and resume',()=>{
 for(const chosen of [{pelican:'tarot',travestia:'panache',matriarch:'badge'},{pelican:'ascendant',travestia:'star',matriarch:'fanclub'}]){
  const a=run();a.s.trophies.chosen=chosen;a.s.xpNeed=1000;a.s.aimX=1;a.s.aimY=0;a.s.shotClock=100;
  for(let i=0;i<3;i++){const e=a.spawnEnemy('normal',80+i*25,0);e.hp=e.maxhp=1000;}
  updateTrophyEffects(a,.05);if(chosen.travestia==='star')a.damage(20,'test');
  if(chosen.pelican==='tarot'){assert.ok(a.s.trophies.tarot);assert.ok(a.s.trophies.panache);}else{assert.ok(a.s.enemies.some(e=>e.trophyCharmLife>0));assert.equal(a.s.trophies.starLife,2);}
  const b=restoreRun(captureRun(a));
  for(let i=0;i<90;i++){a.update(1/30,{x:0,y:1});b.update(1/30,{x:0,y:1});assert.deepEqual(captureRun(a),captureRun(b));}
 }
});
test('a freshly defeated boss may remain in enemy array until the next cleanup',()=>{
 const g=run(),boss=g.spawnEnemy('pelican',0,0);g.hurt(boss,boss.hp+1);assert.equal(boss.dead,true);
 const saved=captureRun(g);assert.deepEqual(captureRun(restoreRun(saved)),saved);
 g.s.elapsed=1200;g.s.mode='victory';assert.deepEqual(captureRun(restoreRun(captureRun(g))),captureRun(g));
 const live=copy(saved);live.game.s.enemies[0].dead=false;live.game.s.enemies[0].hp=1;assert.throws(()=>restoreRun(live));
});
test('persisted fanclub cannot invent a third simultaneously charmed gorilla',()=>{
 const g=run();g.s.trophies.chosen.matriarch='fanclub';for(let i=0;i<3;i++){const e=g.spawnEnemy('normal',100+i*20,100);e.charmed=2;e.trophyCharmLife=2;}assert.throws(()=>captureRun(g));
});
