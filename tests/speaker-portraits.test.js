import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {encounterPresentation} from '../dist/dialogue-presentation.js';
import {EVENTS,INTRO} from '../dist/content.js';
import {OPENING} from '../dist/opening.js';

const context=actorType=>({actorType,sceneId:actorType==='companion'?'companion:invocation':actorType==='charles'?'charles:0':`boss:${actorType}`,companionRank:3});
const speakers=[['TOMA','toma','TOMA POPESCU'],['BLONDE IA','companion','BLONDE IA'],['CHARLES','charles','CHARLES'],['PÉLI ZODIAQUE','pelican','PÉLI ZODIAQUE'],['TRAVESTIA','travestia','TRAVESTIA']];
for(const [who,speakerType,name] of speakers)test(`${who}: portrait follows speaker even in another actor's scene`,()=>{
 for(const owner of ['charles','pelican','travestia','companion']){
  const model=encounterPresentation({line:{who,text:'Réplique'},context:context(owner)});
  assert.equal(model.speakerType,speakerType);assert.equal(model.name,name);assert.equal(model.actorType,owner);assert.equal(model.sceneId,context(owner).sceneId);
  assert.ok(model.portraits.length);if(speakerType==='companion')assert.deepEqual(model.portraits,['assets/companion-portrait-3.png']);
  else if(speakerType!=='toma')assert.deepEqual(model.portraits,[`assets/dialogue-${speakerType}.png`]);
 }
});
test('opening and ordinary dialogues use their own speaker without requiring an encounter',()=>{
 for(const line of [...OPENING,...INTRO,...EVENTS.companion]){
  const model=encounterPresentation({line,context:null});assert.ok(model);assert.equal(model.speakerType,line.who==='TOMA'?'toma':line.who==='BLONDE IA'?'companion':null);
 }
 for(const who of ['SYSTÈME','INCONNU']){const model=encounterPresentation({line:{who,text:'Message'},context:context('pelican')});assert.equal(model.speakerType,null);assert.deepEqual(model.portraits,[]);assert.equal(model.name,who);}
});
test('real controller swaps the portrait on each companion line and restores exact speaker and rank',async()=>{
 const a=app();await a.click('play');a.game.s.upg.girlfriend=3;a.game.s.companion=true;a.game.startDialogue(EVENTS.companion);
 for(let index=0;index<EVENTS.companion.length;index++){
  const who=EVENTS.companion[index].who,src=a.get('encounter-portrait').src;
  assert.equal(a.get('encounter-name').textContent,who==='TOMA'?'TOMA POPESCU':who);
  assert.match(src,who==='TOMA'?/toma/:/companion-portrait-3/);assert.match(a.get('encounter-description').textContent,/Blonde IA, niveau 3/);
  assert.equal((await a.controller.persistRun()).ok,true);
  const b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');b.click('resume');
  assert.equal(b.get('encounter-portrait').src,src);assert.equal(b.game.encounters.active.index,index);assert.equal(b.game.encounters.active.actorType,'companion');
  a.click('next-dialogue');
 }
 assert.equal(a.controller.screen,'hud');
});
for(const type of ['pelican','travestia','charles'])test(`${type}: save checkpoints keep scene identity while the portrait follows both speakers`,()=>{
 const g=new Game({seed:43});g.setPausedEncountersEnabled(true);
 if(type==='charles'){g.s.elapsed=1200;g.s.mode='victory';g.startCharlesEpilogue();for(let i=0;i<280&&g.s.mode==='playing';i++)g.update(1/60);assert.equal(g.s.mode,'dialogue','Charles finishes his existing protected arrival before speaking');}else{g.world.collides=()=>false;g.s.shotClock=1000;const e=g.spawnEnemy(type,100,0);e.cooldown=0;g.update(.01);}
 for(let index=0;index<2;index++){
  const before=captureRun(g),r=restoreRun(before);assert.deepEqual(captureRun(r),before);
  const c=r.dialoguePresentation(),line=r.encounters.active.lines[index],model=encounterPresentation({line,context:c});
  assert.equal(c.actorType,type);assert.equal(model.speakerType,line.who==='TOMA'?'toma':type);assert.equal(model.actorType,type);
  r.update(.25);assert.deepEqual(captureRun(r),before);g.advanceEncounterDialogue(g.encounters.active.id,index);
 }
});
test('AUTO, blur and visibility cannot advance or restore an obsolete speaker',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=app();await a.click('play');a.game.startDialogue(EVENTS.companion);const first=a.get('encounter-portrait').src;
 a.click('auto-dialogue');a.events.blur();a.document.hidden=true;a.documentEvents.visibilitychange();t.mock.timers.tick(60000);assert.equal(a.get('encounter-portrait').src,first);assert.equal(a.game.encounters.active.index,0);
 a.events.focus();t.mock.timers.tick(60000);assert.equal(a.game.encounters.active.index,0);a.document.hidden=false;a.documentEvents.visibilitychange();t.mock.timers.tick(Math.max(2500,EVENTS.companion[0].text.length*48));assert.equal(a.game.encounters.active.index,1);assert.notEqual(a.get('encounter-portrait').src,first);
 a.click('skip-dialogue');t.mock.timers.tick(60000);assert.equal(a.controller.screen,'hud');assert.equal(a.game.encounters.active,null);
});
test('opening preserves every action, explanatory reply and manual progression',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=app(new Map());await a.click('play');
 for(let i=0;i<OPENING.length;i++){
  assert.equal(a.get('encounter-name').textContent,OPENING[i].who==='TOMA'?'TOMA POPESCU':'SYSTÈME');assert.equal(a.get('next-dialogue').textContent,OPENING[i].action);assert.equal(a.get('opening-reply-text').textContent,OPENING[i].reply);
  t.mock.timers.tick(60000);assert.equal(a.get('dialogue-progress').textContent,`${i+1} / 3`);a.click('next-dialogue');
 }
 assert.equal(a.controller.screen,'hud');
});
test('ordinary companion dialogue announces its current rank without an encounter identity',async()=>{
 const a=app();await a.click('play');a.game.s.upg.girlfriend=4;a.game.s.companion=true;a.game.startDialogue([{who:'BLONDE IA',text:'Dialogue ordinaire.'}]);
 assert.equal(a.game.encounters.active,null);assert.match(a.get('encounter-description').textContent,/Blonde IA, niveau 4/);
});
