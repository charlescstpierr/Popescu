import test from 'node:test';
import assert from 'node:assert/strict';
import {OPENING} from '../dist/opening.js';
import {encounterPresentation} from '../dist/dialogue-presentation.js';
const text=["Hein ? Pourquoi j’ai plus accès à ma vie fake ? Pourquoi ?! WTF ?!","J’existe même pas pis il me tape déjà sur les nerfs.","Écoute, ferme-la ! Toutes les femmes me veulent ! Même celles qui existent pas.","T’as raison. Check les singes qui te courent après !","Hein ? Où ça ?"];
test('approved opening keeps every exact line and speaker in order',()=>{
 assert.deepEqual(OPENING.map(l=>l.text),text);
 assert.deepEqual(OPENING.map(l=>l.who),['TOMA','BLONDE IA','TOMA','BLONDE IA','TOMA']);
});
test('each approved line owns its large portrait',()=>{
 assert.deepEqual(OPENING.map(line=>encounterPresentation({line}).portraits[0]),['assets/dialogue-toma.png','assets/dialogue-companion-1.png','assets/dialogue-toma.png','assets/dialogue-companion-1.png','assets/dialogue-toma.png']);
});
test('the final reaction leads directly into the game',()=>{
 assert.equal(OPENING.at(-1).reply,'Il se retourne. Les singes arrivent.');
 assert.equal(OPENING.at(-1).action,'BANG ! C’EST PARTI');
});
import {Game} from '../dist/engine.js';
import {beginTutorial} from '../dist/opening.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
test('Toma turns toward the approaching gorilla as the opening ends',()=>{
 const g=new Game();const before=g.s.aimArtView;beginTutorial(g);
 const enemy=g.s.enemies[0];
 const expected=Math.atan2(enemy.y-g.s.y+40,enemy.x-g.s.x);
 assert.ok(Math.abs(g.s.heroMotion.angle-expected)<1e-9);
 assert.notEqual(g.s.aimArtView,before);
 assert.deepEqual(restoreRun(captureRun(g)).s.heroMotion,g.s.heroMotion);
});
import {app} from './helpers/focus-controller.js';
test('every approved opening cursor restores verbatim before starting play',async()=>{
 for(let index=0;index<OPENING.length;index++){
  const a=app(new Map());await a.click('play');for(let i=0;i<index;i++)a.click('next-dialogue');
  assert.equal((await a.controller.persistRun()).ok,true);
  const b=app(a.values);await b.click('resume-saved');b.click('resume');
  assert.equal(b.get('dialogue-text').textContent,OPENING[index].text);
  assert.equal(b.get('dialogue-progress').textContent,`${index+1} / 5`);
  assert.equal(b.game.s.elapsed,0);assert.equal(b.game.s.enemies.length,0);
  for(let i=index;i<OPENING.length;i++)b.click('next-dialogue');
  assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.enemies.length,1);
 }
});
test('saved legacy opening lines and cursor remain unchanged after updating',async()=>{
 const a=app(new Map());await a.click('play');await a.controller.persistRun();
 const record=JSON.parse(a.values.get('toma-popescu-run-v1'));
 record.run.snapshot.dialogue.lines=[{who:'TOMA',opening:'fantasy',text:'Ancienne première carte.'},{who:'SYSTÈME',opening:'offline',text:'IA HORS LIGNE.'},{who:'TOMA',opening:'street',text:'Ancienne dernière carte.'}];
 record.run.snapshot.dialogue.index=1;a.values.set('toma-popescu-run-v1',JSON.stringify(record));
 const b=app(a.values);await b.click('resume-saved');b.click('resume');
 assert.equal(b.get('dialogue-progress').textContent,'2 / 3');assert.equal(b.get('dialogue-text').textContent,'IA HORS LIGNE.');
 assert.equal(b.get('encounter-name').textContent,'SYSTÈME');
 b.click('next-dialogue');b.click('next-dialogue');assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.enemies.length,1);
});
