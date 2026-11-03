import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {computeHeroPose} from '../dist/hero-pose.js';
function game(){const g=new Game({seed:42});for(const k of Object.keys(g.timers))g.timers[k]=100000;g.nextEvent=100000;return g;}

test('gait distance records accepted world movement rather than held input or time',()=>{
  const g=game();assert.equal(g.s.walkDistance,0);g.update(.05,{x:1,y:0});assert.ok(Math.abs(g.s.walkDistance-7.2)<1e-7);g.update(.05,{x:1,y:0});assert.ok(Math.abs(g.s.walkDistance-14.4)<1e-7);assert.equal(computeHeroPose(g.s).art.frameIndex,1);
  const distance=g.s.walkDistance;g.update(.2);assert.equal(g.s.walkDistance,distance);assert.equal(g.s.walkMoving,false);
  const building=g.world.getVisible(0,0,1200,1200).find(p=>p.type==='building'&&p.solid);g.s.x=building.x-building.w/2-13;g.s.y=building.y;g.update(.2,{x:1,y:0});assert.equal(g.s.walkDistance,distance);assert.equal(g.s.walkMoving,false);
});

test('gait freezes in every modal mode and starts at phase zero when the split finishes',()=>{
  const g=game();g.update(.1,{x:1,y:0});for(const mode of ['paused','upgrade','dialogue']){g.s.mode=mode;const before=g.s.walkDistance;g.update(.2,{x:1,y:0});assert.equal(g.s.walkDistance,before);}
  g.s.mode='playing';g.s.walkDistance=123;g.s.stunt={kind:'split',active:true,progress:1.29/1.3,time:1.29,duration:1.3,count:1,faceX:1,faceY:0};g.update(.02,{x:1,y:0});assert.equal(g.s.stunt.active,false);assert.equal(g.s.walkDistance,0);assert.equal(computeHeroPose(g.s).art.frameIndex,0);g.update(.02,{x:1,y:0});assert.ok(g.s.walkDistance>0&&g.s.walkDistance<10);
});
