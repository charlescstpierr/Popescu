import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
let opening={};try{opening=await import('../dist/opening.js');}catch{}

test('opening has three concise cards and an explicit improve action',()=>{
 assert.equal(opening.OPENING?.length,3);
 assert.equal(opening.OPENING[0].action,'AMÉLIORER MA VIE');
 assert.deepEqual(opening.OPENING.map(x=>x.opening),['fantasy','offline','street']);
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
