import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {ANIMALS,ANIMAL_FRAMES} from '../dist/animals.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {app} from './helpers/focus-controller.js';
function empty(g){g.world.chunks.clear();for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++)g.world.chunks.set(`${x},${y}`,[]);g.world.collisionBounds=new WeakMap();g.world.collisionRegion=null;}
function due(g,index=0){g.s.elapsed=30;g.timers.animalIndex=index;g.timers.spawn=0;g.timers.animal=0;for(const key of ['pack','horde','rival','chest'])g.timers[key]=100000;g.bossDirector.remaining=100;}
function box(g,e){const f=ANIMAL_FRAMES[e.type];return {x:g.viewport.width/2+e.x-g.s.x-f.size/2,y:g.viewport.height*.48+e.y-g.s.y+f.anchorY+f.top,width:f.size,height:f.size};}
const overlaps=(a,b,pad=0)=>a.x+a.width>b.x-pad&&a.x<b.x+b.width+pad&&a.y+a.height>b.y-pad&&a.y<b.y+b.height+pad;
// Without HUD input the first northbound introduction is hidden by the real header region.
test('initial entry avoids supplied header, banter, joystick and companion rectangles',()=>{
 const g=new Game({seed:42});empty(g);due(g);Object.assign(g.s,{walkMoving:true,travelX:0,travelY:-1});
 const rects=[{x:0,y:0,width:390,height:72},{x:12,y:140,width:366,height:80},{x:24,y:669,width:110,height:110},{x:200,y:720,width:177,height:65}];g.viewport.occlusions=rects;g.spawnWave(.01);const e=g.s.enemies.find(e=>ANIMALS[e.type]);assert.ok(e);for(const r of rects)assert.equal(overlaps(box(g,e),r,6),false);
});
test('inner rings find a safe clear point when HUD covers every outer-perimeter cell',()=>{
 const g=new Game({seed:42});empty(g);due(g);g.viewport.occlusions=[{x:0,y:0,width:390,height:150},{x:0,y:694,width:390,height:150},{x:0,y:0,width:70,height:844},{x:320,y:0,width:70,height:844}];g.spawnWave(.01);const e=g.s.enemies.find(e=>ANIMALS[e.type]);assert.ok(e);assert.ok(Math.hypot(e.x,e.y)>=120);for(const r of g.viewport.occlusions)assert.equal(overlaps(box(g,e),r,6),false);
});
test('occlusion setter clips and bounds measured rectangles without retaining mutable inputs',()=>{
 const g=new Game(),rects=[{x:-20,y:-10,width:100,height:50},{x:380,y:830,width:80,height:90},{x:900,y:0,width:10,height:10}];assert.equal(typeof g.setViewportOcclusions,'function');g.setViewportOcclusions(rects);assert.deepEqual(g.viewport.occlusions,[{x:0,y:0,width:80,height:40},{x:380,y:830,width:10,height:14}]);rects[0].x=80;assert.equal(g.viewport.occlusions[0].x,0);g.setViewportOcclusions(Array.from({length:50},()=>({x:0,y:0,width:10,height:10})));assert.equal(g.viewport.occlusions.length,24);g.setViewport(844,390);assert.equal(g.viewport.occlusions,undefined);
});
for(const bad of ['bad',null,Array.from({length:25},()=>({x:0,y:0,width:1,height:1})),[{x:-1,y:0,width:1,height:1}],[{x:0,y:0,width:10,height:-1}],[{x:389,y:0,width:10,height:10}],[{x:0,y:0,width:10,height:10,extra:1}]])test(`invalid HUD save rectangles rejected: ${JSON.stringify(bad).slice(0,60)}`,()=>{const save=captureRun(new Game());save.game.viewport.occlusions=bad;assert.throws(()=>restoreRun(save),/Invalid/);});
test('legacy v13 absence and exact stored HUD masks round-trip without a version change',()=>{const g=new Game({seed:17});const legacy=captureRun(g);assert.equal(legacy.version,13);assert.equal(legacy.game.viewport.occlusions,undefined);assert.deepEqual(captureRun(restoreRun(legacy)),legacy);g.viewport.occlusions=[{x:0,y:0,width:390,height:106},{x:20,y:600,width:110,height:110}];const snapshot=captureRun(g),b=restoreRun(snapshot);assert.deepEqual(captureRun(b),snapshot);due(g);due(b);g.spawnWave(.01);b.spawnWave(.01);assert.deepEqual(captureRun(b),captureRun(g));b.pause();const paused=captureRun(b);b.update(.2);assert.deepEqual(captureRun(b),paused);});
test('actual app controller collects measured HUD rectangles only before a due initial attempt',async()=>{
 const clock={now:()=>0},a=app(undefined,undefined,clock,{left:100,top:50,width:390,height:844});await a.click('play');let reads=0;const elements=[{getBoundingClientRect(){reads++;return {left:100,top:50,width:390,height:72};}},{getBoundingClientRect(){reads++;return {left:120,top:650,width:110,height:110};}}];
 a.document.querySelectorAll=selector=>selector.includes('#joystick')?elements:[];due(a.game);a.controller.frame(16);assert.deepEqual(a.game.viewport.occlusions,[{x:0,y:0,width:390,height:72},{x:20,y:600,width:110,height:110}]);assert.equal(reads,2);
 a.controller.frame(32);assert.equal(reads,2,'no geometry scan during ordinary frames');a.game.timers.spawn=0;a.game.timers.animal=0;a.controller.frame(48);assert.equal(reads,4);a.game.timers.animalIndex=4;a.game.timers.spawn=0;a.game.timers.animal=0;a.controller.frame(64);assert.equal(reads,4,'later arrivals do not read HUD geometry');
});

