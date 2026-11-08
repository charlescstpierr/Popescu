import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {DIFFICULTIES} from '../dist/content.js';
import {app} from './helpers/focus-controller.js';

const advance=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.update(Math.min(1/60,seconds-i/60));};
const visible=(a,id)=>!a.get(id).classList.contains('hidden');
function boundary(difficulty='normal'){
 const events=[],g=new Game({survivalDuration:1200,seed:71,difficulty,onEvent:(type,value)=>events.push({type,value})});
 g.s.elapsed=1199.99;g.s.invulnerable=10;g.s.shotClock=100;
 for(const key of ['spawn','pack','horde','rival','boss','animal','ego'])g.timers[key]=10000;
 g.nextEvent=10000;g.spawnEnemy('normal',100,80);
 return {g,events};
}

for(const difficulty of Object.keys(DIFFICULTIES))test(`${difficulty}: crossing 20 minutes starts Charles in flight without victory or confirmation`,()=>{
 const {g,events}=boundary(difficulty);g.update(.02);
 assert.equal(g.s.mode,'playing');assert.equal(g.s.charles?.phase,'intro');assert.equal(g.s.charles.phaseTime,8);
 assert.equal(events.filter(e=>e.type==='epilogue-start').length,1);
 assert.equal(events.filter(e=>e.type==='victory'||e.type==='sound'&&e.value==='victory').length,0);
 const clock=g.s.elapsed,enemies=structuredClone(g.s.enemies),totals=[g.s.kills,g.s.coins,g.s.xp];
 advance(g,3.3);assert.deepEqual(g.s.enemies,enemies);assert.equal(events.some(e=>e.value==='snap'),false);
 advance(g,.9);assert.equal(g.s.enemies.length,0);assert.equal(events.filter(e=>e.value==='snap').length,1);
 advance(g,4.2);assert.equal(g.s.charles.phase,'hover');assert.equal(g.s.mode,'playing');
 assert.equal(g.s.elapsed,clock);assert.deepEqual([g.s.kills,g.s.coins,g.s.xp],totals);
 assert.equal(events.filter(e=>e.type==='epilogue-start').length,1);assert.equal(events.some(e=>e.type==='victory'),false);
 g.continueEndless();assert.equal(g.s.endless,false);g.leaveCharlesEpilogue();assert.equal(g.s.mode,'victory');
 g.continueEndless();g.update(.02);assert.equal(g.s.endless,true);assert.equal(g.s.mode,'playing');
});

test('save before the threshold and during the automatic flight preserves one snap and the survival score',()=>{
 for(const at of [-1,1.3,3.44,3.6]){
  const {g}=boundary();if(at>=0){g.update(.02);advance(g,at);g.pause();}
  const snap=captureRun(g),b=restoreRun(snap),events=[];b.onEvent=(type,value)=>events.push({type,value});
  assert.deepEqual(captureRun(b),snap);if(at>=0){g.resume();b.resume();}
  for(let i=0;i<270;i++){g.update(1/60);b.update(1/60);assert.deepEqual(captureRun(b),captureRun(g));}
  assert.equal(b.s.mode,'playing');assert.equal(b.s.enemies.length,0);assert.equal(events.filter(e=>e.value==='snap').length,at>=3.45?0:1);
 }
});

for(const withXP of [false,true])test(`automatic arrival keeps the HUD, resets held inputs and saves before any result${withXP?' with simultaneous upgrade':''}`,async()=>{
 const a=app();await a.click('play');const g=a.game;
 g.s.elapsed=599.99;g.s.invulnerable=10;g.s.shotClock=100;
 if(withXP)g.s.drops=[{x:g.s.x,y:g.s.y,kind:'xp',value:50,life:10}];
 a.events.keydown({key:'d',target:{}});assert.deepEqual([...a.controller.inputState.keys],['d']);
 g.update(.02);assert.equal(g.s.charles?.phase,'intro');assert.equal(a.controller.screen,'hud');
 assert.equal(visible(a,'results'),false);assert.equal(visible(a,'charles-confirm'),false);assert.equal(visible(a,'charles-banner'),true);
 assert.deepEqual([...a.controller.inputState.keys],[]);assert.doesNotMatch(a.get('time-goal').textContent,/gagn|victoire/i);
 assert.equal(a.sounds.includes('victory'),false);
 const elapsed=g.s.elapsed;assert.equal((await a.controller.persistRun()).ok,true);
 const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');b.click('resume');
 assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.charles.phase,'intro');assert.equal(b.game.s.elapsed,elapsed);
 if(withXP){assert.equal(b.game.s.options.length,3);b.click('pause');b.click('charles-leave');b.click('endless');assert.equal(b.game.s.mode,'upgrade');}
});

test('endless crosses 20 minutes without starting Charles and death still wins the boundary',()=>{
 const {g,events}=boundary();g.s.endless=true;g.update(.02);assert.equal(g.s.charles,null);assert.equal(g.s.mode,'playing');assert.equal(events.some(e=>e.type==='epilogue-start'),false);
 const lethal=boundary();lethal.g.s.invulnerable=0;lethal.g.s.hp=1;lethal.g.spawnEnemy('normal',0,0);lethal.g.update(.02);
 assert.equal(lethal.g.s.mode,'gameover');assert.equal(lethal.g.s.charles,null);assert.equal(lethal.events.some(e=>e.type==='epilogue-start'),false);
});

test('automatic arrival requests a checkpoint immediately rather than waiting for periodic autosave',async()=>{
 let now=100,queue=Promise.resolve();
 const locks={request(_key,fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}},drain=()=>locks.request('toma-popescu-run-v1',()=>{});
 const a=app(undefined,locks,{now:()=>now});await a.click('play');a.controller.frame(now);await drain();
 const before=JSON.parse(a.values.get('toma-popescu-run-v1'));
 a.game.s.elapsed=599.99;a.game.update(.02);now+=16;a.controller.frame(now);await drain();
 const saved=JSON.parse(a.values.get('toma-popescu-run-v1'));
 assert.ok(saved.revision>before.revision);assert.equal(saved.run.snapshot.game.s.charles.phase,'intro');
 assert.equal(saved.run.snapshot.game.s.mode,'playing');assert.equal(a.controller.screen,'hud');
});
