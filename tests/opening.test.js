import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
let opening={};try{opening=await import('../dist/opening.js');}catch{}

test('opening has five approved turns in the existing theatre',()=>{
 assert.equal(opening.OPENING?.length,5);
 assert.deepEqual(opening.OPENING.map(x=>x.opening),['offline','offline','fantasy','street','street']);
});
test('tutorial starts at zero with exactly one existing gorilla and is idempotent',()=>{
 assert.equal(typeof opening.beginTutorial,'function');
 const g=new Game();opening.beginTutorial(g);opening.beginTutorial(g);
 assert.equal(g.s.elapsed,0);assert.equal(g.s.enemies.length,1);assert.equal(g.s.enemies[0].type,'normal');assert.equal(g.s.opening.phase,'move');
 assert.ok(Math.hypot(g.s.enemies[0].x-g.s.x,g.s.enemies[0].y-g.s.y)>=120);
});
test('waiting for movement does not run simulation; moving releases tutorial',()=>{
 assert.equal(typeof opening.updateTutorial,'function');const g=new Game();opening.beginTutorial(g);
 assert.equal(opening.updateTutorial(g,{x:0,y:0}),false);assert.equal(g.s.elapsed,0);
 assert.equal(opening.updateTutorial(g,{x:1,y:0}),true);assert.equal(g.s.opening.phase,'shoot');
 assert.match(opening.tutorialText(g),/automatique/);g.s.elapsed=9;opening.updateTutorial(g,{x:0,y:0});assert.equal(opening.tutorialText(g),'');
});
test('tutorial state survives checkpoint restore and invalid tutorial phases are rejected',()=>{
 assert.equal(typeof opening.beginTutorial,'function');const g=new Game();opening.beginTutorial(g);
 const snapshot=captureRun(g),copy=restoreRun(snapshot);assert.deepEqual(copy.s.opening,g.s.opening);
 snapshot.game.s.opening.phase='invalid';assert.throws(()=>restoreRun(snapshot));
});
test('non-opening dialogue never receives opening styling',()=>{
 assert.equal(typeof opening.openingStage,'function');assert.equal(opening.openingStage([{who:'TOMA',text:'hello'}],0),null);
 assert.equal(opening.openingStage(opening.OPENING,1),'offline');
});

test('new run opens inside the guaranteed city on a clear street without rerolling seeds',()=>{
 assert.equal(typeof opening.positionNewRun,'function');
 for(let seed=0;seed<1000;seed++){
  const g=new Game({seed}),rng=g.rng,boss=JSON.stringify(g.bossDirector),girlOffset={x:g.s.girl.x-g.s.x,y:g.s.girl.y-g.s.y};
  assert.equal(opening.positionNewRun(g),true);assert.equal(g.s.x,256);assert.equal(g.s.y,512);
  assert.equal(g.world.collides(g.s.x,g.s.y,13),false);assert.equal(g.world.collides(g.s.girl.x,g.s.girl.y,13),false);
  for(let y=-40;y<=40;y+=20)for(let x=-40;x<=40;x+=20)assert.equal(g.world.collides(g.s.x+x,g.s.y+y,13),false);
  assert.equal(g.seed,seed);assert.equal(g.rng,rng);assert.equal(JSON.stringify(g.bossDirector),boss);
  assert.equal(g.s.girl.x-g.s.x,girlOffset.x);assert.equal(g.s.girl.y-g.s.y,girlOffset.y);
  const before=JSON.stringify(g.s);opening.positionNewRun(g);assert.equal(JSON.stringify(g.s),before);
 }
});
test('new urban start keeps tutorial enemy safe and old saves at their original positions',()=>{
 for(const seed of [1,42,12345,983424]){
  const g=new Game({seed});opening.positionNewRun(g);opening.beginTutorial(g);
  assert.equal(g.s.enemies.length,1);const e=g.s.enemies[0];assert.equal(g.world.collides(e.x,e.y,25),false);assert.ok(Math.hypot(e.x-g.s.x,e.y-g.s.y)>=120);
  const round=restoreRun(captureRun(g));assert.deepEqual(round.s,g.s);
  const legacy=new Game({seed});legacy.s.x=-512;legacy.s.y=1024;const saved=captureRun(legacy),restored=restoreRun(saved);assert.equal(restored.s.x,-512);assert.equal(restored.s.y,1024);
 }
});
test('new urban start preserves Charles arrival, transformation and exact save continuation',()=>{
 const a=new Game({seed:71});opening.positionNewRun(a);a.s.elapsed=1200;a.s.mode='victory';assert.equal(a.startCharlesEpilogue(),true);
 const b=restoreRun(captureRun(a));for(let i=0;i<90;i++){a.update(1/30,{x:.2,y:.6});b.update(1/30,{x:.2,y:.6});assert.deepEqual(captureRun(a),captureRun(b));}
 const c=a.s.charles;a.s.shotClock=100;c.phase='recover';c.phaseTime=c.phaseDuration=2;c.attackCount=2;for(let n=0;n<18;n++)a.hurt(c,1);
 const phases=[];for(let n=0;n<300;n++){a.update(1/30);if(phases.at(-1)!==c.phase)phases.push(c.phase);if(c.powered)break;}
 assert.deepEqual(phases.slice(0,4),['descend','bend','scream','burst']);assert.equal(c.powered,true);
});
