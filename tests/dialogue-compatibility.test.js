import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {PELICAN_BANTER,PELICAN_BANTER_LEGACY_REPLIES} from '../dist/pelican.js';
import {TRAVESTIA_BANTER,TRAVESTIA_BANTER_LEGACY_REPLIES} from '../dist/travestia.js';
import {ROOSTER_REACTION,BARKS,STUNT_BARKS,RIVAL_BARKS,UPGRADES} from '../dist/content.js';

test('requested boss lines stay exact and new Toma answers are distinct',()=>{
 assert.equal(ROOSTER_REACTION.text,'Men, farmes ta criss de gueule !');
 assert.deepEqual(TRAVESTIA_BANTER[0],['Vas-y Toma, je sais que tu veux toucher ma queue, touche-la Toma','FUCKK !']);
 assert.ok(PELICAN_BANTER.some(p=>p[0]==='Viens passer la nuit chez mononcleee, il va gâter ton petit Poisson !'));
 for(const pairs of [PELICAN_BANTER,TRAVESTIA_BANTER])assert.equal(new Set(pairs.map(p=>p[1])).size,pairs.length);
 for(const rows of [BARKS,STUNT_BARKS,RIVAL_BARKS])assert.equal(new Set(rows.map(p=>p.text)).size,rows.length);
});
for(const [type,replies] of [['pelican',PELICAN_BANTER_LEGACY_REPLIES],['travestia',TRAVESTIA_BANTER_LEGACY_REPLIES]])test(`all original ${type} replies survive save/resume and fire once`,()=>{
 for(const text of replies){
  const g=new Game({seed:42}),e=g.spawnEnemy(type,60,0);g.world.collides=()=>false;
  if(type==='pelican')Object.assign(e,{peliReply:text,peliReplyPending:true,peliReplyTime:.02});
  else Object.assign(e,{phase:'tail_windup',tailTime:.72,tailWarning:4.2,tailReply:text,tailReplyPending:true});
  const snapshot=captureRun(g),events=[],r=restoreRun(snapshot,{onEvent:(t,p)=>events.push([t,p])});r.world.collides=()=>false;
  assert.deepEqual(captureRun(r),snapshot);
  r.updateEnemies(.03);r.updateEnemies(.03);
  assert.equal(events.filter(([t,p])=>t==='bark'&&p.text===text).length,1);
  const corrupted=structuredClone(snapshot),boss=corrupted.game.s.enemies[0];boss[type==='pelican'?'peliReply':'tailReply']='unknown forged line';
  assert.throws(()=>restoreRun(corrupted));
 }
});
test('stored modal dialogue and upgrade wording need no text migration',()=>{
 const g=new Game({seed:42});g.s.mode='dialogue';const ui={index:0,lines:[{who:'TOMA',text:'Old dialogue kept verbatim.'}]};
 const snapshot=captureRun(g,ui);assert.equal(snapshot.dialogue.lines[0].text,ui.lines[0].text);assert.equal(restoreRun(snapshot).s.mode,'dialogue');
 g.s.mode='upgrade';g.s.options=[{...UPGRADES[0],name:'Previous name',desc:'Previous description'}];
 assert.deepEqual(restoreRun(captureRun(g)).s.options,g.s.options);
});