test('a completely covered tiny playfield defers without overlapping or consuming the due species',()=>{
 const g=new Game({seed:42});empty(g);g.setViewport(240,320);due(g);g.setViewportOcclusions([{x:0,y:0,width:240,height:320}]);let collisionCalls=0;const collides=g.world.collides.bind(g.world);g.world.collides=(...args)=>{collisionCalls++;return collides(...args);};
 g.spawnWave(.01);assert.equal(g.timers.animalIndex,0);assert.equal(g.s.enemies.some(e=>ANIMALS[e.type]),false);assert.ok(collisionCalls<10,'HUD rejects candidates before collision scans');assert.equal(g.s.enemies.length,1,'ordinary slot still follows current pacing');
 g.s.enemies=[];g.setViewportOcclusions([]);g.timers.spawn=0;g.spawnWave(.01);assert.equal(g.timers.animalIndex,1);assert.equal(g.s.enemies[0].type,'ostrich');
});
test('later arrivals ignore HUD inputs and retain identical RNG and placement',()=>{
 const a=new Game({seed:914}),b=new Game({seed:914});for(const g of [a,b]){empty(g);due(g,4);}a.setViewportOcclusions([{x:0,y:0,width:390,height:844}]);a.spawnWave(.01);b.spawnWave(.01);assert.deepEqual(a.s.enemies,b.s.enemies);assert.equal(a.rng,b.rng);
});
test('actual app uses scaled canvas-relative DOM bounds and ignores hidden elements',async()=>{
 const a=app();await a.click('play');a.get('world').getBoundingClientRect=()=>({left:50,top:80,width:195,height:422});let hiddenReads=0;
 a.document.querySelectorAll=()=>[{getClientRects:()=>[],getBoundingClientRect(){hiddenReads++;throw new Error('hidden');}},{getClientRects:()=>[{}],getBoundingClientRect:()=>({left:60,top:180,width:55,height:55})}];due(a.game);a.controller.frame(16);assert.deepEqual(a.game.viewport.occlusions,[{x:20,y:200,width:110,height:110}]);assert.equal(hiddenReads,0);
});
test('actual app conservatively merges excess overlay bounds rather than dropping them',async()=>{
 const a=app();await a.click('play');a.document.querySelectorAll=()=>Array.from({length:28},(_,i)=>({getBoundingClientRect:()=>({left:i*10,top:100,width:8,height:10})}));due(a.game);a.controller.frame(16);assert.equal(a.game.viewport.occlusions.length,24);assert.deepEqual(a.game.viewport.occlusions[23],{x:230,y:100,width:48,height:10});
});
