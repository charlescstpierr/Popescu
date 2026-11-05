import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {beginTutorial,updateTutorial,tutorialText} from '../dist/opening.js';
import {UPGRADES} from '../dist/content.js';
import {captureRun,restoreRun} from '../dist/run-save.js';

test('the opening teaches movement, automatic fire and the XP-to-power loop in order',()=>{
 const g=new Game();beginTutorial(g);assert.match(tutorialText(g),/Glisse/);
 updateTutorial(g,{x:1,y:0});assert.match(tutorialText(g),/tir est automatique/i);
 g.s.elapsed=4.3;updateTutorial(g,{x:0,y:0});assert.match(tutorialText(g),/éclats bleus/i);assert.match(tutorialText(g),/expérience/);assert.match(tutorialText(g),/pouvoir/);
 g.s.elapsed=8.1;updateTutorial(g,{x:0,y:0});assert.equal(tutorialText(g),'');
});
test('the collection hint resumes from the saved tutorial clock without a new phase or state',()=>{
 const g=new Game();beginTutorial(g);updateTutorial(g,{x:1,y:0});g.s.elapsed=4.5;const saved=captureRun(g),r=restoreRun(saved);
 assert.deepEqual(captureRun(r),saved);assert.match(tutorialText(r),/éclats bleus/i);assert.equal(r.s.opening.phase,'shoot');
 const before=captureRun(r);tutorialText(r);assert.deepEqual(captureRun(r),before);
});
test('Blonde IA explains why she can function offline before her optional banter',()=>{
 const card=UPGRADES.find(line=>line.id==='girlfriend');assert.match(card.desc,/copie locale/i);assert.match(card.desc,/hors ligne/i);
 for(const mechanic of ['cœurs','esquive','collecte','protection','drones'])assert.match(card.desc.toLowerCase(),new RegExp(mechanic));
});
