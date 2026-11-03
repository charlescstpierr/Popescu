import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';

const quote='Men, farmes ta criss de gueule !';
function fixture(){const events=[],game=new Game({seed:42,onEvent:(type,payload)=>events.push({type,payload})});game.spawnWave=()=>{};game.story=()=>{};game.world.collides=()=>false;game.state.shotClock=999;return{game,events};}
function advance(game,seconds){for(let t=0;t<seconds;t+=.02)game.update(Math.min(.02,seconds-t));}
const reactions=events=>events.filter(e=>e.type==='bark'&&e.payload.text===quote);

test('Toma says the requested line when the rooster actually crows, after its warning',()=>{
  const{game,events}=fixture();game.spawnEnemy('rival_rooster',120,0);
  advance(game,.5);assert.equal(reactions(events).length,0);
  advance(game,.5);assert.ok(events.some(e=>e.type==='sound'&&e.payload==='rooster'));
  assert.equal(reactions(events).length,1);assert.equal(reactions(events)[0].payload.who,'TOMA');
});

test('two simultaneous crows share one reaction and pending replies do not cover it',()=>{
  const{game,events}=fixture();const a=game.spawnEnemy('rival_rooster',120,0),b=game.spawnEnemy('rival_rooster',-120,0);
  a.windup=.01;b.windup=.01;game.state.companion=true;
  game.pendingStuntReply={at:0,index:0};game.pendingRivalReply={at:0,index:0,id:a.id,type:a.type,ally:false};
  game.update(.02);
  const barks=events.filter(e=>e.type==='bark');assert.equal(reactions(events).length,1);
  assert.equal(barks.at(-1).payload.text,quote);
  assert.ok(game.pendingStuntReply?.at>game.state.elapsed+3);
  assert.ok(game.pendingRivalReply?.at>game.state.elapsed+3);
});

test('a cancelled rooster windup never makes Toma answer a crow that did not happen',()=>{
  const{game,events}=fixture();const rooster=game.spawnEnemy('rival_rooster',120,0);rooster.windup=.1;
  game.state.airplane={active:true,r:440,life:2,x:0,y:0};advance(game,.5);
  assert.equal(reactions(events).length,0);assert.ok(!events.some(e=>e.type==='sound'&&e.payload==='rooster'));
});
