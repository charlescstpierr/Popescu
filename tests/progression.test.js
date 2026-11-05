import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {UPGRADES} from '../dist/content.js';

test('retained XP opens successive upgrades without another pickup and freezes time',()=>{
  const events=[];const g=new Game({onEvent:t=>events.push(t)});
  g.gainXP(50);assert.equal(g.s.level,2);assert.equal(g.s.xp,42);
  g.chooseUpgrade(g.s.options[0].id);
  assert.equal(g.s.mode,'upgrade');assert.equal(g.s.level,3);assert.equal(g.s.xp,23);
  g.update(.2,{x:1,y:0});assert.equal(g.s.elapsed,0);assert.equal(g.s.x,0);
  g.chooseUpgrade(g.s.options[0].id);
  assert.equal(g.s.mode,'playing');assert.equal(g.s.level,3);assert.equal(g.s.xp,23);
  assert.equal(events.filter(t=>t==='upgrade').length,2);
  assert.equal(g.chooseUpgrade('muscle'),false);assert.equal(g.s.level,3);
});

test('exact XP threshold also chains consumable upgrades after all ranks are exhausted',()=>{
  const g=new Game();for(const u of UPGRADES)g.s.upg[u.id]=u.max||5;g.s.evolutions={billionaire:true,viralLove:true};
  g.gainXP(27);g.chooseUpgrade('payday');
  assert.equal(g.s.mode,'upgrade');assert.equal(g.s.level,3);assert.equal(g.s.xp,0);assert.equal(g.s.coins,8);
  g.chooseUpgrade('payday');assert.equal(g.s.mode,'playing');assert.equal(g.s.coins,16);
  assert.equal(g.chooseUpgrade('payday'),false);assert.equal(g.s.coins,16);
});

test('companion dialogue preserves the next earned upgrade and keeps simulation paused',()=>{
  const g=new Game();g.gainXP(50);g.s.options=[{id:'girlfriend'}];g.chooseUpgrade('girlfriend');
  const choices=g.s.options;g.startDialogue([{who:'BLONDE IA',text:'Bonjour'}]);g.update(.2);
  g.finishDialogue();assert.equal(g.s.mode,'upgrade');assert.equal(g.s.options,choices);assert.equal(g.s.level,3);assert.equal(g.s.elapsed,0);
  g.chooseUpgrade(g.s.options[0].id);assert.equal(g.s.mode,'playing');assert.equal(g.s.xp,23);
});


test('automatic Charles arrival preserves earned upgrade choices for endless continuation',()=>{
  const events=[];const g=new Game({onEvent:t=>events.push(t)});
  g.s.elapsed=1199.99;g.s.drops=[{x:0,y:0,kind:'xp',value:50,life:10}];g.update(.02);
  assert.equal(g.s.mode,'playing');assert.equal(g.s.charles.phase,'intro');assert.equal(events.filter(t=>t==='epilogue-start').length,1);assert.equal(events.filter(t=>t==='victory').length,0);
  const choices=g.s.options;assert.equal(choices.length,3);assert.equal(g.s.level,2);
  g.leaveCharlesEpilogue();g.continueEndless();assert.equal(g.s.mode,'upgrade');assert.equal(g.s.options,choices);
  const elapsed=g.s.elapsed;g.update(.1);assert.equal(g.s.elapsed,elapsed);
  g.chooseUpgrade(choices[0].id);assert.equal(g.s.level,3);assert.equal(g.s.mode,'upgrade');
  g.chooseUpgrade(g.s.options[0].id);assert.equal(g.s.mode,'playing');g.update(.02);
  assert.equal(events.filter(t=>t==='victory').length,0);
});
